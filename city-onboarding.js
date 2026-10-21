/* An isolated, guided training board. No RUN, B, cash or roster is modified. */
let cityTrainingCancel = null;
function cityEndTraining(){ if(cityTrainingCancel){ cityTrainingCancel(); cityTrainingCancel = null; } app.classList.remove('training-play'); }
const cityOriginalTitle = title;
title = function(){ cityEndTraining(); return cityOriginalTitle(); };
const cityOriginalStart = startNewGame;
startNewGame = function(){
  if(MODE !== 'campaign') return goMode('campaign','new');
  cityWelcome();
};
function cityWelcome(){
  cityEndTraining(); leaveBoard(); onTitle=false; setPack('street'); setLandBg(null); sceneMusic('menu');
  app.innerHTML=`<section class="screen city-welcome"><div class="city-kicker">Crown City · Before the journey</div><div class="welcome-king">${pieceSVG('K','me')}</div><h2>Everybody wants<br>a crown.<br><span>Yours starts here.</span></h2><p>Learn to move, capture, and score in a short street-side training fight. Then assemble your army and enter the Campaign.</p><div class="welcome-actions"><button class="btn" id="cityTrain">Play tutorial fight</button><button class="btn ghost" id="citySkip">Skip tutorial · build my army</button><button class="city-text-button" id="cityBack">Back to opening</button></div></section>`;
  $('#cityTrain').onclick=cityTraining;
  $('#citySkip').onclick=()=>cityFinishTraining(true);
  $('#cityBack').onclick=title;
}
function cityFinishTraining(skipped){
  cityEndTraining(); leaveBoard();
  try{localStorage.setItem('crownfall-training',skipped?'skipped':'completed');}catch(e){}
  // Skipping means opting out of the basic cards too. Advanced tips stay available.
  if(skipped){ for(const key of ONBOARD_KEYS) if(key !== 'intro') coachMark(key); }
  else {coachMark('score');coachMark('brilliance');}
  cityOriginalStart();
}
function cityTraining(){
  cityEndTraining(); leaveBoard(); onTitle=false;setPack('street');setLandBg(null);
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
