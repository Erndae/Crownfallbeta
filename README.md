# Crownfall Beta — Campaign journeys

Play at https://erndae.github.io/Crownfallbeta/.

This is the v156-based playable build from the Crownfall Journey Site, including the illustrated Downtown map, crown-shaped initiative dice, and automatic Campaign entry when route travel finishes. Between every Campaign fight, including circuit changes and Ruler battles, choose a route and walk to the next Stage screen. Routes affect the destination fight: Back alley lowers its score target by 20%; Market street grants $5 on commitment; Rooftop crossing raises its target by 20% and grants $8 extra on victory. Targets stay fixed on retries; supplies are granted once, including across refreshes. Each route applies only to its destination fight; Gauntlet and Crown Match are unaffected. Existing selected routes receive benefits when returning to their destination selection screen, without changing a battle already in progress.

## Hosting

GitHub Pages publishes the root of `main`. No build step or server is needed. All images, music and game files are included. `.nojekyll` keeps the static files unchanged.

## Saves

This beta uses the `crownfall-beta-journey-` browser-storage prefix. Campaign, Gauntlet and Legacy remain separate within it. Main Crownfall saves and the earlier Army Limits beta saves are left intact. Progress from the private Journey Site is on a different origin and is not transferred automatically. Cloud saves are disabled for this beta. The old beta service worker is retired without clearing game saves.

## Source and validation

Based on Site source commit `81a9ad5c5d601710c7e5deab1a775472898c60c7`. `game-bridge.js` is the readable copy of the bridge embedded in `game.html`.

Run `node validate-beta.mjs` for syntax, asset and storage-isolation checks. The source build also passed journey commitment, resume, idempotency and message-validation checks. Browser visual QA and a full Campaign playthrough were not performed.

## Opening and Crown City board

The site opens on the game menu. New Campaign offers a short tutorial fight or an immediate skip to army creation. Training uses an independent board and legal chess moves, and never changes Campaign cash, rosters or battle saves. Skip remains available during training; completion continues to army creation. The road map appears after the first Downtown stage.

`city-onboarding.js` is embedded inside the game closure in `game.html`. `city-board.css` uses the Downtown illustration, muted stone squares, iron edging and amber highlights for Crown City. Other Lands retain their themes. Run `node validate-onboarding.mjs` to check the opening, both tutorial paths, training move legality and scoring, save preservation, and cancellation when leaving training.

Travel commitment and arrival are saved separately. Refreshing before arrival resumes the locked route, while retries keep the same route benefits. The first Campaign battle and Gauntlet do not require travel. Run `node validate-routes.mjs` for route and transition checks.

## Circuit network and optional shops

The scrollable circuit map shows connected branches, battle nodes, markets and the completed route. View whole circuit fits the network; reachable stops are lit. Victories return to the route map instead of opening a shop. Only a chosen market branch opens a shop on arrival. Leave shop returns to the map for the onward travel leg. Safe and dangerous branches skip shopping. Shop inventory, arrival and departure are saved, including across reloads. This restriction applies to Campaign; Gauntlet keeps its Armory flow. Run `node validate-network.mjs` for map connectivity and stop checks.
