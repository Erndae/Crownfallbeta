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
    if(stop?.encounter && !stop.encounters?.[stop.encounter]?.resolved)return worldShowEncounter();
    if(stop && stop.networkVersion === 2) return worldRequest();
    if(!stop){ RUN.journeyPreview1 = RUN.journeyPreview1 || {}; RUN.journeyPreview1[journeyKey()] = {networkVersion:2, position:'fight-'+(RUN.circuit==='ruler'?0:RUN.ante-1), route:'road', benefitsVersion:1, arrived:false, visited:[], edges:[]}; return worldRequest(); }
    if(stop && stop.route === 'supply' && stop.shopVisited && !stop.shopLeft && !stop.arrived) return shop();
    RUN.inShop = false; B = null; save(); sceneMusic('land');
    journeyPending = journeyKey();
    const r = cityRouteRecord();
    journeyPost('journey-request', {key:journeyPending, stage:RUN.ante, stages:nStages(), ruler:RUN.circuit === 'ruler', land:RUN.land, landName:(PACKS.find(p => p.id === RUN.land) || {}).name || RUN.land, circuit:CIR().name, circuitId:RUN.circuit, destination:stageName(RUN.ante), route:r && r.route, leg:r && r.shopLeft ? 'depart' : 'approach', history:Object.fromEntries(Object.entries(RUN.journeyPreview1 || {}).filter(([k])=>k.startsWith(`${ACH.campaign_epoch || 0}|${RUN.land}|${RUN.circuit}|`)).map(([k,v]) => [k.split('|').at(-1), {route:v.route, arrived:v.arrived !== false}])), stageNames:Array.from({length:nStages()},(_,i)=>stageName(i+1))});
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
    if(r && r.networkVersion === 2){
      if(!r.atShop || r.arrived){ RUN.inShop=false;save();return blindSelect(); }
      const result=journeyOriginalShop();
      const heading=document.querySelector('.shoptitle h2');
      if(heading){const place=journeyGraph(worldData()).byId[r.position];heading.textContent=place.short;heading.style.textTransform='capitalize';heading.style.fontSize='24px';const district=document.createElement('small');district.textContent=place.district;district.style.cssText='display:block;font:12px/1.4 var(--body, sans-serif);text-transform:none;margin-top:4px';heading.append(district);}
      const next=$('#next');if(next){next.textContent='Leave shop · choose next stop';next.onclick=()=>{r.atShop=false;RUN.shop=null;RUN.inShop=false;save();blindSelect();};}
      return result;
    }
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
  function worldData(){
    return {land:RUN.land,circuitId:RUN.circuit,stage:RUN.ante,ruler:RUN.circuit==='ruler',record:cityRouteRecord()};
  }
  function worldRequest(){
    const r=cityRouteRecord();
    if(r.encounter && !r.encounters?.[r.encounter]?.resolved) return worldShowEncounter();
    if(r.atShop) return shop();
    RUN.inShop=false;B=null;journeyPending=journeyKey();save();sceneMusic('land');
    const prefix=`${ACH.campaign_epoch || 0}|${RUN.land}|${RUN.circuit}|`;
    journeyPost('journey-request',{...worldData(),networkVersion:2,key:journeyPending,stages:nStages(),landName:(PACKS.find(p=>p.id===RUN.land)||{}).name,circuit:CIR().name,destination:stageName(RUN.ante),boss:RUN.circuit==='ruler'?RULERS[RUN.land].name:MINIS[RUN.land][RUN.circuit],history:Object.fromEntries(Object.entries(RUN.journeyPreview1||{}).filter(([k])=>k.startsWith(prefix))),stageNames:Array.from({length:nStages()},(_,i)=>stageName(i+1))});
  }
  function worldCommit(d){
    const r=cityRouteRecord(),g=journeyGraph(worldData());
    if(r.encounter && !r.encounters?.[r.encounter]?.resolved)return worldShowEncounter();
    if(!r.hop){
      if(!g.active.some(e=>e.to===d.node))return journeyPost('journey-error',{message:'Choose a connected, reachable location.'});
      r.hop=d.node;save();
    }
    journeyPost('journey-committed',{key:journeyPending,node:r.hop,networkVersion:2});
  }
  function worldArrive(d){
    const r=cityRouteRecord();
    // The saved edge is the authority. Replayed/stale arrivals cannot move the army or pay again.
    if(!r.hop || d.node!==r.hop)return;
    const g=journeyGraph(worldData()),node=g.byId[r.hop];
    if(!node || !g.active.some(e=>e.to===node.id))return;
    r.edges.push([r.position,node.id]);r.position=node.id;r.hop=null;
    if(!r.visited.includes(node.id)){
      r.visited.push(node.id);
      if(node.type==='supply')RUN.money+=5;
      if(node.type==='cache')RUN.money+=3;
      if(node.type==='safer'||node.type==='risky'){r.route=node.type;RUN.fightTarget=null;}
    }
    save();return worldBeginEncounter(node);
  }
  function worldBeginEncounter(node){
    const r=cityRouteRecord();r.encounters=r.encounters||{};
    if(!r.encounters[node.id])r.encounters[node.id]={...journeyEventFor(worldData(),node),place:{id:node.id,type:node.type,name:node.name,boss:!!node.boss}};
    if(r.encounters[node.id].resolved)return worldProceed(node);
    r.encounter=node.id;save();return worldShowEncounter();
  }
  function worldShowEncounter(){
    const r=cityRouteRecord(),event=r&&r.encounters?.[r.encounter];if(!event||event.resolved)return;
    journeyPending=journeyKey();RUN.inShop=false;save();sceneMusic(event.phase==='skirmish'?'battle':'land');
    journeyPost('journey-encounter',{...worldData(),key:journeyPending,networkVersion:r.networkVersion,place:event.place});
    const id=event.node,valid=()=>cityRouteRecord()===r&&r.encounter===id&&!event.resolved;
    return journeyRenderEncounter(event,event.place,action=>{if(valid())worldEncounterAction(action);},square=>{if(valid())worldSkirmishTap(square);});
  }
  function worldEncounterAction(action){
    const r=cityRouteRecord(),event=r&&r.encounters?.[r.encounter];if(!event||event.resolved)return;
    if(action==='listen'&&event.phase==='intro'&&event.kind!=='ambush'){event.phase='story';save();return worldShowEncounter();}
    if(action==='fight'&&event.kind==='ambush'&&event.phase==='intro'){
      event.phase='skirmish';event.board=journeySkirmishBoard(event.variant);event.moves=0;event.selected=null;save();return worldShowEncounter();
    }
    if(action==='retreat'&&event.kind==='ambush'){
      event.phase='escaped';event.resolved=true;r.encounter=null;save();return worldProceed(event.place);
    }
    if(action==='continue'&&(event.kind!=='ambush'||event.phase==='won'||event.phase==='escaped')){
      event.resolved=true;r.encounter=null;save();return worldProceed(event.place);
    }
  }
  function worldSkirmishWin(event){
    event.phase='won';event.selected=null;if(!event.rewardPaid){event.rewardPaid=true;RUN.money+=2;}save();return worldShowEncounter();
  }
  function worldSkirmishTap(square){
    const r=cityRouteRecord(),event=r&&r.encounters?.[r.encounter];
    if(!event||event.resolved||event.phase!=='skirmish'||!Number.isInteger(square)||square<0||square>63)return;
    const board=event.board,piece=board[square];
    if(piece&&piece.side==='me'){event.selected=square;event.message='Choose a highlighted square.';save();return worldShowEncounter();}
    const from=event.selected;
    if(from==null||!board[from]||board[from].side!=='me'||!legalFor(board,from).includes(square)){event.message='Select one of your pieces, then a highlighted square.';return worldShowEncounter();}
    const victim=board[square];board[square]=board[from];board[from]=null;event.selected=null;event.moves++;
    if(victim&&victim.side==='en'&&victim.t==='R')return worldSkirmishWin(event);
    const replies=[];board.forEach((p,i)=>{if(p&&p.side==='en')for(const to of legalFor(board,i)){const v=board[to];replies.push({from:i,to,score:v?(TYPE[v.t]?.val||1):0});}});
    if(!replies.length){if(inCheck(board,'en'))return worldSkirmishWin(event);event.phase='escaped';}
    else{
      replies.sort((a,b)=>b.score-a.score||a.from-b.from||a.to-b.to);const move=replies[0];board[move.to]=board[move.from];board[move.from]=null;
      if(board[move.to].t==='P'&&(move.to<8||move.to>=56))board[move.to]={...board[move.to],t:'Q'};
      event.message=inCheck(board,'me')?'Your King is in check. Find a safe move.':'The patrol responds. Your move.';
      const canMove=board.some((p,i)=>p&&p.side==='me'&&legalFor(board,i).length);
      if(!canMove||event.moves>=6)event.phase='escaped';
    }
    save();return worldShowEncounter();
  }
  function worldProceed(node){
    const r=cityRouteRecord();
    if(r.networkVersion!==2)return legacyArrive(journeyKey());
    if(node.type==='fight'){r.arrived=true;save();journeyPending=null;journeyPost('journey-enter',{key:journeyKey(),location:'fight',record:r});return journeyOriginalSelect();}
    if(node.type==='supply'){r.atShop=true;RUN.shop=null;RUN.inShop=true;save();journeyPending=null;journeyPost('journey-enter',{key:journeyKey(),location:'shop',record:r});return shop();}
    save();return worldRequest();
  }
  function legacyArrive(key){
    const r=cityRouteRecord();
    if(r.route==='supply'&&!r.shopVisited){r.shopVisited=true;RUN.shop=null;RUN.inShop=true;save();journeyPending=null;return shop();}
    if(r.route==='supply'&&!r.shopLeft)return shop();
    r.arrived=true;save();journeyPending=null;cityRouteApply();return journeyOriginalSelect();
  }

  function journeyContinue(){
    if(RUN) return B ? playBlind(true) : (RUN.inShop ? shop() : blindSelect());
    if(draftGet()) return draftResume();
    if(getCarry()) return landsScreen(title);
    if(cityOpeningState()?.phase!=='done')return cityOpening();
    return startNewGame();
  }
  window.addEventListener('message', e => {
    if(e.source !== window.parent || e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const d = e.data;
    if(d.type === 'journey-boot') {
      if(MODE==='campaign' && !RUN && !draftGet() && !getCarry())return cityOpening();
      return;
    }
    if(d.type === 'journey-launch') {
      if(d.mode !== 'campaign' && d.mode !== 'gauntlet') return;
      if(MODE !== d.mode) return goMode(d.mode, d.mode === 'gauntlet' ? (gSummary() ? 'cont' : 'new') : 'journey-open');
      if(d.mode === 'gauntlet') return gSummary() ? gContinue() : gNewRun();
      return journeyContinue();
    }
    if(d.type === 'journey-menu') return title();
    if(d.type === 'journey-pause') {if(RUN) save(); sceneMusic('land'); return;}
    if(d.type === 'journey-commit' && cityRouteRecord()?.networkVersion===2){
      if(!journeyEligible() || d.key!==journeyPending || d.key!==journeyKey())return journeyPost('journey-error',{message:'This journey has changed. Continue from the game menu.'});
      return worldCommit(d);
    }
    if(d.type === 'journey-arrive' && cityRouteRecord()?.networkVersion===2){
      if(journeyEligible() && d.key===journeyPending && d.key===journeyKey())return worldArrive(d);
      return;
    }
    if(d.type === 'journey-commit') {
      if(!journeyEligible() || d.key !== journeyPending || d.key !== journeyKey() || !['safer','supply','risky'].includes(d.route)) return journeyPost('journey-error',{message:'This road is no longer active. Continue from the game menu.'});
      RUN.journeyPreview1 = RUN.journeyPreview1 || {};
      if(!RUN.journeyPreview1[d.key]) RUN.journeyPreview1[d.key] = {route:d.route, arrived:false, networkVersion:1};
      cityRouteApply();
      save(); // a reload resumes this locked road; supplies cannot be awarded again
      journeyPost('journey-committed',{key:d.key, route:cityRouteRecord().route});return;
    }
    if(d.type === 'journey-arrive' && journeyEligible() && d.key === journeyPending && d.key === journeyKey() && cityRouteRecord()) {
      const r=cityRouteRecord(),atShop=r.route==='supply'&&!r.shopVisited;
      const id=atShop?'legacy-shop':'legacy-fight';
      if(!r.encounters?.[id]?.resolved)return worldBeginEncounter({id,type:atShop?'supply':'fight',name:atShop?'Market stop':stageName(RUN.ante),boss:RUN.circuit==='ruler'});
      return legacyArrive(d.key);
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
