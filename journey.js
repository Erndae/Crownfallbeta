'use strict';
const $ = s => document.querySelector(s);
const MAP_KEY = 'crownfall-journey-preview-1';
const ROUTES = {
 safer:{title:'Back alley',label:'THE SAFER ROAD',caption:'KEEP TO THE SHADOWS.',description:'Take cover: the next fight has a 20% lower score target. Standard victory reward. No shop on this branch.',color:'#9db8aa'},
 supply:{title:'Market stop',label:'OPTIONAL SHOP',caption:'FOLLOW THE WARM WINDOWS.',description:'Visit the shop: recruit, buy equipment, and train. Collect $5 for supplies, then travel onward to the next fight. The other branches skip the shop.',color:'#e6be7e'},
 risky:{title:'Rooftop crossing',label:'THE RISKY ROAD',caption:'TAKE THE HIGH ROAD.',description:'Raise the next fight’s score target by 20%. Win for an extra $8. Checkmate still wins. No shop on this branch.',color:'#e66898'}
};
let saved={};try{saved=JSON.parse(localStorage.getItem(MAP_KEY)||'{}')}catch{}
let selected=ROUTES[saved.selected]?saved.selected:null;
let reduced=typeof saved.reduced==='boolean'?saved.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches;
let traveling=false, frameReady=false, launchPending=null, pendingJourney=null, travelToken=0, committed=false;
const frame=$('#gameFrame'), shell=$('#gameShell');
function persist(){try{localStorage.setItem(MAP_KEY,JSON.stringify({selected,reduced}))}catch{}}
function send(type,extra={}){frame.contentWindow?.postMessage({type,...extra},location.origin)}
function applyMotion(){document.body.classList.toggle('reduce-motion',reduced);$('#motionToggle').textContent=reduced?'Motion reduced':'Reduce motion';$('#motionToggle').setAttribute('aria-pressed',String(reduced));persist()}
function selectRoute(id){
 if(networkData.networkVersion===2)return selectWorldStop(id);
 if(traveling||(pendingJourney&&committed)||!ROUTES[id])return;selected=id;committed=false;persist();const r=ROUTES[id];$('#routeActionLabel').textContent=r.title;
 document.querySelectorAll('[data-route]').forEach(el=>{el.classList.toggle('selected',el.dataset.route===id);if(el.matches('.route-card'))el.setAttribute('aria-pressed',String(el.dataset.route===id))});
 $('.route-overlay').classList.add('has-selection');$('#routeNote').style.borderColor=r.color;$('.note-label').style.color=r.color;$('.note-label').textContent=r.label;$('#routeNote p').textContent=r.description;
 $('#setOff').disabled=false;$('#setOff').style.background=r.color;$('#setOffText').textContent=pendingJourney?(pendingJourney.leg==='depart'?'Continue to fight':id==='supply'?'Start route · shop':'Start route · fight'):'Continue Campaign';$('#mapCaption').textContent=r.caption;$('#travelStatus').textContent=pendingJourney?'Your road is saved before you set off.':'Arrive at the destination to enter the Campaign.';
 $('#traveler').setAttribute('transform',`translate(${networkPlan.start.x} ${networkPlan.start.y})`);$('#traveler').classList.remove('arrived');resetCamera();
}
document.querySelectorAll('[data-route]').forEach(el=>{el.addEventListener('click',()=>selectRoute(el.dataset.route));if(el.tagName.toLowerCase()==='g')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRoute(el.dataset.route)}})});
function resetCamera(){if(!traveling)networkCamera(networkPlan.start.x);}
$('#centerMap').onclick=()=>{if(traveling)return;networkOverview=false;sizeJourneyNetwork();$('#mapOverview').textContent='Whole map';resetCamera();};
$('#panLeft').onclick=()=>{if(!traveling)$('#mapWindow').scrollBy({left:-$('#mapWindow').clientWidth*.7,behavior:reduced?'instant':'smooth'})};
$('#panRight').onclick=()=>{if(!traveling)$('#mapWindow').scrollBy({left:$('#mapWindow').clientWidth*.7,behavior:reduced?'instant':'smooth'})};
$('#mapOverview').onclick=()=>{if(traveling)return;networkOverview=!networkOverview;sizeJourneyNetwork();$('#mapOverview').textContent=networkOverview?'Back to my location':'Whole map';resetCamera();};
new ResizeObserver(()=>{sizeJourneyNetwork();if(!traveling)resetCamera();}).observe($('#mapWindow'));
$('#motionToggle').onclick=()=>{reduced=!reduced;applyMotion()};
async function walk(){
 if(networkData.networkVersion===2)return walkWorldStop();
 if(traveling)return;
 if(!pendingJourney)return launch('campaign');
 if(!selected)return;
 if(pendingJourney&&!committed){traveling=true;$('#setOff').disabled=true;$('#setOffText').textContent='Saving your road…';send('journey-commit',{key:pendingJourney.key,route:selected});const key=pendingJourney.key;setTimeout(()=>{if(pendingJourney?.key===key&&traveling&&!committed){traveling=false;$('#setOff').disabled=false;$('#setOffText').textContent='Try setting off again';$('#travelStatus').textContent='The game has not confirmed this road yet.'}},3000);return;}
 focusJourneyMap(true);traveling=true;const token=++travelToken;const routePath=$(`.route-track[data-route="${selected}"] .route-line`),length=routePath.getTotalLength(),duration=reduced?0:3200,start=performance.now();$('#mapWindow').classList.add('is-traveling');$('#mapWorld').style.transition='none';$('#setOff').disabled=true;$('#setOffText').textContent='On the move…';$('#travelStatus').textContent=`Taking the ${ROUTES[selected].title.toLowerCase()}.`;
 function tick(now){if(token!==travelToken)return;const t=duration?Math.min(1,(now-start)/duration):1,ease=t*t*(3-2*t),p=routePath.getPointAtLength(ease*length);const hop=reduced||t===1?0:Math.abs(Math.sin(t*Math.PI*22))*9;$('#traveler').setAttribute('transform',`translate(${p.x} ${p.y-hop})`);networkCamera(p.x,false,p.y);keepJourneyMapVisible();if(t<1){requestAnimationFrame(tick);return;}traveling=false;$('#mapWindow').classList.remove('is-traveling');$('#traveler').classList.add('arrived');$('#mapWorld').style.transition='';$('#setOff').disabled=false;$('#setOffText').textContent='Walk again';$('#travelStatus').textContent='Arrived. Entering the Campaign…';if(pendingJourney){const key=pendingJourney.key,atShop=selected==='supply'&&pendingJourney.leg!=='depart';pendingJourney=null;committed=false;buildJourneyNetwork({...networkData,location:atShop?'shop':'fight'});send('journey-arrive',{key});showGame('campaign');$('#setOffText').textContent='Continue Campaign';$('#panelTitle').textContent='Your journey continues.';$('#panelCopy').textContent=journeyLand(networkData.land).tagline;}else{launch('campaign');}}
 requestAnimationFrame(tick);
}
$('#setOff').onclick=walk;
function showGame(mode){shell.hidden=false;document.body.classList.add('game-open');$('#gameModeLabel').textContent=mode==='gauntlet'?'THE GAUNTLET':'CAMPAIGN';frame.loading='eager'}
function hideGame(){shell.hidden=true;document.body.classList.remove('game-open');$('#navJourney').focus()}
function launch(mode){if(pendingJourney){$('#travelStatus').textContent='Finish choosing your road to continue the Campaign.';$('#setOff').focus();return;}launchPending=mode;showGame(mode);if(frameReady){send('journey-launch',{mode});launchPending=null}}
document.querySelectorAll('[data-launch]').forEach(el=>el.onclick=()=>launch(el.dataset.launch));
$('#backToMap').onclick=()=>{send('journey-pause');hideGame()};$('#gameMenu').onclick=()=>send('journey-menu');$('#navJourney').onclick=hideGame;
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;const d=e.data;if(!d||typeof d!=='object')return;
 if(d.type==='crownfall-intro'){shell.classList.toggle('intro-open',d.active===true);return;}
 if(d.type==='crownfall-ready'){frameReady=true;send('journey-boot');if(launchPending){send('journey-launch',{mode:launchPending});launchPending=null;}}
 if(d.type==='journey-request'&&d.networkVersion===2){requestWorldJourney(d);return;}
 if(d.type==='journey-committed'&&d.networkVersion===2&&pendingJourney?.key===d.key){traveling=false;committed=false;selectWorldStop(d.node);committed=true;walkWorldStop();return;}
 if(d.type==='journey-encounter'){
  pendingJourney=null;traveling=false;committed=false;
  if(d.networkVersion===2)buildJourneyNetwork({...d,location:'encounter'});
  $('#setOff').disabled=false;$('#setOffText').textContent='Return to encounter';$('#routeActionLabel').textContent=d.place?.name||'Your current stop';showGame('campaign');return;
 }
 if(d.type==='journey-enter'&&pendingJourney?.key===d.key){pendingJourney=null;traveling=false;committed=false;buildJourneyNetwork({...networkData,record:d.record,location:d.location});$('#setOff').disabled=false;$('#setOffText').textContent='Continue Campaign';$('#routeActionLabel').textContent='At '+networkPlan.start.name;showGame('campaign');return;}
 if(d.type==='journey-request'){
  travelToken++;traveling=false;committed=false;pendingJourney={key:d.key,leg:d.leg||'approach'};buildJourneyNetwork(d);
  selected=null;persist();$('#routeActionLabel').textContent=d.leg==='depart'?'Ready for the next fight':'Choose your next stop';
  document.querySelectorAll('[data-route]').forEach(el=>{el.classList.remove('selected');if(el.matches('.route-card'))el.setAttribute('aria-pressed','false')});
  $('.route-overlay').classList.remove('has-selection');$('#mapWindow').classList.remove('is-traveling');$('#mapWorld').style.transition='';resetCamera();
  $('#traveler').setAttribute('transform',`translate(${networkPlan.start.x} ${networkPlan.start.y})`);$('#traveler').classList.remove('arrived');
  hideGame();$('#panelTitle').textContent=d.leg==='depart'?'Back on the road.':'Choose your next stop.';
  $('#panelCopy').textContent=`Choose your road to ${d.circuit || 'the next fight'} · ${d.destination || 'Next stage'}. Market stops open shops. Other branches go straight to the fight.`;
  $('#journeyLand').textContent=d.landName || 'Campaign';$('#journeyCircuit').textContent=d.circuit || 'Your journey';
  $('#journeyChapter').textContent=d.ruler?'THE RULER’S ROAD':`STAGE ${d.stage} OF ${d.stages}`;
  $('#journeyLocation').textContent=(d.circuit || 'CAMPAIGN')+' · ON THE ROAD';
  const strip=$('.stage-strip');strip.replaceChildren();
  const count=d.ruler?1:Math.max(1,Math.min(6,Number(d.stages)||4));
  for(let n=1;n<=count;n++){
   if(n>1){const line=document.createElement('div');line.className='stage-line';strip.appendChild(line);}
   const stage=document.createElement('div');stage.className='stage'+(d.ruler||n===d.stage?' current':n<d.stage?' done':'');
   const num=document.createElement('span');num.textContent=d.ruler?'♛':String(n).padStart(2,'0');
   const label=document.createElement('div'),small=document.createElement('small'),name=document.createElement('b');small.textContent=d.ruler?'RULER':`STAGE ${n}`;name.textContent=d.ruler||n===d.stage?(d.destination||'Next fight'):n<d.stage?'Cleared':'Ahead';label.append(small,name);stage.append(num,label);strip.appendChild(stage);
  }
  $('#setOff').disabled=true;$('#setOffText').textContent='Choose a reachable stop';$('.note-label').textContent='YOUR NEXT FIGHT';$('#routeNote p').textContent='Choose a road and its benefit. Your choice locks when you set off.';
  $('#travelStatus').textContent='Choose your road to the next fight.';
  if(ROUTES[d.route]){selectRoute(d.route);committed=true;$('#setOffText').textContent=d.leg==='depart'?'Continue to fight':'Continue this route';if(d.leg==='depart'){$('.note-label').textContent='SHOP VISITED';$('#routeNote p').textContent='Supplies packed. Continue along the market road to your next opponent.';}$('#travelStatus').textContent='Your road is locked. Resume travel to reach the fight.';}
  $('#journeyMain').scrollIntoView({behavior:reduced?'instant':'smooth'});
 }
 if(d.type==='journey-committed'&&pendingJourney?.key===d.key){
  traveling=false;committed=false;if(ROUTES[d.route])selectRoute(d.route);committed=true;walk();
 }
 if(d.type==='journey-error'){traveling=false;$('#setOff').disabled=false;$('#setOffText').textContent='Choose your road';$('#travelStatus').textContent=d.message||'Return to the game to continue.';}
});
const dialog=$('#infoDialog');$('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
function help(){ $('#dialogContent').innerHTML='<div class="eyebrow">MAKE YOUR MOVE</div><h2>Chess, with a crown<br>on the line.</h2><p>Build a named army and cross five Lands. Win each battle by reaching its score target or delivering checkmate.</p><ul><li><b>Campaign:</b> assemble your army, train your pieces, and conquer 85 story battles.</li><li><b>The Gauntlet:</b> an independent survival run with three lives, arena equipment, and endless waves.</li><li><b>Journey:</b> choose a path and watch your King travel between every Campaign fight, including new circuits and Ruler battles.</li></ul><p>Follow connected locations across each circuit. Shelters lower the next fight’s target by 20%; danger stops raise it by 20% and award $8 extra on victory. The last shelter or danger you reach sets that fight’s approach. Shops grant $5 and open only when visited; caches grant $3. Junctions unlock further connections. You can skip shops via other paths. Every departure is saved, and refreshing cannot repeat rewards.</p><p>Your progress saves automatically in this browser. The game menu includes full rules and save options.</p>';dialog.showModal()}
$('#help').onclick=help;
$('#characterButton').onclick=()=>CrownfallCharacter.open();
$('#characterQuick').onclick=()=>CrownfallCharacter.open();
$('#settings').onclick=()=>{ $('#dialogContent').innerHTML='<div class="eyebrow">YOUR EXPERIENCE</div><h2>Settings</h2><div class="setting-row"><span>Your character</span><button id="dialogCharacter">Customize</button></div><div class="setting-row"><span>Reduce motion</span><button id="dialogMotion">'+(reduced?'On':'Off')+'</button></div><p>Music, sound, and gameplay speed can be adjusted from the game menu.</p><p>Campaign and Gauntlet progress are stored separately on this device.</p>';dialog.showModal();$('#dialogCharacter').onclick=()=>{dialog.close();CrownfallCharacter.open();};$('#dialogMotion').onclick=e=>{reduced=!reduced;applyMotion();e.target.textContent=reduced?'On':'Off'}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shell.hidden&&!dialog.open){send('journey-pause');hideGame()}});
buildJourneyNetwork(networkData);applyMotion();if(selected)selectRoute(selected);

// Start at the original game opening; the road map follows the first stage.
showGame('campaign');
