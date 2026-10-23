/* Roadside scenes and their optional board are separate from the Campaign battle. */
function journeyRenderEncounter(event,node,onAction,onSquare){
 document.querySelectorAll('.coach .cbtns .btn').forEach(button=>button.click());
 if(PACK!==RUN.land)setPack(RUN.land);
 onTitle=false;setLandBg(RUN.land);setCircuitData(RUN.circuit);app.classList.remove('play','training-play','patrol-play');
 const esc=value=>String(value||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const battle=event.phase==='skirmish',won=event.phase==='won',lost=event.phase==='escaped';
 if(battle)return journeyRenderPatrol(event,node,onAction,onSquare);
 const bonus={cache:'$3 supplies collected',market:'$5 supplies collected',shelter:'Next fight: 20% lower target'}[event.kind]||(node.type==='risky'?'Next fight: +20% target · +$8 on victory':'');
 const button=(id,label,ghost=false)=>'<button class="btn '+(ghost?'ghost':'')+'" id="'+id+'">'+esc(label)+'</button>';
 let content='<div class="stop-kicker">'+esc((PACKS.find(p=>p.id===RUN.land)||{}).name)+' · ROADSIDE ENCOUNTER</div><h1>'+esc(node.name)+'</h1><h2>'+esc(event.title)+'</h2><p class="stop-story">'+esc(event.text)+'</p>';
 if(bonus)content+='<div class="stop-benefit">'+esc(bonus)+'</div>';
 if(won||lost){
  content+='<div class="stop-result" role="status">'+(won?'The patrol retreats. $2 added to your purse.':'Your company finds a way around the patrol and regroups. Your army and lives are safe.')+'</div>'+button('stopContinue','Continue journey');
 }else if(event.kind==='ambush'){
  content+='<p class="stop-note">Fight a short skirmish for $2, or slip past the patrol. Your Campaign army and lives are safe.</p>'+button('stopFight','Fight the patrol · win $2')+button('stopRetreat','Slip away · continue',true);
 }else{
  if(event.phase==='story')content+='<blockquote class="stop-rumor">'+esc(event.story)+'</blockquote>';
  else if(event.story)content+=button('stopListen','Learn about this place',true);
  content+=button('stopContinue',event.kind==='market'?'Enter shop':event.kind==='battle'?'Enter battle':'Continue journey');
 }
 app.innerHTML='<section class="screen roadside-encounter">'+content+'</section>';
 const actions={'#stopFight':'fight','#stopRetreat':'retreat','#stopListen':'listen','#stopContinue':'continue'};
 for(const [selector,action]of Object.entries(actions)){const button=app.querySelector(selector);if(button)button.onclick=()=>onAction(action);}
 const soundButton=app.querySelector('#stopSound');if(soundButton)soundButton.onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('gambit-sound',soundOn?'on':'off');}catch(e){}if(soundOn)pieceSound('N','move');soundButton.textContent='Sound: '+(soundOn?'On':'Off');};
 app.querySelectorAll('[data-stop-square]').forEach(button=>button.onclick=()=>onSquare(Number(button.dataset.stopSquare)));
 if(!battle)window.scrollTo(0,0);
}

/* Patrols use the main battle's layout, board IDs, theme and move markers.
   Only their objective and actions differ; Campaign battle state stays separate. */
function journeyRenderPatrol(event,node,onAction,onSquare){
 const board=event.board,selected=event.selected,legal=selected==null?[]:legalFor(board,selected);
 const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const remaining=Math.max(0,(event.limit||6)-(event.moves||0)),thinking=event.message==='The patrol is thinking…';
 const inspected=selected==null?event.inspected:selected,piece=inspected==null?null:board[inspected];
 const squares=board.map((q,i)=>{
  const r=Math.floor(i/8),c=i%8,classes=['sq',(r+c)%2?'d':'l'];
  if(i===selected)classes.push('sel');
  if(event.lastMove?.[0]===i)classes.push('lastf');if(event.lastMove?.[1]===i)classes.push('lastt');if(event.enemyMove?.[1]===i)classes.push('lastte');
  if(q?.t==='K'&&inCheck(board,q.side))classes.push('threat','chk');
  let marker='';if(legal.includes(i)){
   const risk=attacksOn(applyMove(board,selected,i),'en').includes(i);
   marker='<span class="'+(q?'ring':'dot')+(risk?' risk':'')+'"></span>';
  }
  return '<button type="button" class="'+classes.join(' ')+'" data-i="'+i+'" data-stop-square="'+i+'" aria-label="'+'abcdefgh'[c]+(8-r)+(q?', '+(q.side==='me'?'your ':'enemy ')+TYPE[q.t].name:'')+'" aria-pressed="'+(selected===i)+'">'+(q?pieceSVG(q.t,q.side,q.e):'')+marker+(c===0?'<span class="coord">'+(8-r)+'</span>':'')+'</button>';
 }).join('');
 const info=piece?'<span class="pi">'+pieceSVG(piece.t,piece.side,piece.e)+'</span><div class="pt"><b>'+(piece.side==='en'?'Enemy ':'Your ')+esc(TYPE[piece.t].name)+'</b><span class="ab">'+esc(MOVES_TXT[piece.t])+'</span></div>':'<span class="muted">Tap a piece to see its moves</span>';
 setLandBg(null);app.classList.add('play','patrol-play');
 document.body.dataset.mood='calm';document.body.dataset.bround=RUN.blind||0;document.body.dataset.opp='normal';document.body.dataset.otreat='';delete document.body.dataset.ruler;delete document.body.dataset.ckf;
 app.innerHTML=`<div class="phud"><div class="pblind"><b>Roadside patrol</b><span class="patrol-location">${esc(node.name)}</span></div><div class="pstats"><div class="blitzmv${remaining<=3?' low':''}"><small>Moves left</small><b id="mv">${remaining}</b></div><div><small>Cash</small><b class="money" id="cash">$${RUN.money}</b></div></div></div>
  <div class="pscore"><div class="sc"><small>Win reward</small><b>$2</b></div><div class="cbox chips"><small>Capture</small><span>Rook</span></div><span class="x">or</span><div class="cbox mult"><small>Deliver</small><span>Mate</span></div></div>
  <div class="pbar"><i style="width:${remaining/(event.limit||6)*100}%"></i><span class="ptgt">${remaining} moves remaining</span></div>
  <div class="handrow"><span class="hand stop-battle-status" id="hand" role="status">${esc(event.message||'Tap a piece, then a target')}</span><span class="mood${inCheck(board,'me')?' check':''}" id="mood"><i></i><span>${thinking?'Patrol thinking':inCheck(board,'me')?'King in check':'Your turn'}</span></span></div>
  <div class="boardArea"><div class="boardWrap" id="bw"><div class="bdecor" id="bdecor"></div><div class="board patrol-board" id="board" aria-label="Roadside patrol chessboard">${squares}</div><div class="fxl" id="fxl"></div></div></div>
  <div class="pinfo${piece?'':' idle'}" id="pinfo">${info}</div>
  <div class="actions four"><button class="btn blue" id="stopSound">Sound: ${soundOn?'On':'Off'}</button><button class="btn ghost" id="stopRules">Rules</button><button class="btn ghost" id="stopRetreat">Slip away</button><button class="btn ghost" id="stopMenu">Menu</button></div>`;
 app.querySelectorAll('[data-stop-square]').forEach(button=>button.onclick=()=>onSquare(Number(button.dataset.stopSquare)));
 app.querySelector('#stopRetreat').onclick=()=>onAction('retreat');
 app.querySelector('#stopMenu').onclick=()=>{save();title();};
 app.querySelector('#stopRules').onclick=()=>modal('<h2>Roadside patrol</h2><p>Capture the patrol’s Rook or deliver checkmate within '+(event.limit||6)+' moves to win $2. Protect your King: the patrol replies after each move.</p><p>Your Campaign army and lives are safe. Slip away to continue travelling without the reward.</p><button class="btn" id="patrolRulesDone">Back to patrol</button>','#patrolRulesDone');
 const sound=app.querySelector('#stopSound');sound.onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('gambit-sound',soundOn?'on':'off');}catch(e){}if(soundOn)pieceSound('N','move');sound.textContent='Sound: '+(soundOn?'On':'Off');};
 applyLandTheme();drawLandDecor();csBoard();
}
