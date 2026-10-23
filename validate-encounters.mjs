import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8'),events=readFileSync('journey-events.js','utf8'),world=readFileSync('journey-world.js','utf8'),helpers=readFileSync('route-benefits.js','utf8'),bridge=readFileSync('game-bridge.js','utf8');
const slice=(a,b)=>game.slice(game.indexOf(a),game.indexOf(b,game.indexOf(a)));
const engine=slice('const TYPE = {','const SHAPE = {')+slice('function movesFor(','function attackSquares(')+slice('function attackSquares(','function attacksOn(')+slice('const kingIdx =','/* ---------- castling & en passant')+slice('function legalFor(','function anyLegal(');
assert(game.includes(readFileSync('journey-encounter-ui.js','utf8')+helpers+bridge));
function setup(run){
 let action,tap;const handlers={},posts=[],parent={postMessage:m=>posts.push(m)},key='0|street|downtown|2';
 const c={RUN:run,MODE:'campaign',MATCH:null,B:null,ACH:{},URLSearchParams,window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://test',search:'?journey=1'},blindSelect(){},startBlind(){},shop(){},roadStart(){},save(){},sceneMusic(){},modeIntent(){},title(){},nStages:()=>4,CIR:()=>({name:'Downtown'}),PACKS:[{id:'street',name:'Crown City'}],MINIS:{street:{downtown:'Rex'}},RULERS:{street:{name:'Vex'}},stageName:n=>'Battle '+n,rc:i=>[Math.floor(i/8),i%8],ix:(r,c)=>r*8+c,inb:(r,c)=>r>=0&&r<8&&c>=0&&c<8,has:()=>false,doubleMarch:()=>false,armorHolds:()=>false,journeyRenderEncounter(event,node,a,s){action=a;tap=s;}};
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
 h.eval("RUN.journeyPreview1['0|street|downtown|2'].encounters['s2-a2'].board=journeySkirmishBoard("+variant+");RUN.journeyPreview1['0|street|downtown|2'].encounters['s2-a2'].phase='skirmish';RUN.journeyPreview1['0|street|downtown|2'].encounters['s2-a2'].moves=0");assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].phase,'skirmish');
 await h.tap(from);h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].selected,from);
 await h.tap(to);let e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];assert.equal(e.phase,'won');assert.equal(h.c.RUN.money,19);assert.equal(e.moves,1);assert(e.rewardPaid);
 await h.tap(to);h.action('fight');assert.equal(h.c.RUN.money,19);
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.money,19);assert.equal(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].phase,'won');
 h.action('continue');assert(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].resolved);assert.equal(h.c.RUN.journeyPreview1[h.key].encounter,null);
 assert.equal(JSON.stringify({roster:h.c.RUN.roster,lv:h.c.RUN.lv,lives:h.c.RUN.lives}),army);assert.equal(h.c.B,null);
}
let h=setup(fixture(0));h.action('fight');await h.tap(62);await h.tap(61);const e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];assert.equal(e.moves,1);assert.equal(e.board[61]?.side,'me');assert.equal(e.selected,null);
const state=JSON.stringify(e.board);await h.tap(2);assert.equal(JSON.stringify(e.board),state,'Invalid tap cannot move pieces');h.action('retreat');assert.equal(h.c.RUN.money,17);assert(h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].resolved);

for(let variant=0;variant<3;variant++){
 const h=setup(fixture(variant));h.action('fight');
 const e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];
 assert.equal(e.limit,10);assert.equal(e.patrolVersion,2);assert.equal(e.board.filter(Boolean).length,variant===2?13:12);
 h.c.testBoard=e.board;
 assert(!h.eval("inCheck(testBoard,'me')||inCheck(testBoard,'en')"),'Fair starting position');
 assert(!h.eval("testBoard.some((p,i)=>p?.side==='me'&&legalFor(testBoard,i).some(to=>testBoard[to]?.side==='en'&&testBoard[to].t==='R'))"),'No one-move Rook win');
 const reply=h.eval('journeyPatrolReply(testBoard,legalFor,inCheck)');
 assert(h.eval('legalFor(testBoard,'+reply.from+')').includes(reply.to));
 assert.deepEqual(JSON.parse(JSON.stringify(h.eval('journeyPatrolReply(testBoard,legalFor,inCheck)'))),JSON.parse(JSON.stringify(reply)),'Deterministic saved-game response');
 const original=JSON.stringify(e.board);h.eval('journeyPatrolReply(testBoard,legalFor,inCheck)');assert.equal(JSON.stringify(e.board),original,'Search cannot mutate saved board');
 await h.tap(variant===1?57:62);const resumed=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(resumed.c.RUN.journeyPreview1[h.key].encounters['s2-a2'].selected,variant===1?57:62);
 h.action('retreat');assert.equal(h.c.RUN.money,17);assert.equal(h.c.RUN.lives,3);
}
// Verified tactical solutions: the stronger patrols are beatable within the turn limit.
for(const [variant,line]of [[0,[[56,16],[16,21],[51,35],[34,13],[13,31]]],[1,[[63,23],[57,49],[45,35],[49,41],[35,25],[37,10],[10,24]]],[2,[[56,16],[16,21],[51,35],[34,13],[13,31]]]]){
 const h=setup(fixture(variant));h.action('fight');
 for(const [from,to]of line){await h.tap(from);await h.tap(to);}
 const e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'];assert.equal(e.phase,'won');assert(e.moves>1&&e.moves<=e.limit);assert.equal(h.c.RUN.money,19);
 const resumed=setup(JSON.parse(JSON.stringify(h.c.RUN)));resumed.action('continue');assert.equal(resumed.c.RUN.money,19,'Victory reload pays exactly once');
 assert.equal(h.c.RUN.lives,3);assert.deepEqual(h.c.RUN.roster,['K','R','N','P']);
}
// A threatened patrol Rook escapes instead of choosing the old first quiet move.
{
 const h=setup(fixture(0));h.c.testBoard=Array(64).fill(null);
 for(const [i,t,side]of [[60,'K','me'],[56,'R','me'],[4,'K','en'],[0,'R','en']])h.c.testBoard[i]={t,side};
 const m=h.eval('journeyPatrolReply(testBoard,legalFor,inCheck)');assert.equal(m.from,0,'Patrol recognizes the hanging Rook');
}
const context=vm.createContext({});vm.runInContext(world+events,context);const kinds=new Set();let count=0;
for(const land of ['street','medieval','greek','fantasy','throne'])for(const circuitId of ['downtown','rooftop','harbor','midnight','ruler']){
 const records=vm.runInContext('journeyGraph('+JSON.stringify({land,circuitId,stage:2})+').nodes.filter(n=>n.type!=="entry").map(n=>journeyEventFor('+JSON.stringify({land,circuitId,stage:2})+',n))',context);
 for(const e of records){assert(e.title&&e.text&&e.story);kinds.add(e.kind);count++;}
}
for(const kind of ['quiet','rumor','ambush','market','cache','shelter','battle'])assert(kinds.has(kind));
console.log('PASS: '+count+' authored land/circuit stops cover all scene types; three legacy saved-game wins, three defended patrols with legal deterministic lookahead, no instant wins, verified multi-turn solutions, enemy response, invalid moves, saved selections, one-time victory rewards, retreat, pending-scene gates, and unchanged Campaign army/lives.');

// A turn uses the regular match animator, in order, with input locked and no
// partially committed board while either side is still moving.
{
 const h=setup(fixture(0));h.action('fight');await h.tap(62);
 const e=h.c.RUN.journeyPreview1[h.key].encounters['s2-a2'],before=JSON.stringify(e.board),animations=[];
 let finish;
 h.c.animateMove=(from,to,style,view)=>{animations.push({from,to,style});return new Promise(resolve=>{finish=resolve;});};
 const turn=h.tap(61);assert.equal(animations.length,1);assert.deepEqual(animations[0],{from:62,to:61,style:'normal'});
 await h.tap(56);assert.equal(e.selected,62,'Taps during animation cannot change selection');
 assert.equal(JSON.stringify(e.board),before,'Saved position stays complete during player animation');
 finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(animations.length,2,'Patrol moves only after player animation');
 assert.equal(JSON.stringify(e.board),before,'Saved position stays complete during patrol animation');
 finish();await turn;assert.equal(e.moves,1);assert.equal(e.board[61].t,'K');
}
{
 const h=setup(fixture(0));h.action('fight');await h.tap(62);
 const r=h.c.RUN.journeyPreview1[h.key],e=r.encounters['s2-a2'],before=JSON.stringify(e.board);let finish;
 h.c.animateMove=()=>new Promise(resolve=>{finish=resolve;});
 const turn=h.tap(61);r.encounter=null;finish();await turn;
 assert.equal(JSON.stringify(e.board),before,'Leaving the encounter cancels its animated turn');assert.equal(e.moves,0);
}
// Both boards share the exact animation frames, including reduced motion.
{
 const calls=[];const piece={style:{},classList:{contains:()=>false},animate:(frames,opts)=>{calls.push({frames,opts});return {finished:Promise.resolve()};}};
 const board={querySelector:selector=>({querySelector:()=>piece,getBoundingClientRect:()=>({left:selector.includes('56')?0:80,top:0})})};
 const c=vm.createContext({document:board,calm:false,T:x=>x,trail(){}});
 vm.runInContext(slice('function animateMove(','/* ---------- land board themes'),c);c.roadside=board;
 await vm.runInContext('animateMove(56,57,"normal",roadside)',c);await vm.runInContext('animateMove(56,57,"lunge",roadside)',c);
 assert.equal(calls[0].opts.duration,190);assert.equal(calls[1].opts.duration,260);assert.match(calls[0].frames[2].transform,/80px/);
 c.calm=true;await vm.runInContext('animateMove(56,57,"normal",roadside)',c);assert.equal(calls.length,2);
}
console.log('PASS: shared match movement/capture animation, ordered patrol reply, turn input lock, atomic saves, cancelled navigation, and reduced motion.');
