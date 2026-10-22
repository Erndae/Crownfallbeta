# Crownfall Beta — Campaign journeys

Play at https://erndae.github.io/Crownfallbeta/.

This is the v156-based playable build from the Crownfall Journey Site, including the illustrated Downtown map, crown-shaped initiative dice, and automatic Campaign entry when route travel finishes. Between every Campaign fight, including circuit changes and Ruler battles, choose a route and walk to the next Stage screen. Routes affect the destination fight: Back alley lowers its score target by 20%; Market street grants $5 on commitment; Rooftop crossing raises its target by 20% and grants $8 extra on victory. Targets stay fixed on retries; supplies are granted once, including across refreshes. Each route applies only to its destination fight; Gauntlet and Crown Match are unaffected. Existing selected routes receive benefits when returning to their destination selection screen, without changing a battle already in progress.

## Hosting

GitHub Pages publishes the root of `main`. No build step or server is needed. All images, music and game files are included. `.nojekyll` keeps the static files unchanged.

## Saves

This beta uses the `crownfall-beta-journey-` browser-storage prefix. Campaign, Gauntlet and Legacy remain separate within it. Main Crownfall saves and the earlier Army Limits beta saves are left intact. Progress from the private Journey Site is on a different origin and is not transferred automatically. Cloud saves are disabled for this beta. The old beta service worker is retired without clearing game saves.

## Source and validation

Based on Site source commit `81a9ad5c5d601710c7e5deab1a775472898c60c7`. `game-bridge.js` is the readable copy of the bridge embedded in `game.html`.

Run `node validate-beta.mjs` for syntax, asset and storage-isolation checks. The source build also passed journey commitment, resume, idempotency and message-validation checks. The world-map revision has mobile and desktop browser QA; a full 85-battle Campaign playthrough was not performed.

## Opening and Crown City board

The site opens on the game menu. New Campaign offers a short tutorial fight or an immediate skip to army creation. Training uses an independent board and legal chess moves, and never changes Campaign cash, rosters or battle saves. Skip remains available during training; completion continues to army creation. The road map appears after the first Downtown stage.

`city-onboarding.js` is embedded inside the game closure in `game.html`. `city-board.css` uses the Downtown illustration, muted stone squares, iron edging and amber highlights for Crown City. Other Lands retain their themes. Run `node validate-onboarding.mjs` to check the opening, both tutorial paths, training move legality and scoring, save preservation, and cancellation when leaving training.

Travel commitment and arrival are saved separately. Refreshing before arrival resumes the locked route, while retries keep the same route benefits. The first Campaign battle and Gauntlet do not require travel. Run `node validate-routes.mjs` for route and transition checks.

## Circuit network and optional shops

The scrollable circuit map shows connected branches, battle nodes, markets and the completed route. View whole circuit fits the network; reachable stops are lit. Victories return to the route map instead of opening a shop. Only a chosen market branch opens a shop on arrival. Leave shop returns to the map for the onward travel leg. Safe and dangerous branches skip shopping. Shop inventory, arrival and departure are saved, including across reloads. This restriction applies to Campaign; Gauntlet keeps its Armory flow. Run `node validate-network.mjs` for map connectivity and stop checks.

## Maps for all five Lands

`journey-lands.js` defines each Land's existing terrain artwork, palette, route names and path geometry. Crown City uses street crossings; Iron Kingdom uses ramparts; Olympian Court uses curved approaches; Shattered Realm uses broken zigzags; Fallen Throne uses angular ash roads. The active Campaign Land automatically selects its map for every circuit and Ruler approach. Map nodes show stage names supplied by the game. Shop branches, saved journeys and the mobile travel dock retain their behavior. The main game's saves remain isolated from this beta.

## Beta soundtrack

Twelve original instrumental tracks live in `soundtrack/`: a title theme, separate travel/menu and battle tracks for each of the five lands, and a dedicated Crownless King theme. Land selection previews that land’s travel theme; the tutorial uses Crown City battle music. Returning to the route map restores travel music. Volume, mute, crossfades and background pause use the existing music manager; legacy music is preserved. `soundtrack/manifest.json` lists titles and generation provenance. Run `node validate-music.mjs` to check routing and audio assets.

## World-location route revision

Every circuit now has four distinct battle locations and a named boss destination; each Ruler has a final stronghold. `journey-world.js` is the shared source for all 85 battle names, map destinations and shop locations. Existing boss names, combat rules and campaign progression remain intact.

New journeys use a connected graph of individual stops, with one to four onward connections, forks, merges, optional shops and direct shortcuts. Junctions reveal the next connections; caches pay $3 once; shops pay $5 once on arrival and open the store. Shelters set the next fight to an 80% target, while danger stops set it to 120% with $8 extra on victory. The last shelter or danger visited determines that fight’s approach. Shops and caches preserve it. All fights remain mandatory.

Each edge is saved before departure. Refresh resumes that destination; rewards cannot be repeated, and leaving a shop returns to its exact node. Only connected nodes are accepted by the game bridge. Existing version-1 journeys finish on their original locked route; the following journey uses the new graph. Save namespaces and the Gauntlet are unchanged.

Run `node validate-world.mjs` for exhaustive route checks (488 paths across 85 stages), alongside the existing beta, route, network, onboarding and music validators. Browser checks cover cache → shelter → battle, optional shop arrival/departure, all five map themes, four-choice junctions, and phone/desktop layouts.

## Overhead location atlas

`journey-cartography.js` draws a street-map background directly in the route map’s coordinates. Each stop has its own building or plaza; road surfaces follow the exact travel paths. Shops have striped storefronts, caches have storage crates, shelters have gardens, and junctions have fountain squares. Battle destinations have halls, stations or fortified strongholds. The harbor has a waterfront and piers. Each land retains its palette, and older saved journeys receive the atlas too. The route map no longer uses a perspective landscape behind floating points.

## Distinct land map artwork

`journey-atlas-themes.js` supplies separate terrain, buildings, landmarks and road surfaces for each land. Crown City has dense brick/glass blocks, roof equipment, lit storefronts, traffic, crossings and transit tracks; its rooftop and midnight circuits emphasize towers and neon. The Iron Kingdom has mountain ridges, castle walls, pine woods, timber houses, caravan stalls and stone keeps. The Olympian Court uses marble temples, columns, olive groves and an Aegean coast. The Shattered Realm has floating islands, crystalline spires, portals and rune bridges over a starry void. The Fallen Throne has fractured bastions, fallen masonry, dead trees and ember fissures. Named woods, fields and bridge/ford locations receive corresponding landmarks. Every land continues to use the exact saved travel graph and location coordinates.
