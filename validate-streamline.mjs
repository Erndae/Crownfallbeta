import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8');
const from=game.indexOf('  const html = (`',game.indexOf('function winBlind(){')),to=game.indexOf('  B.done = true;',from);
const c=vm.createContext({B:{score:5280,target:4284,mate:false,moveCount:15},RUN:{ante:3,blind:2,circuit:'downtown',cards:[]},total:22,reward:12,movesBonus:0,blitzLeft:0,interest:2,routeBonus:8,piggy:0,mateBonus:0,chal:{cash:0},debtNote:false,bossWin:true,bp:{name:'Catwalk Cruz',lose:'The road is yours.'},laRes:null,STAGE_ROLE:['Intro','Rival','Elite','Circuit Boss'],CIRCUIT_STAGES:4,CIR:()=>({name:'Downtown'}),portrait:()=>'',blitzOn:()=>false,isC:()=>false,laWinHtml:()=>'<p>Army recovered</p>'});
const html=vm.runInContext(game.slice(from,to)+'\nhtml',c);
assert(html.indexOf('Collect &amp; continue')<html.indexOf('<details'),'Primary action precedes secondary details');assert.match(html,/\+\$22/);assert.match(html,/Next: Stage 4/);assert(!/<details[^>]*\bopen\b/.test(html));
assert(html.includes('Danger route bonus'));assert(html.includes('Review the round'));assert(html.includes('Catwalk Cruz'));assert(html.includes('Army recovered'));
assert(!game.slice(game.indexOf('  const intro = vRuler'),game.indexOf('/* ---------- v139 Between-Fight Events')).includes('stageWinIntro('),'Ordinary victories have no extra presentation screen');
assert(game.indexOf('RUN.money += total;',from)<game.indexOf('intro.then(',from),'Reward still commits before the result screen');
// Reconcile a changed offer and cash balance without replacing an unaffected
// training section or rebuilding the app element.
const changes=[],make=(html)=>({outerHTML:html,replaceWith(next){changes.push([this.outerHTML,next.outerHTML]);}});
const before=[make('<header>$20</header>'),make('<section>Train</section>'),make('<section>Pawn $3</section>')];
const after=[make('<header>$17</header>'),make('<section>Train</section>'),make('<section>Sold</section>')];
const current={children:before,replaceChildren(){throw Error('Full replacement was unnecessary');}};
const shopContext=vm.createContext({app:{querySelector:()=>current,set innerHTML(_){throw Error('App must stay mounted');}},document:{createElement:()=>({content:{querySelector:()=>({children:after})}})}});
vm.runInContext(game.slice(game.indexOf('function renderShop('),game.indexOf('function shop(){')),shopContext);vm.runInContext('renderShop("updated shop")',shopContext);
assert.equal(changes.length,2);assert(!changes.some(([old])=>old.includes('Train')));
const css=readFileSync('game-clarity.css','utf8');assert(css.includes('.shopscr:not(.garm) .shopfoot{position:fixed'));assert(readFileSync('index.html','utf8').includes('id="journeyArrivalNote"'));
console.log('PASS: compact victory keeps rewards, next stage, optional details and review; money commits first; shop updates changed sections while preserving unchanged controls; fixed shop actions and inline map notice are present.');
