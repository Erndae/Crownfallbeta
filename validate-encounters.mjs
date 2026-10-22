import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8'),events=readFileSync('journey-events.js','utf8'),world=readFileSync('journey-world.js','utf8'),helpers=readFileSync('route-benefits.js','utf8'),bridge=readFileSync('game-bridge.js','utf8');
const slice=(a,b)=>game.slice(game.indexOf(a),game.indexOf(b,game.indexOf(a)));
const engine=slice('const TYPE = {','const SHAPE = {')+slice('function movesFor(','function attackSquares(')+slice('function attackSquares(','function attacksOn(')+slice('const kingIdx =','/* ---------- castling & en passant')+slice('function legalFor(','function anyLegal(');
assert(game.includes(readFileSync('journey-encounter-ui.js','utf8')+helpers+bridge));
function setup(run){
 let action,tap;const handlers={},posts=[],parent={postMessage:m=>posts.push(m)},key='0|street|downtown|2';
 const c={RUN:run,MODE:'campaign',MATCH:null,B:null,ACH:{},URLSearchParams,window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://test',search:'?journey=1'},blindSelect(){},startBlind(){},shop(){},roadStart(){},save(){},sceneMusic(){},modeIntent(){},title(){},nStages:()=>4,CIR:()=>({name:'Downtown'}),PACKS:[{id:'street',name:'Crown City'}],MINIS:{street:{downtown:'Rex'}},RULERS:{street:{name:'Vex'}},stageName:n=>'Battle '+n,rc:i=>[Math.floor(i/8),i%8],ix:(r,c)=>r*8+c,inb:(r,c)=>r>=0&&r<8&&c>=0&&c<8,doubleMarch:()=>false,armorHolds:()=>false,journeyRenderEncounter(event,node,a,s){action=a;tap=s;}};
 vm.createContext(c);vm.runInContext(world+events+engine+helpers+bridge,c);vm.runInContext('blindSelect()',c);
 return {c,key,eval:s=>vm.runInContext(s,c),action:a=>action(a),tap:i=>tap(i),send:d=>handlers.message({source:parent,origin:c.location.origin,data:d}),posts};
}
function fixture(variant){
 const key='0|street|downtown|2',run={land:'street',circuit:'downtown',ante:2,blind:2,money:17,armyStages:4,lives:3,roster:['K','R','N','P'],lv:{K:1,R:2},journeyPreview1:{}};
 const place={id:'s2-a2',type:'risky',name:'Union Station · West overpass'},event={node:place.id,kind:'ambush',title:'An unexpected patrol',text:'A patrol blocks the road.',story:'',phase:'intro',resolved:false,variant,place};
 run.journeyPreview1[key]={networkVersion:2,position:place.id,route:'risky',benefitsVersion:1,arrived:false,visited:[place.id],edges:[['fight-1',place.id]],encounter:place.id,encounters:{[place.id]:event}};
 return run;
}
for(const [variant,from,to]of [[0,57,42],[1,58,40],[2,56,16]]){
 let h=setup(fixture(variant));const army=JSON.stringify({roster:h.c.RUN.roster,lv:h.c.RUN.lv,lives:h.c.RUN.lives});
 h.send({type:'journey-commit',key:h.key,node:'s2-b0'});assert(!h.c.RUN.journeyPreview1[h.key].hop,'A pending scene blocks departure');
 h.action('fight');assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].phase,'skirmish');
 h.tap(from);h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].selected,from);
 h.tap(to);let e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];assert.equal(e.phase,'won');assert.equal(h.c.RUN.money,19);assert.equal(e.moves,1);assert(e.rewardPaid);
 h.tap(to);h.action('fight');assert.equal(h.c.RUN.money,19);
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.money,19);assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].phase,'won');
 h.action('continue');assert(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].resolved);assert.equal(h.c.RUN.journeyPreview1[h.key].encounter,null);
 assert.equal(JSON.stringify({roster:h.c.RUN.roster,lv:h.c.RUN.lv,lives:h.c.RUN.lives}),army);assert.equal(h.c.B,null);
}
let h=setup(fixture(0));h.action('fight');h.tap(60);h.tap(52);const e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];assert.equal(e.moves,1);assert.equal(e.board[52]?.side,'me');assert.equal(e.selected,null);
const state=JSON.stringify(e.board);h.tap(2);assert.equal(JSON.stringify(e.board),state,'Invalid tap cannot move pieces');h.action('retreat');assert.equal(h.c.RUN.money,17);assert(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].resolved);
const context=vm.createContext({});vm.runInContext(world+events,context);const kinds=new Set();let count=0;
for(const land of ['street','medieval','greek','fantasy','throne'])for(const circuitId of ['downtown','rooftop','harbor','midnight','ruler']){
 const records=vm.runInContext('journeyGraph('+JSON.stringify({land,circuitId,stage:2})+').nodes.filter(n=>n.type!=="entry").map(n=>journeyEventFor('+JSON.stringify({land,circuitId,stage:2})+',n))',context);
 for(const e of records){assert(e.title&&e.text&&e.story);kinds.add(e.kind);count++;}
}
for(const kind of ['quiet','rumor','ambush','market','cache','shelter','battle'])assert(kinds.has(kind));
console.log('PASS: '+count+' authored land/circuit stops cover all scene types; three legal skirmish wins, enemy response, invalid moves, saved selections, one-time victory rewards, retreat, pending-scene gates, and unchanged Campaign army/lives.');
