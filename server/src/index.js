// STRAY multiplayer relay — a single Durable Object ("BazaarRoom") holds every connected player's
// last-known state and relays it to everyone else. This is intentionally NOT authoritative physics:
// each client runs its own dog locally and only ever displays OTHER players as interpolated puppets
// (cannon-es is non-deterministic across machines, so nobody should trust remote physics anyway).
//
// Uses the WebSocket Hibernation API (state.acceptWebSocket / webSocketMessage / webSocketClose) so
// the Durable Object doesn't have to stay resident just to hold idle connections open — cheaper and
// the recommended pattern for exactly this kind of real-time relay.

const MAX_PLAYERS = 60; // safety cap for the free-tier single global room
const COAT_COLORS = [0x8f6a4a, 0x5a5a5a, 0x3a2f28, 0xc9a06a, 0x2c2c2c, 0x9a7a5a, 0x6b4a2e, 0xd0b090];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };
}

export class BazaarRoom {
  constructor(state, env) {
    this.state = state;
  }

  // one player-state broadcast to every socket except the sender
  broadcast(payload, exceptWs) {
    const msg = JSON.stringify(payload);
    for (const ws of this.state.getWebSockets()) {
      if (ws === exceptWs) continue;
      try { ws.send(msg); } catch (e) { /* socket already gone; webSocketClose will clean it up */ }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/stats') {
      try {
        return new Response(JSON.stringify({ players: this.state.getWebSockets().length }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      } catch (e) {
        return new Response('stats error: ' + (e && e.stack || e), { status: 500 });
      }
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }

    if (this.state.getWebSockets().length >= MAX_PLAYERS) {
      return new Response('room full', { status: 503 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const id = crypto.randomUUID().slice(0, 8);
    const coatColor = COAT_COLORS[Math.floor(Math.random() * COAT_COLORS.length)];

    // acceptWebSocket (not server.accept()) enables hibernation: this DO can be evicted from memory
    // between messages and the socket + its attachment survive, driven back to life by an incoming
    // event. serializeAttachment is how per-connection state (id, coat, last position) survives that.
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, coatColor, x: 0, y: 0.32, z: 5, yaw: 0, anim: 'Idle' });

    // tell the newcomer who else is already here
    const existing = this.state.getWebSockets()
      .filter((ws) => ws !== server)
      .map((ws) => ws.deserializeAttachment());
    server.send(JSON.stringify({ type: 'welcome', id, coatColor, players: existing }));

    // tell everyone else a newcomer arrived
    this.broadcast({ type: 'join', id, coatColor }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch (e) { return; }
    if (data.type !== 'state') return;
    const prev = ws.deserializeAttachment() || {};
    const next = {
      id: prev.id, coatColor: prev.coatColor,
      x: +data.x || 0, y: +data.y || 0.32, z: +data.z || 0, yaw: +data.yaw || 0,
      anim: typeof data.anim === 'string' ? data.anim.slice(0, 16) : 'Idle',
      held: !!data.held,
    };
    ws.serializeAttachment(next);
    this.broadcast({ type: 'state', ...next }, ws);
  }

  async webSocketClose(ws, code, reason, wasClean) {
    const info = ws.deserializeAttachment() || {};
    this.broadcast({ type: 'leave', id: info.id }, ws);
    try { ws.close(); } catch (e) { /* already closing */ }
  }

  async webSocketError(ws, error) {
    const info = ws.deserializeAttachment() || {};
    this.broadcast({ type: 'leave', id: info.id }, ws);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    // health check lives on its own path (never GET "/") so it can never collide with — or get
    // edge-cached over — the WebSocket upgrade endpoint at "/"
    if (url.pathname === '/health') {
      return new Response('STRAY multiplayer relay is up', { headers: { 'Cache-Control': 'no-store', ...corsHeaders() } });
    }

    // everything else (the WS upgrade at "/", and "/stats") goes to the single global room —
    // everyone connecting joins the same bazaar instance for v1
    const id = env.BAZAAR_ROOM.idFromName('main');
    const room = env.BAZAAR_ROOM.get(id);
    return room.fetch(request);
  },
};
