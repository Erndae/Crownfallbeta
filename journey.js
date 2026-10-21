'use strict';
const $ = s => document.querySelector(s);
const MAP_KEY = 'crownfall-journey-preview-1';
const ROUTES = {
 safer:{title:'Back alley',label:'THE SAFER ROAD',caption:'KEEP TO THE SHADOWS.',description:'A sheltered passage beneath the city. Ivy, quiet doorways, and a little room to breathe.',color:'#9db8aa'},
 supply:{title:'Market street',label:'THE SUPPLY ROAD',caption:'FOLLOW THE WARM WINDOWS.',description:'The last shop is still open. Follow the lamplight along the rain-soaked street.',color:'#e6be7e'},
 risky:{title:'Rooftop crossing',label:'THE RISKY ROAD',caption:'TAKE THE HIGH ROAD.',description:'Fire escapes and iron catwalks. A different view of a city that never stops moving.',color:'#e66898'}
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
 if(traveling||!ROUTES[id])return;selected=id;committed=false;persist();const r=ROUTES[id];
 document.querySelectorAll('[data-route]').forEach(el=>{el.classList.toggle('selected',el.dataset.route===id);if(el.matches('.route-card'))el.setAttribute('aria-pressed',String(el.dataset.route===id))});
 $('.route-overlay').classList.add('has-selection');$('#routeNote').style.borderColor=r.color;$('.note-label').style.color=r.color;$('.note-label').textContent=r.label;$('#routeNote p').textContent=r.description;
 $('#setOff').disabled=false;$('#setOff').style.background=r.color;$('#setOffText').textContent=pendingJourney?'Set off for Stage 2':'Walk this route';$('#mapCaption').textContent=r.caption;$('#travelStatus').textContent=pendingJourney?'Your road is saved before you set off.':'Arrive at the destination to enter the Campaign.';
 $('#traveler').setAttribute('transform','translate(140 650)');$('#traveler').classList.remove('arrived');resetCamera();
}
document.querySelectorAll('[data-route]').forEach(el=>{el.addEventListener('click',()=>selectRoute(el.dataset.route));if(el.tagName.toLowerCase()==='g')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRoute(el.dataset.route)}})});
function resetCamera(){if(traveling)return;$('#mapWorld').style.transform='translateX(0)';}
$('#panLeft').onclick=()=>{if(!traveling)$('#mapWorld').style.transform='translateX(0)'};
$('#panRight').onclick=()=>{if(!traveling){const w=$('#mapWindow').clientWidth,m=$('#mapWorld').clientWidth;$('#mapWorld').style.transform=`translateX(-${Math.max(0,m-w)}px)`}};
$('#motionToggle').onclick=()=>{reduced=!reduced;applyMotion()};
async function walk(){
 if(!selected||traveling)return;
 if(pendingJourney&&!committed){traveling=true;$('#setOff').disabled=true;$('#setOffText').textContent='Saving your road…';send('journey-commit',{key:pendingJourney.key,route:selected});const key=pendingJourney.key;setTimeout(()=>{if(pendingJourney?.key===key&&traveling&&!committed){traveling=false;$('#setOff').disabled=false;$('#setOffText').textContent='Try setting off again';$('#travelStatus').textContent='The game has not confirmed this road yet.'}},3000);return;}
 traveling=true;const token=++travelToken;const routePath=$(`.route-track[data-route="${selected}"] .route-line`),length=routePath.getTotalLength(),duration=reduced?0:3200,start=performance.now();$('#mapWindow').classList.add('is-traveling');$('#mapWorld').style.transition='none';$('#setOff').disabled=true;$('#setOffText').textContent='On the move…';$('#travelStatus').textContent=`Taking the ${ROUTES[selected].title.toLowerCase()}.`;
 function tick(now){if(token!==travelToken)return;const t=duration?Math.min(1,(now-start)/duration):1,ease=t*t*(3-2*t),p=routePath.getPointAtLength(ease*length);const hop=reduced||t===1?0:Math.abs(Math.sin(t*Math.PI*22))*9;$('#traveler').setAttribute('transform',`translate(${p.x} ${p.y-hop})`);const w=$('#mapWindow').clientWidth,m=$('#mapWorld').clientWidth;const offset=Math.max(0,Math.min(m-w,p.x/1536*m-w*.45));$('#mapWorld').style.transform=`translateX(-${offset}px)`;if(t<1){requestAnimationFrame(tick);return;}traveling=false;$('#mapWindow').classList.remove('is-traveling');$('#traveler').classList.add('arrived');$('#mapWorld').style.transition='';$('#setOff').disabled=false;$('#setOffText').textContent='Walk again';$('#travelStatus').textContent='Arrived. Entering the Campaign…';if(pendingJourney){const key=pendingJourney.key;pendingJourney=null;committed=false;send('journey-arrive',{key});showGame('campaign');$('#setOffText').textContent='Walk this route';$('#panelTitle').innerHTML='A way through<br>the city.';$('#panelCopy').textContent='Under the rooftops. Past the last open shop. Every road leads to your next opponent.';}else{launch('campaign');}}
 requestAnimationFrame(tick);
}
$('#setOff').onclick=walk;
function showGame(mode){shell.hidden=false;document.body.classList.add('game-open');$('#gameModeLabel').textContent=mode==='gauntlet'?'THE GAUNTLET':'CAMPAIGN';frame.loading='eager'}
function hideGame(){shell.hidden=true;document.body.classList.remove('game-open');$('#navJourney').focus()}
function launch(mode){if(pendingJourney){$('#travelStatus').textContent='Finish choosing your road to continue the Campaign.';$('#setOff').focus();return;}launchPending=mode;showGame(mode);if(frameReady){send('journey-launch',{mode});launchPending=null}}
document.querySelectorAll('[data-launch]').forEach(el=>el.onclick=()=>launch(el.dataset.launch));
$('#backToMap').onclick=()=>{send('journey-pause');hideGame()};$('#gameMenu').onclick=()=>send('journey-menu');$('#navJourney').onclick=hideGame;
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;const d=e.data;if(!d||typeof d!=='object')return;
 if(d.type==='crownfall-ready'){frameReady=true;if(launchPending){send('journey-launch',{mode:launchPending});launchPending=null;}}
 if(d.type==='journey-request'){pendingJourney={key:d.key};committed=false;hideGame();$('#panelTitle').innerHTML='Your next<br>opponent awaits.';$('#panelCopy').textContent='Stage 1 is behind you. Choose a path through Downtown to reach Stage 2: The Rival.';document.querySelectorAll('.stage').forEach(el=>{el.classList.toggle('current',el.dataset.stage==='2');el.classList.toggle('done',el.dataset.stage==='1')});$('#travelStatus').textContent='Stage cleared. Choose your road.';if(selected)selectRoute(selected);$('#journeyMain').scrollIntoView({behavior:reduced?'instant':'smooth'});}
 if(d.type==='journey-committed'&&pendingJourney?.key===d.key){committed=true;traveling=false;walk();}
 if(d.type==='journey-error'){traveling=false;$('#setOff').disabled=false;$('#setOffText').textContent='Choose your road';$('#travelStatus').textContent=d.message||'Return to the game to continue.';}
});
const dialog=$('#infoDialog');$('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
function help(){ $('#dialogContent').innerHTML='<div class="eyebrow">MAKE YOUR MOVE</div><h2>Chess, with a crown<br>on the line.</h2><p>Build a named army and cross five Lands. Win each battle by reaching its score target or delivering checkmate.</p><ul><li><b>Campaign:</b> assemble your army, train your pieces, and conquer 85 story battles.</li><li><b>The Gauntlet:</b> an independent survival run with three lives, arena equipment, and endless waves.</li><li><b>Journey:</b> choose a path and watch your King travel through Downtown. The new scene appears between its first two Campaign stages.</li></ul><p>Road choices here change the journey scenery. Battle rewards and existing shop events follow the original game rules.</p><p>Your progress saves automatically in this browser. The game menu includes full rules and save options.</p>';dialog.showModal()}
$('#help').onclick=help;
$('#settings').onclick=()=>{ $('#dialogContent').innerHTML='<div class="eyebrow">YOUR EXPERIENCE</div><h2>Settings</h2><div class="setting-row"><span>Reduce motion</span><button id="dialogMotion">'+(reduced?'On':'Off')+'</button></div><p>Music, sound, and gameplay speed can be adjusted from the game menu.</p><p>Campaign and Gauntlet progress are stored separately on this device.</p>';dialog.showModal();$('#dialogMotion').onclick=e=>{reduced=!reduced;applyMotion();e.target.textContent=reduced?'On':'Off'}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shell.hidden&&!dialog.open){send('journey-pause');hideGame()}});
applyMotion();if(selected)selectRoute(selected);

// Start at the original game opening; the road map follows the first stage.
showGame('campaign');
