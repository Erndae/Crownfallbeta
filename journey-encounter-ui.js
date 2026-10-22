/* Roadside scenes and their optional board are separate from the Campaign battle. */
function journeyRenderEncounter(event,node,onAction,onSquare){
 document.querySelectorAll('.coach .cbtns .btn').forEach(button=>button.click());
 if(PACK!==RUN.land)setPack(RUN.land);
 onTitle=false;setLandBg(RUN.land);setCircuitData(RUN.circuit);app.classList.remove('play','training-play');
 const esc=value=>String(value||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const battle=event.phase==='skirmish',won=event.phase==='won',lost=event.phase==='escaped';
 const bonus={cache:'$3 supplies collected',market:'$5 supplies collected',shelter:'Next fight: 20% lower target'}[event.kind]||(node.type==='risky'?'Next fight: +20% target · +$8 on victory':'');
 const button=(id,label,ghost=false)=>'<button class="btn '+(ghost?'ghost':'')+'" id="'+id+'">'+esc(label)+'</button>';
 let content='<div class="stop-kicker">'+esc((PACKS.find(p=>p.id===RUN.land)||{}).name)+' · ROADSIDE ENCOUNTER</div><h1>'+esc(node.name)+'</h1><h2>'+esc(event.title)+'</h2><p class="stop-story">'+esc(event.text)+'</p>';
 if(bonus)content+='<div class="stop-benefit">'+esc(bonus)+'</div>';
 if(battle){
  const board=event.board,selected=event.selected,moves=selected==null?[]:legalFor(board,selected),coord=i=>'abcdefgh'[i%8]+(8-Math.floor(i/8));
  content='<div class="stop-kicker">SURPRISE SKIRMISH · '+esc(node.name)+'</div><h1>Clear the road.</h1><p class="stop-story">Capture the enemy Rook to win $2. Tap your piece, then a highlighted square. Your Campaign army and lives are safe.</p><div class="stop-battle-status" aria-live="polite">'+esc(event.message||'Your move.')+' · '+(6-(event.moves||0))+' moves left</div><div class="boardArea"><div class="boardWrap"><div class="board" id="roadsideBoard" aria-label="Roadside skirmish chessboard">';
  content+=board.map((q,i)=>'<button class="sq '+((Math.floor(i/8)+i%8)%2?'d':'l')+(selected===i?' sel':'')+(moves.includes(i)?' stop-legal':'')+'" data-stop-square="'+i+'" aria-label="'+coord(i)+(q?', '+(q.side==='me'?'your ':'enemy ')+TYPE[q.t].name:'')+'">'+(q?pieceSVG(q.t,q.side):'')+(moves.includes(i)?'<span class="ring"></span>':'')+'<span class="coord">'+coord(i)+'</span></button>').join('');
  content+='</div></div></div>'+button('stopRetreat','Slip away · continue',true);
 }else if(won||lost){
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
 app.querySelectorAll('[data-stop-square]').forEach(button=>button.onclick=()=>onSquare(Number(button.dataset.stopSquare)));
 if(!battle)window.scrollTo(0,0);
}
