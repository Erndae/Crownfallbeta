/* Campaign travel between fights, with durable commitment and arrival. */
if (window.parent !== window && new URLSearchParams(location.search).get('journey') === '1') {
  const journeyOriginalSelect = blindSelect, journeyOriginalStart = startBlind, journeyOriginalShop = shop;
  let journeyPending = null;
  const journeyPost = (type, data = {}) => window.parent.postMessage({type, ...data}, location.origin);
  const journeyKey = cityRouteKey;
  const journeyEligible = () => MODE === 'campaign' && RUN && !MATCH && !RUN.gauntlet && !RUN.won && RUN.ante <= nStages() && (RUN.ante > 1 || (RUN.armyStages || 0) > 0 || RUN.carried);
  const journeyNeedsTravel = () => {
    if(!journeyEligible()) return false;
    const r = cityRouteRecord();
    return !r || r.arrived === false;
  };
  function journeyRequest(){
    const stop = cityRouteRecord();
    if(stop && stop.route === 'supply' && stop.shopVisited && !stop.shopLeft && !stop.arrived) return shop();
    RUN.inShop = false; B = null; save(); sceneMusic('land');
    journeyPending = journeyKey();
    const r = cityRouteRecord();
    journeyPost('journey-request', {key:journeyPending, stage:RUN.ante, stages:nStages(), ruler:RUN.circuit === 'ruler', land:RUN.land, landName:(PACKS.find(p => p.id === RUN.land) || {}).name || RUN.land, circuit:CIR().name, destination:stageName(RUN.ante), route:r && r.route, leg:r && r.shopLeft ? 'depart' : 'approach', history:Object.fromEntries(Object.entries(RUN.journeyPreview1 || {}).map(([k,v]) => [k.split('|').at(-1), {route:v.route, arrived:v.arrived !== false}])), stageNames:Array.from({length:nStages()},(_,i)=>stageName(i+1))});
  }
  blindSelect = function () {
    if(MODE === 'campaign' && RUN && !MATCH && !RUN.gauntlet) roadStart();
    if(journeyNeedsTravel()) return journeyRequest();
    cityRouteApply();
    return journeyOriginalSelect();
  };
  // Direct fight starts cannot bypass an unfinished journey; retries use the saved arrival.
  startBlind = function(){
    if(journeyNeedsTravel()) return journeyRequest();
    return journeyOriginalStart();
  };
  // Only an arrived market stop grants access to the Campaign shop.
  shop = function(){
    if(MODE !== 'campaign' || !RUN || RUN.gauntlet || MATCH) return journeyOriginalShop();
    const r = cityRouteRecord();
    if(!r || r.route !== 'supply' || !r.shopVisited || r.shopLeft || r.arrived){
      RUN.inShop = false; save(); return blindSelect();
    }
    const result = journeyOriginalShop();
    const next = $('#next');
    if(next){ next.textContent = 'Leave shop · return to the road'; next.onclick = () => {
      r.shopLeft = true; RUN.shop = null; RUN.inShop = false; save(); blindSelect();
    }; }
    return result;
  };
  function journeyContinue(){
    if(RUN) return B ? playBlind(true) : (RUN.inShop ? shop() : blindSelect());
    if(draftGet()) return draftResume();
    if(getCarry()) return landsScreen(title);
    return startNewGame();
  }
  window.addEventListener('message', e => {
    if(e.source !== window.parent || e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const d = e.data;
    if(d.type === 'journey-launch') {
      if(d.mode !== 'campaign' && d.mode !== 'gauntlet') return;
      if(MODE !== d.mode) return goMode(d.mode, d.mode === 'gauntlet' ? (gSummary() ? 'cont' : 'new') : 'journey-open');
      if(d.mode === 'gauntlet') return gSummary() ? gContinue() : gNewRun();
      return journeyContinue();
    }
    if(d.type === 'journey-menu') return title();
    if(d.type === 'journey-pause') {if(RUN) save(); sceneMusic('land'); return;}
    if(d.type === 'journey-commit') {
      if(!journeyEligible() || d.key !== journeyPending || d.key !== journeyKey() || !['safer','supply','risky'].includes(d.route)) return journeyPost('journey-error',{message:'This road is no longer active. Continue from the game menu.'});
      RUN.journeyPreview1 = RUN.journeyPreview1 || {};
      if(!RUN.journeyPreview1[d.key]) RUN.journeyPreview1[d.key] = {route:d.route, arrived:false, networkVersion:1};
      cityRouteApply();
      save(); // a reload resumes this locked road; supplies cannot be awarded again
      journeyPost('journey-committed',{key:d.key, route:cityRouteRecord().route});return;
    }
    if(d.type === 'journey-arrive' && journeyEligible() && d.key === journeyPending && d.key === journeyKey() && cityRouteRecord()) {
      const r = cityRouteRecord();
      if(r.route === 'supply' && !r.shopVisited){
        r.shopVisited = true; RUN.shop = null; RUN.inShop = true; save();
        journeyPending = null; return shop();
      }
      if(r.route === 'supply' && !r.shopLeft) return shop();
      r.arrived = true; save();
      journeyPending = null; cityRouteApply(); return journeyOriginalSelect();
    }
  });
  window.addEventListener('load',()=>journeyPost('crownfall-ready'));
  const journeyOriginalModeIntent = modeIntent;
  modeIntent = function(){
    if(rawGet('crownfall-intent') !== 'journey-open') return journeyOriginalModeIntent();
    rawDel('crownfall-intent');
    return journeyContinue();
  };
}
