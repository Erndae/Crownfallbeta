# Crownfall Beta — Journey preview 2

Play at https://erndae.github.io/Crownfallbeta/.

This is the v156-based playable build from the Crownfall Journey Site, including the illustrated Downtown map, crown-shaped initiative dice, and automatic Campaign entry when route travel finishes. During the first Downtown Stage 1→2 transition, arrival opens the corresponding Stage screen. Routes currently change the visual journey only; battle rewards and balance are unchanged.

## Hosting

GitHub Pages publishes the root of `main`. No build step or server is needed. All images, music and game files are included. `.nojekyll` keeps the static files unchanged.

## Saves

This beta uses the `crownfall-beta-journey-` browser-storage prefix. Campaign, Gauntlet and Legacy remain separate within it. Main Crownfall saves and the earlier Army Limits beta saves are left intact. Progress from the private Journey Site is on a different origin and is not transferred automatically. Cloud saves are disabled for this beta. The old beta service worker is retired without clearing game saves.

## Source and validation

Based on Site source commit `81a9ad5c5d601710c7e5deab1a775472898c60c7`. `game-bridge.js` is the readable copy of the bridge embedded in `game.html`.

Run `node validate-beta.mjs` for syntax, asset and storage-isolation checks. The source build also passed journey commitment, resume, idempotency and message-validation checks. Browser visual QA and a full Campaign playthrough were not performed.
