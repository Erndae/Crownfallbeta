/* Journey preview 1. Presentation-only integration with the v156 game.
   Scoped to the first Downtown transition. No combat or reward functions replaced. */
if (window.parent !== window && new URLSearchParams(location.search).get('journey') === '1') {
  const journeyOriginalSelect = blindSelect;
  let journeyPending = null;
  const journeyPost = (type, data = {}) => window.parent.postMessage({type, ...data}, location.origin);
  const journeyKey = () => `${ACH.campaign_epoch || 0}|${RUN.land}|${RUN.circuit}|${RUN.ante}`;
  blindSelect = function () {
    if (MODE === 'campaign' && RUN && !MATCH && !RUN.gauntlet && RUN.land === 'street' && RUN.circuit === 'downtown' && RUN.ante === 2 && !(RUN.journeyPreview1 && RUN.journeyPreview1[journeyKey()])) {
      RUN.inShop = false; B = null; save();
      journeyPending = journeyKey();
      journeyPost('journey-request', {key:journeyPending});
      return;
    }
    return journeyOriginalSelect();
  };
  window.addEventListener('message', e => {
    if(e.source !== window.parent || e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const d = e.data;
    if(d.type === 'journey-launch') {
      if(d.mode !== 'campaign' && d.mode !== 'gauntlet') return;
      if(MODE !== d.mode) return goMode(d.mode, d.mode === 'gauntlet' ? (gSummary() ? 'cont' : 'new') : 'journey-open');
      if(d.mode === 'gauntlet') return gSummary() ? gContinue() : gNewRun();
      if(RUN) return B ? playBlind(true) : (RUN.inShop ? shop() : blindSelect());
      if(draftGet()) return draftResume();
      if(getCarry()) return landsScreen(title);
      return startNewGame();
    }
    if(d.type === 'journey-menu') return title();
    if(d.type === 'journey-pause') {if(RUN) save(); return;}
    if(d.type === 'journey-commit') {
      if(!RUN || d.key !== journeyPending || d.key !== journeyKey() || !['safer','supply','risky'].includes(d.route)) return journeyPost('journey-error',{message:'This road is no longer active. Continue from the game menu.'});
      RUN.journeyPreview1 = RUN.journeyPreview1 || {};
      if(!RUN.journeyPreview1[d.key]) RUN.journeyPreview1[d.key] = {route:d.route};
      save(); // commit before animation; refresh goes straight to the existing Stage screen
      journeyPost('journey-committed',{key:d.key});return;
    }
    if(d.type === 'journey-arrive' && RUN && d.key === journeyPending && RUN.journeyPreview1 && RUN.journeyPreview1[d.key]) {
      journeyPending = null; return journeyOriginalSelect();
    }
  });
  window.addEventListener('load',()=>journeyPost('crownfall-ready'));
  // Consume only this preview's private intent after a mode reload.
  const journeyOriginalModeIntent = modeIntent;
  modeIntent = function(){
    if(rawGet('crownfall-intent') !== 'journey-open') return journeyOriginalModeIntent();
    rawDel('crownfall-intent');
    if(RUN) return B ? playBlind(true) : (RUN.inShop ? shop() : blindSelect());
    if(draftGet()) return draftResume();
    if(getCarry()) return landsScreen(title);
    return startNewGame();
  };
}
