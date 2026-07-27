# STRAY — phase roadmap

A Goat-Simulator-style street-dog sandbox. Three.js + cannon-es, single self-contained folder
(index.html + vendored libs + audio-assets.js), packaged for Android via Capacitor.

## DONE
- [x] Phase 1 — Core dog controller, chase camera, one street block-out with knockable props.
- [x] Phase 2 — World expansion: side alley, chai stall, parked auto-rickshaw, prop variety, boundary walls.
- [x] Phase 3 — NPCs & critters: humans, cows, chickens, a stray dog with idle→alert→flee AI.
- [x] Ragdoll physics — player dog is 6 jointed bodies (torso/head/4 legs) that flop; manual FLOP
      toggle + auto-ragdoll on hard impact + auto-recovery. NPCs get knocked flying and tumble
      (single-body ragdoll) when rammed, then get up.
- [x] Controls rework — bark moved to B / BARK button; Space = JUMP; added jump physics.
- [x] Stunts — mid-air 360 front/back flips, detected and scored.
- [x] Real audio — CC0 recorded dog woof (BigSoundBank 0612, public domain), trimmed/deepened,
      embedded as a data URI; replaces the synth bark. Cow moo / chicken cluck still synthesized.
- [x] Score + challenge HUD — green score, rotating challenge banner, completion toast, points for
      flips / knocks / scares / ragdolls.
- [x] Rendering upgrade — ACES filmic tone mapping + sRGB, sky-dome gradient, tuned sun/fill/ambient
      with soft shadows, fog; decorative trees, bushes, rocks, and instanced grass framing the scene.

## HONEST NOTE ON THE "LOOK LIKE THE PHOTOS" GAP
The reference shots are Goat Simulator in Unreal Engine: baked global-illumination lightmaps,
photo-scanned PBR assets, sculpted characters. A hand-coded single-file three.js game can get much
closer than it is now, but will not be pixel-identical to that. Phase 7 below is the dedicated push
to close as much of that gap as possible (post-processing, PBR maps, a real imported 3D model).

## REMAINING
- [~] Phase 4 — Dog abilities / interaction:
      - [x] headbutt / charge special move (E / RAM button) — lunges + flings props/critters in a
            cone, plays the model's Headbutt animation, scores; "HARD HEAD" challenge.
      - [x] grab & fling (G / GRAB button) — grabs the nearest PROP OR MOB into the mouth; grabbed
            mobs go limp/flop (state 'grabbed', fixedRotation off), fling sends them to 'knocked'
            (tumble → recover → walk home); scores; "FETCH!" challenge.
      - [ ] sniff to highlight nearby interactables/objectives (optional, not done)
- [~] Phase 5 — Progression & goals:
      - [x] multi-objective "instincts" panel: 3 active objectives at once (top-right, green
            progress) from a 10-objective pool, refilled as completed; matches the reference shot.
      - [x] mutators (Goat-Sim modifiers) cycled with M / MUT: Turbo, Moon Gravity, Giant, Tiny,
            Mega Bounce (speed/jump/scale/world-gravity tweaks).
      - [x] win state ("TOP DOG!" banner when all objectives done) + high-score saved to
            localStorage ('stray_best'), shown as BEST in the score HUD.
      - [ ] recolour dog skins (only size mutators + the grey NPC exist) — optional, not done.
- [x] Phase 6 — Juice & audio polish + fun extras:
      - [x] impact sfx (thud, explosion boom, throne fanfare); dust/debris particle bursts on
            knocks, ragdolls & explosions; screen shake on hard hits; camera wall-collision.
      - [x] LPG gas cylinders EXPLODE on hard hits — fireball+smoke particles, boom, screen shake,
            radial blast that flings props/knocks critters/ragdolls the dog, chain reactions.
            ("DEMOLITION EXPERT" objective.) Explosions are queued & run after world.step (never
            mutate the physics world inside a collide callback — that crashes cannon narrowphase).
      - [x] fixed floating props: group-based props (matka, drum) had child meshes offset up from
            the group origin while the mesh sync pins origin to the body centre — re-centred them.
      - [x] DOG CASTLE + throne quest: stone keep with battlements/towers, a climb ramp, red carpet,
            a golden throne, and rows of dog-slaves that bow when the King nears. "CLAIM THE THRONE"
            objective. Ramp needed a slope-parallel climb-assist + a spatial guard disabling the
            impact-ragdoll near the castle (else climbing reads as a wall slam).
      - [x] JETPACK collectible: bobbing pickup grants fuel; hold JUMP to thrust up with flame
            particles until fuel drains; respawns after 15s.
      - [ ] ambient street loop / music — not added (optional).
- [~] Phase 7 — Visual fidelity push (mostly done):
      - [x] 7a post-processing: EffectComposer + UnrealBloom + OutputPass (ACES). SSAO not added yet.
      - [x] 7b PBR normal maps on ground/road (makeBumpNormal); buildings got windows/shutters/doors
            and pitched hip roofs. (Dog/wall normal maps still optional.)
      - [x] 7c real 3D model — DONE: imported a CC0 rigged+animated dog (Quaternius via Poly Pizza,
            `dog.glb`) with GLTFLoader. Animations: Idle/Walk/Run/Jump/Headbutt/Death. Player ragdoll
            switched to whole-body tumble (plays the Death anim) since the rig can't use the old
            per-limb joints. GOTCHA: must call `skeleton.pose()` BEFORE measuring the bbox/scaling —
            unposed bones collapse the skinned mesh to a point (invisible) and zero the bbox.
      - [x] 7d terrain (flat play-centre rising into rolling grassy hills), gravel roads + dirt
            courtyard, expanded map (lane extended north + fountain plaza, boundaries moved out),
            denser trees/bushes/rocks/grass, sky dome, tuned sun/fill lighting.
- [x] Phase 8 — Front-end & UX: title/menu screen (STRAY + PLAY), pause overlay (Esc / II button)
      with RESUME/RESTART/SOUND toggle, sim freezes while title/paused (scene still renders), mute
      guards on all sfx, restart = reload. Post-Phase-6 fixes also done: dog-slaves are now tinted
      clones of the real model (bug: SkeletonUtils clones need skeleton.pose() AND the wrap must be
      scene.add-ed — it was orphaned); slaves bow forward consistently via a quaternion about the
      up×facing axis; castle got a (non-shadowing) pyramid roof; all props respawn after ~12s away
      from the dog, exploded cylinders re-formed too.
- [x] Phase 9 — Performance pass (done + headless-verified, no errors/regressions): (1) renderer
      `powerPreference:'high-performance'` + device-pixel-ratio capped to 1.5 on coarse-pointer/phones
      (fill-rate is the mobile bottleneck), 2× on desktop; (2) sun shadow map 2048→1024 with a TIGHT
      ±32u frustum that FOLLOWS the dog each frame (`updateSunFollow`, `scene.add(sun.target)`, constant
      `SUN_OFFSET` so light direction is unchanged) — crisp shadows around the player across the whole
      big map while only ~64×64u is ever shadow-rendered, so distant geometry is auto-excluded from the
      shadow pass; (3) critter animation LOD — leg/tail wobble + the pricey skeletal `mixer.update` are
      skipped for critters >55u from the dog (physics/AI still run). On-device frame-rate check on a real
      mid-range Android is still pending an actual device (do it during Phase 10).
      Still available if more is needed later: merge static building/wall geometry to cut draw calls,
      half-res bloom, instanced trees/bushes.
- [x] Phase 10 — Android packaging (DONE; on-device test still pending a physical phone): Capacitor 8
      wrap (`appId com.jayantkarnan.stray`, webDir `www/`), landscape-locked (`sensorLandscape`), paw-
      print icon + splash generated via `@capacitor/assets` from `assets/icon.png` + `assets/splash.png`
      (drawn with headless-Chrome canvas). Signed release built with `JAVA_HOME=~/jdk21 ./gradlew
      assembleRelease bundleRelease` → `release_files/STRAY-release.apk` (v2-signed, verified, minSdk 24)
      + `STRAY-release.aab` (for Play). Keystore lives OUTSIDE the project at
      `~/Projects/stray_keystore/stray-release.jks` (pw in `PASSWORD.txt`) so the dev http server can't
      expose it — BACK IT UP; losing it blocks all future Play updates. versionCode 1 / versionName 1.0.0.
      Rebuild after any index.html change: `cp` game files → `www/`, `npx cap sync android`, then gradle.
      TODO: install the APK on a real phone to check controls + frame-rate; then submit the AAB to Play.

## cannon-es gotchas (keep in mind)
- Bodies driven by direct velocity/force after being idle need `allowSleep = false`.
- Direct-velocity movement fights contact friction; keep ground↔dog/critter friction near-zero and
  handle stopping in code.
- Toggling a body between kinematic-upright and tumbling: set `fixedRotation` then call
  `updateMassProperties()` so inertia is recomputed (used for NPC knock-and-recover).

## Extra content pass (post-Phase-8, on user request)
- [x] Railway on the west side: gravel-ballast track between two stone tunnel portals; a speeding
      train loops through and LAUNCHES the dog (ragdoll + big air), plus any props/critters on the
      rails. West zone opened via a gap in the left building row + moved boundaries. "TRAIN SURFER"
      objective. Honk sfx.
- [x] Construction site + climbable CRANE: lattice tower + jib/counterweight/hook; hug the tower and
      hold forward/JUMP to climb straight up to the top platform (needed a no-impact-ragdoll guard
      near the crane, like the castle ramp).
- [x] Homepage redesign: gradient title card (paw prints, gold STRAY, glowing PLAY) + a "?" HOW TO
      PLAY overlay (controls + things-to-do).
- [x] Funny background music: procedural oom-pah tuba + bouncy square melody + woodblock loop
      (`startMusic`/`musicTick`, setInterval step sequencer), starts on PLAY, respects mute.

## Fix round on the extra content
- [x] Train now runs ~once every 3 min (first pass ~12s in), not constantly.
- [x] Train horn = mellow two-tone diesel horn; volume scales with dog↔train distance (silent past ~55u).
- [x] Fixed entities sinking "under" the outer terrain: physics ground is a flat plane, so the visual
      terrain is kept flat across the whole bounded area (mask threshold 58→92); hills only rise
      beyond the walls. Verified dog/props rest at y≈0.31 in outer corners.
- [x] Railway track lengthened (z -46..102) so it runs through BOTH tunnels and off into the distance;
      trees/bushes/rocks filtered out of the track corridor (x -26..-14) and the crane footprint.
- [x] Crane top is now a solid WALKABLE deck (5×5) with railings + cabin; climb crests onto it and the
      dog can roam the top. Jib/counterweight raised above the deck so they don't block standing.
- [x] Background music made clearly audible + funnier (fat tuba bass, off-beat "pah" chords, buzzy
      sawtooth kazoo melody, louder woodblock).

## MAP EXPANSION — two new districts + a zoo of new mobs (user request)
Pushed the world north (z 80→128) and east (x 33→58) with two fully-built districts. The flat-terrain
mask was switched from a radius to a RECTANGLE (x[-40,64] z[-34,136]) so every new district stays
perfectly flat (no entity sinking); hills only rise beyond that rectangle. Trees/bushes are now
excluded from both district footprints via `inCorridor`.
- [x] Connecting ROADS (user follow-up): NORTH doglegs around the castle's EAST flank into the maidan
      (the lane is blocked by the castle) — link quad at z50 + a bypass strip up x≈9.3 + a spur fanning
      into the maidan toward the pitch/temple; EAST a reinforced gravel spine leads the alley into the
      chowk. All are thin `addFlatQuad(...roadTex, gravelNormal, 0.021)` patches just above the ground.
- [x] NORTH — Sabzi Mandi & Cricket Maidan & Temple: three striped-awning veg stalls with throwable
      produce (`addProduce` spheres) + a watermelon pile; a cricket pitch with stumps and a grabbable
      **cricket ball** (`body.isCricketBall` → GULLY CRICKET objective); a temple (plinth/sanctum/
      pillars/stacked shikhara + gold kalash) and a **hanging bell** that DINGs on impact (collide
      listener → `playBell` + TEMPLE BELL objective).
- [x] EAST — Chowk & Dhaba & Garbage dump: a roundabout island with lamppost, parked auto-rickshaws
      (`buildAuto`), a dhaba shack with counter + throwable plastic chairs (`addChair`), and a trash
      mound with scattered throwables.
- [x] NEW MOBS (all obey the critter contract, so they flee/knock/grab/ragdoll like the originals):
      kids (scaled humans, gigglier), **2 rival street dogs** (tinted model coats; `state:'chase'` —
      they run AT you instead of fleeing), a **charging buffalo/bull** (`charger` → gores the dog into
      a ragdoll on contact), goats, pigs, a cat, crows (black chickens), temple monkeys. New
      `buildQuadMob` factory + `buildMonkey`. Per-type AI params + compact voice synths
      (`playBleat/Grunt/Meow/Caw/Giggle`, routed via `playCritterVoice`).
- [x] WANTED / HEAT system: chaos raises `heat`; at 5★ a **havaldar (cop)** + **broom-aunty**
      (`enforcer`, `state:'pursue'`) hunt the dog and WHACK it (`playWhack`, ragdoll, heat drop). A
      ★-meter HUD (top-left) shows the level; MOST WANTED objective at max heat.
- [x] BARAAT (wedding procession): a decorated parade (arch + band uncles + dhol) marches up the lane
      on a timer; crashing it (`updateBaraat`) throws confetti + BARAAT CRASHER +250.
- [x] New objectives added to the pool: GULLY CRICKET, TEMPLE BELL, MONKEY BUSINESS, BARAAT CRASHER,
      MOST WANTED.
- Verified headless (swiftshader): no JS errors; 35 critters / 66 props spawn; all mob types
      grab+tongue; buffalo-charge, cop-whack, cricket-grab, baraat-crash, bell-ring all fire; every
      district point rests flat at y≈0.32 (no sinking). GOTCHA re-confirmed: keep new top-level build
      blocks AFTER the shared textures/prop helpers; and don't shadow module globals (`_q`) in test
      injectors.

## Web deploy prep (free-hosting plan, user request)
Prepping STRAY for a $0 public web deploy (Cloudflare Pages free tier + itch.io, no paid domain).
- [x] Git repo initialized at `~/Projects/stray` (branch `main`). `.gitignore` excludes `android/`
      (contains `keystore.properties` with the signing password in PLAINTEXT — never let this reach
      a public repo), `www/` (a build-time copy for Capacitor), `node_modules/`, `release_files/`.
- [x] `manifest.json` — installable PWA: fullscreen + `orientation: landscape` (a plain mobile browser
      tab can't lock orientation; an installed PWA can), full icon set, theme color `#ef851d`.
- [x] `sw.js` — cache-first service worker precaching the whole (small, self-contained) game for
      instant repeat loads + offline play; versioned via `CACHE_NAME` (bump on any deploy that changes
      cached files). Registered from `index.html` guarded by `'serviceWorker' in navigator` +
      `location.protocol !== 'file:'`.
- [x] Icon set generated from the Android paw-print icon (`assets/icon.png`, 1024×1024) via Pillow:
      `icons/icon-{16..512}.png`, `icons/favicon.ico` (multi-res), `icons/icon-maskable-512.png` (art
      shrunk to the inner 80% safe-zone so an adaptive/circular mask never clips it).
- [x] Social preview: `icons/og-image.jpg` (1200×630) cropped from the Android splash art; wired via
      Open Graph + Twitter Card meta tags in `<head>`. NOTE: `og:image` is currently a RELATIVE path —
      make it an absolute URL once the game has a live domain, since Facebook/Twitter/Discord crawlers
      generally require absolute URLs to fetch the preview image.
- [x] `<head>` also got a real `<title>`/description, theme-color, and favicon `<link>`s (there were
      none before).
- Headless-verified: index.html loads with zero JS errors after these changes (game logic untouched —
      only `<head>` tags + one small closing `<script>` added); manifest.json is valid JSON; sw.js,
      favicon, and og-image all serve 200 over http. NOTE: could NOT verify the service worker actually
      *installs* headlessly — Chrome's `--dump-dom` (with or without `--virtual-time-budget`) snapshots
      before the SW's async install lifecycle resolves, a known headless-testing limitation, not a code
      issue (the registration follows the standard MDN pattern). Confirm it in a real browser's
      DevTools → Application → Service Workers panel after deploying.
- [ ] Push to GitHub + connect Cloudflare Pages (needs the user's GitHub/Cloudflare accounts — I can't
      create those). Also mirror-publish to itch.io for free discovery.
- [ ] Once live: make `og:image` absolute, add Cloudflare Web Analytics, do a real mobile-browser pass.

## Expansion fix round (user bug report — all fixed + headless-verified)
(Blender MCP is NOT available in this environment, so models were upgraded procedurally in-engine —
also the right call for a single-file offline game + performance with this many characters.)
- [x] WANTED wasn't rising: boosted heat gains (knock-prop +6, knock-mob +12, scare +8, bark +5) and
      slowed decay (3.5→2/s); lowered HEAT_ON 45→35, HEAT_OFF 15→12. Now a short rampage summons the law.
- [x] Cop & aunty "ran away instead of fighting": root cause was the ram-check bowling them over → they
      walked home. Aggressors (bull + enforcers) are now RAM-IMMUNE (`tank` flag) so they shrug off a
      ram and keep coming (you can still GRAB & fling them). Enforcers pursue relentlessly + WHACK
      (lathi/broom swing anim). Distinct models: cop = khaki uniform + navy peaked cap + badge + belt +
      lathi; aunty = sari skirt + pallu + hair bun + bindi + jhaadu.
- [x] Buffalo: rebuilt as a big BLACK buffalo mesh (bulky capsule body, hump, swept horns, thick legs,
      mass 200) — no longer a scaled cow. It's ram-immune and its `chase` state closes distance + GORES
      the dog repeatedly (short cooldown) while you're in sight, instead of fleeing.
- [x] Baraat reworked: a decorated TRUCK (cabin + bed + wheels + marigold garland + flag + arch) leading
      a bobbing band; travels castle(north)→spawn(south) now; STIFF — an `inPath` band shoves props/
      critters and ragdolls the dog (like the train). Crash still awards BARAAT CRASHER +250.
- [x] Humans: better procedural model shared by all humans/kids/vendors/enforcers — tapered kurta torso,
      shoulders/collar, hips, sleeved arms + hands, rounder head with ears/nose/hair/eye-whites, sandals.
- [x] Kids now DROP everything and chase the dog (state `chase`, `angry`, giveup radius 26) when the
      cricket ball is grabbed.
- [x] Monkeys function: `monkeyTrySteal` snatches a nearby light prop (<5kg), carries it overhead
      (`updateMonkeyLoot`), and drops it when knocked/grabbed or when the player grabs it back;
      `stolenBy` props are exempted from the respawn timer.
- Verified headless: no JS errors; heat→40 from chaos, cop+aunty pursue & whack (ragdoll + heat drop);
      buffalo closes 1.7u + gores; baraat moves south + shoves a prop; 5 kids chase on ball theft;
      monkey carries loot 0.55u overhead. Screenshots confirm cop/aunty/buffalo/human/truck models.

## Grab overhaul (user request)
- [x] Grab made reliable: bigger reach (2.6, measured from BOTH the mouth point and the dog body)
      and it now grabs a mob in ANY state (idle/flee/knocked), not just idle — works on cow, human,
      chicken, stray dog, and any movable prop (all verified).
- [x] Goat-Sim TONGUE: an organic pink tongue — a curved, vertically-flattened TubeGeometry rebuilt
      each frame (mouth → sagging midpoint → tip) with a rounded root pad at the snout and a soft
      lobe at the tip; anchored to the dog's face (forward 0.62, +0.12 up ≈ snout height 0.44), it
      droops under its own "weight", stays connected while carried, and retracts on release/ragdoll.
      (Replaced the earlier cuboid box mesh.) NOTE: build the flatten curve in LOCAL space around the
      mouth — geometry.scale()/mesh.scale on a world-space tube squashes it toward the world origin.
- [x] Grab/fling SOUNDS: rising "slurp/bloop" on grab, falling "ptooey/spit" on fling.
