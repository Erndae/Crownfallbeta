/* Saved Downtown route benefits. Only the selected Stage 2 fight is affected. */
function cityRouteKey(){ return `${ACH.campaign_epoch || 0}|${RUN.land}|${RUN.circuit}|${RUN.ante}`; }
function cityRouteRecord(){
  if(MODE !== 'campaign' || !RUN || MATCH || RUN.gauntlet || RUN.land !== 'street' || RUN.circuit !== 'downtown' || RUN.ante !== 2 || RUN.blind !== 2) return null;
  return (RUN.journeyPreview1 || {})[cityRouteKey()] || null;
}
function cityRouteApply(){
  const r = cityRouteRecord();
  if(!r || r.benefitsVersion || B || !['safer','supply','risky'].includes(r.route)) return;
  r.benefitsVersion = 1;
  if(r.route === 'supply') RUN.money += 5;
  RUN.fightTarget = null; // recalculate once, then the normal target cache handles retries
  save();
}
function cityRoute(){ const r = cityRouteRecord(); return r && r.benefitsVersion === 1 ? r.route : null; }
function cityRouteTarget(t){ const r = cityRoute(); return r === 'safer' ? Math.max(1, Math.round(t * .8)) : r === 'risky' ? Math.round(t * 1.2) : t; }
function cityRouteReward(){ return cityRoute() === 'risky' ? 8 : 0; }
function cityRouteNote(){
  const r = cityRoute();
  const notes = {safer:'Back alley · 20% lower score target for this stage.', supply:'Market street · $5 supplies added to your wallet.', risky:'Rooftop crossing · 20% higher score target. Win this stage for an extra $8.'};
  return r ? `<p class="training-note">${notes[r]}</p>` : '';
}
