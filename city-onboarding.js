/* An isolated, guided training board. No RUN, B, cash or roster is modified. */
let cityTrainingCancel = null;
let cityOpeningTimer=null;
function cityEndTraining(){ clearTimeout(cityOpeningTimer); if(cityTrainingCancel){ cityTrainingCancel(); cityTrainingCancel = null; } app.classList.remove('training-play'); }
const cityOriginalTitle = title;
title = function(){ cityEndTraining(); return cityOriginalTitle(); };
const cityOriginalStart = startNewGame;
startNewGame = function(){
  if(MODE !== 'campaign') return goMode('campaign','new');
  cityOpening(true);
};
// The prologue has its own save: exploring never replaces an existing army.
const CITY_OPENING_KEY='crownfall-city-opening-1';
function cityOpeningState(){try{return JSON.parse(localStorage.getItem(CITY_OPENING_KEY)||'null');}catch(e){return null;}}
function cityOpeningSave(step,phase='map'){try{localStorage.setItem(CITY_OPENING_KEY,JSON.stringify({step,phase}));}catch(e){}}
function cityOpening(fresh=false){
  cityEndTraining();clearTimeout(cityOpeningTimer);leaveBoard();onTitle=false;setPack('street');setLandBg(null);sceneMusic('land');
  const saved=fresh?null:cityOpeningState();
  if(saved?.phase==='tutorial')return cityWelcome();
  const step=Math.max(0,Math.min(2,Number(saved?.step)||0));
  cityOpeningSave(step);
  const places=[[65,260,'South Gate'],[205,175,'Night Market'],[335,80,'The Safehouse']];
  const chapters=[
    ['A city waiting for a spark.','The last train rattles overhead. Below it, shutters close as Vex’s patrol turns the corner. His crown is painted on every toll gate. Even here, at the edge of the city, no one passes without paying.','In your pocket: a rain-soaked note. “Night Market. Come alone. There are still a few of us who haven’t bowed.” A lit street leads into the city.','Walk to Night Market'],
    ['Whispers at the market.','A vendor pulls you out of the rain. “Vex’s patrols took our last champion. The other lands are no better. But a crown can still be won on the board.”','She points toward a rooftop light. “Find the Safehouse. Learn to fight. Gather a crew. Then take this city back.”','Walk to the Safehouse'],
    ['Your first allies.','The Safehouse door opens. A small crew has been waiting for someone willing to challenge Vex. They offer you a place at their practice board.','Your road: learn the moves, build your army, conquer Crown City’s four circuits, then face its ruler. Every stop ahead has a story, supplies, or a fight.','Meet the crew · learn to fight']
  ];
  const c=chapters[step],at=places[step];
  app.innerHTML=`<section class="screen city-prologue"><div class="city-kicker">CROWN CITY · CHAPTER 0</div><div class="opening-top"><h2>Your journey begins.</h2><button class="city-text-button" id="openingMenu">Menu</button></div><div class="opening-map"><svg viewBox="0 0 400 330" role="img" aria-label="Crown City street map. You are at ${at[2]}. The route leads from South Gate through Night Market to the Safehouse."><defs><pattern id="openingBlocks" width="80" height="70" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="54" height="42" rx="4" fill="#293b42" stroke="#405059"/><path d="M18 20h25M18 30h15" stroke="#617079" opacity=".5"/></pattern></defs><rect width="400" height="330" fill="#14262e"/><rect width="400" height="330" fill="url(#openingBlocks)"/><path d="M-10 305Q160 285 220 325T430 295" fill="none" stroke="#267280" stroke-width="29"/><path d="M65 260V210H125V175H205V125H285V80H335" fill="none" stroke="#0c161e" stroke-width="26"/><path id="openingRoad" d="M65 260V210H125V175H205V125H285V80H335" fill="none" stroke="#dfb979" stroke-width="3" stroke-dasharray="6 5"/>${places.map(([x,y,name],i)=>`<circle cx="${x}" cy="${y}" r="20" fill="${i<=step?'#e8bf7e':'#16242b'}" stroke="#e8bf7e" stroke-width="3"/><g transform="translate(${x} ${y}) scale(.6)" style="color:${i<=step?'#14262e':'#e8bf7e'}">${journeyStopLogo(['entry','supply','safehouse'][i],true)}</g><text x="${x}" y="${y+35}" text-anchor="middle" fill="#fff4df" font-size="13" font-family="sans-serif" font-weight="700" paint-order="stroke" stroke="#14262e" stroke-width="5">${name}</text>`).join('')}<text x="25" y="37" fill="#b4c9ce" font-size="12" letter-spacing="3">DOWNTOWN</text><text x="300" y="250" fill="#81979f" font-size="11">VEX TOWER</text><path d="M330 230v-63h22v63m-17-63v-17h12v17" fill="#37434b" stroke="#af758e" stroke-width="2"/><g id="openingTraveler" transform="translate(${at[0]} ${at[1]})"><circle r="25" fill="none" stroke="#ff3b9a" stroke-width="4"/></g></svg><div class="opening-location">YOU ARE HERE · ${at[2]}</div></div><div class="opening-story" aria-live="polite"><h3>${c[0]}</h3><p>${c[1]}</p><p>${c[2]}</p></div><button class="btn" id="openingWalk">${c[3]}</button><div class="city-kicker opening-progress">${step+1} / 3 · Follow the gold street · Pink ring = you</div></section>`;
  $('#openingMenu').onclick=title;
  $('#openingWalk').onclick=()=>{
    if(step===2){cityOpeningSave(2,'tutorial');return cityWelcome();}
    const button=$('#openingWalk');button.disabled=true;button.textContent='Walking…';
    const marker=$('#openingTraveler'),road=$('#openingRoad'),length=road.getTotalLength();
    // Distances on this rectilinear street are 225 to the market, then 225 home.
    const from=step===0?0:225,to=step===0?225:length;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start=Date.now(),duration=reduced?0:1200;
    function move(){const t=duration?Math.min(1,(Date.now()-start)/duration):1,p=road.getPointAtLength(from+(to-from)*t);marker.setAttribute('transform',`translate(${p.x} ${p.y})`);if(t<1){cityOpeningTimer=setTimeout(move,16);return;}cityOpeningSave(step+1);cityOpening();}
    move();
  };
}
function cityWelcome(){
  cityEndTraining(); leaveBoard(); onTitle=false; setPack('street'); setLandBg(null); sceneMusic('menu');
  app.innerHTML=`<section class="screen city-welcome"><div class="city-kicker">Crown City · The Safehouse</div><div class="welcome-king">${pieceSVG('K','me')}</div><h2>Everybody wants<br>a crown.<br><span>Yours starts here.</span></h2><p>Your new crew offers a practice fight before you challenge Vex. Learn to move, capture, and score, then assemble your army.</p><div class="welcome-actions"><button class="btn" id="cityTrain">Play tutorial fight</button><button class="btn ghost" id="citySkip">Skip tutorial · build my army</button><button class="city-text-button" id="cityBack">Back to city map</button></div></section>`;
  $('#cityTrain').onclick=cityTraining;
  $('#citySkip').onclick=()=>cityFinishTraining(true);
  $('#cityBack').onclick=()=>{cityOpeningSave(2);cityOpening();};
}
function cityFinishTraining(skipped){
  cityEndTraining(); leaveBoard();
  try{localStorage.setItem('crownfall-training',skipped?'skipped':'completed');}catch(e){}
  // Skipping means opting out of the basic cards too. Advanced tips stay available.
  if(skipped){ for(const key of ONBOARD_KEYS) if(key !== 'intro') coachMark(key); }
  else {coachMark('score');coachMark('brilliance');}
  cityOpeningSave(2,'done');
  cityOriginalStart();
}
function cityTraining(){
  cityEndTraining(); leaveBoard(); onTitle=false;setPack('street');setLandBg(null);
  sceneMusic('training');
  app.classList.add('play','training-play');
  const board=Array(64).fill(null);
  for(const [i,t,side] of [[60,'K','me'],[56,'R','me'],[57,'N','me'],[4,'K','en'],[42,'R','en'],[24,'P','en']]) board[i]={t,side};
  let step=0,selected=null,score=0,waiting=false,closed=false,timer;
  cityTrainingCancel=()=>{closed=true;clearTimeout(timer);};
  const target=260;
  const coord=i=>'abcdefgh'[i%8]+(8-Math.floor(i/8));
  const lesson=()=>step===0?{from:57,to:42,title:'1 · The Knight jumps',text:'Tap your Knight on b1, then the enemy Rook on c3. Knights move in an L and can jump over pieces.'}:{from:56,to:32,title:'2 · The Rook moves straight',text:'The enemy Pawn moved to a4. Tap your Rook on a1, then capture that Pawn on a4 to reach the target.'};
  function draw(){
    if(closed)return;
    const l=lesson(),won=step===2;
    app.innerHTML=`<div class="training-head"><div><small>CROWN CITY · TRAINING FIGHT</small><h2>Your first moves.</h2></div><button class="city-text-button" id="trainingSkip">Skip tutorial</button></div><div class="training-score"><span>Capture score <b>${score}</b></span><span>Target <b>${target}</b></span></div><div class="boardArea"><div class="boardWrap"><div class="board" id="board" role="group" aria-label="Tutorial chessboard">${board.map((q,i)=>`<button class="sq ${(Math.floor(i/8)+i%8)%2?'d':'l'}${selected===i?' sel':''}${!won&&!waiting&&(i===l.from||selected===l.from&&i===l.to)?' tutorial-hint':''}" data-training-square="${i}" aria-label="${coord(i)}${q?', '+(q.side==='me'?'your ':'enemy ')+TYPE[q.t].name:''}" ${won||waiting?'disabled':''}>${q?pieceSVG(q.t,q.side):''}${selected===l.from&&i===l.to&&!won&&!waiting?'<span class="ring"></span>':''}<span class="coord">${coord(i)}</span></button>`).join('')}</div></div></div><div class="training-note" aria-live="polite">${won?'<b>Training won. Your road begins.</b>You reached 260 points through captures. In the Campaign, reach the target or checkmate to win. Keep your King safe.':waiting?'<b>80 Material × 2 Brilliance = 160</b>Your Knight captured the Rook. Now the enemy responds by moving its Pawn forward.':`<b>${l.title}</b>${l.text}`}</div>${won?'<button class="btn" id="trainingDone">Assemble my army</button>':'<div class="city-kicker" style="text-align:center">Practice only · Your army is safe</div>'}`;
    $('#trainingSkip').onclick=()=>cityFinishTraining(true);
    if(won){$('#trainingDone').onclick=()=>cityFinishTraining(false);return;}
    app.querySelectorAll('[data-training-square]').forEach(el=>el.onclick=()=>tap(+el.dataset.trainingSquare));
  }
  function tap(i){
    if(closed||waiting||step===2)return;
    const l=lesson();
    if(i===l.from){selected=i;draw();return;}
    if(selected!==l.from||i!==l.to){const note=app.querySelector('.training-note');note.innerHTML=`<b>${l.title}</b>Follow the highlighted squares: select ${coord(l.from)}, then ${coord(l.to)}.`;return;}
    if(!legalFor(board,l.from).includes(l.to))return;
    const mover=board[l.from],victim=board[l.to];
    score+=(TYPE[mover.t].chips+TYPE[victim.t].val)*TYPE[mover.t].mult;
    board[l.to]=mover;board[l.from]=null;selected=null;
    try{sfx.tick();}catch(e){}
    if(step===0){waiting=true;draw();timer=setTimeout(()=>{if(closed)return;board[32]=board[24];board[24]=null;step=1;waiting=false;draw();},1600);}
    else {step=2;draw();}
  }
  draw();
}
// The opening now precedes training. Army confirmation still starts the real first battle.
firstGame = function(){
  if(PACK !== 'street')setPack('street');
  if(!(RUN&&RUN.circuit==='downtown'&&RUN.ante===1&&!B))newRun('downtown');
  coachMark('intro');startBlind();
};
