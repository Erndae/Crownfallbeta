import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const world=readFileSync('journey-world.js','utf8')+readFileSync('journey-events.js','utf8'),helpers=readFileSync('route-benefits.js','utf8'),bridge=readFileSync('game-bridge.js','utf8');
assert(readFileSync('game.html','utf8').includes(helpers+bridge));
function setup(run){
 const posts=[],handlers={},next={};let shops=0,fights=0;const parent={postMessage:m=>posts.push(JSON.parse(JSON.stringify(m)))};
 const c={RUN:run,MODE:'campaign',MATCH:null,B:null,ACH:{},URLSearchParams,window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://test',search:'?journey=1'},document:{querySelector:()=>null},$:()=>next,blindSelect(){fights++},startBlind(){fights++},shop(){shops++;},roadStart(){},save(){},sceneMusic(){},modeIntent(){},title(){},nStages:()=>run.circuit==='ruler'?6:4,CIR:()=>({name:run.circuit}),PACKS:[{id:run.land,name:run.land}],MINIS:{[run.land]:{[run.circuit]:'Boss'}},RULERS:{[run.land]:{name:'Ruler'}},stageName:n=>'Stage '+n};
 c.journeyRenderEncounter=(event,node,action,square)=>{c.stopEvent=event;c.stopAction=action;c.stopSquare=square;};
 vm.createContext(c);vm.runInContext(world+helpers+bridge,c);
 const evalCode=s=>vm.runInContext(s,c),send=d=>handlers.message({source:parent,origin:c.location.origin,data:d});
 evalCode('blindSelect()');
 return {c,posts,next,send,eval:evalCode,shops:()=>shops,fights:()=>fights};
}
const lands=['street','medieval','greek','fantasy','throne'],circuits=['downtown','rooftop','harbor','midnight','ruler'];
let tested=0,shopPaths=0,cachePaths=0;const degrees=new Set();
for(const land of lands)for(const circuit of circuits)for(const stage of circuit==='ruler'?[6]:[1,2,3,4]){
 const run={land,circuit,ante:stage,blind:2,money:10,armyStages:4};
 const initial=setup(run),g=initial.eval(`journeyGraph({land:'${land}',circuitId:'${circuit}',stage:${stage}})`);
 // Every advertised junction offers distinct reachable choices on arrival.
 for(const node of g.nodes.filter(n=>n.type==='road')){
  const exits=g.edges.filter(e=>e.from===node.id);
  assert(exits.length>=2,'A junction must have multiple exits: '+node.id);
  assert(new Set(exits.map(e=>g.byId[e.to].type)).size>=2,'Junction choices have different benefits');
  const arrived=initial.eval('journeyGraph('+JSON.stringify({land,circuitId:circuit,stage:node.stage,record:{position:node.id}})+')');
  assert.equal(arrived.active.length,exits.length,'Arrival unlocks every onward branch');
  const summary=initial.eval('journeyJunctionSummary(journeyGraph('+JSON.stringify({land,circuitId:circuit,stage:node.stage})+'),'+JSON.stringify(node)+')');
  assert(summary.startsWith('Choose from '+exits.length+' routes:'));
  for(const e of exits)assert(g.edges.some(next=>next.from===e.to&&g.byId[next.to].stage===node.stage)||g.byId[e.to].type==='fight');
 }
 // Enumerate every possible route to this fight, not just a preferred path.
 const paths=[];function visit(id,path){const edges=g.edges.filter(e=>e.from===id&&g.byId[e.to].stage===g.current);degrees.add(edges.length);for(const e of edges){const p=[...path,e.to];if(g.byId[e.to].type==='fight')paths.push(p);else visit(e.to,p);}}visit(g.position,[]);
 assert(paths.length>=4);assert(paths.some(p=>p.some(id=>g.byId[id].type==='supply')));assert(paths.some(p=>p.every(id=>g.byId[id].type!=='supply')));
 for(const path of paths){
  let h=setup({land,circuit,ante:stage,blind:2,money:10,armyStages:4}),expectedMoney=10,effect='road';const key=`0|${land}|${circuit}|${stage}`;
  for(const id of path){
   const n=g.byId[id];const before=JSON.stringify(h.c.RUN);
   h.send({type:'journey-commit',key,node:'unreachable'});assert.equal(JSON.stringify(h.c.RUN),before);
   h.send({type:'journey-commit',key:'wrong',node:id});assert.equal(JSON.stringify(h.c.RUN),before);
   expectedMoney-=g.edges.find(e=>e.from===h.c.RUN.journeyPreview1[key].position&&e.to===id)?.cost||0;
   h.send({type:'journey-commit',key,node:id});assert.equal(h.c.RUN.journeyPreview1[key].hop,id);
   // Reload on the road; a competing choice cannot replace the saved destination.
   h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.posts.at(-1).record.hop,id);
   h.send({type:'journey-commit',key,node:'unreachable'});assert.equal(h.c.RUN.journeyPreview1[key].hop,id);
   h.send({type:'journey-arrive',key,node:id});
   if(n.type==='cache'){expectedMoney+=3;cachePaths++;}if(n.type==='supply'){expectedMoney+=5;shopPaths++;}
   if(['safer','risky'].includes(n.type))effect=n.type;
   assert.equal(h.c.RUN.money,expectedMoney);assert.equal(h.c.RUN.journeyPreview1[key].position,id);
   const after=JSON.stringify(h.c.RUN);h.send({type:'journey-arrive',key,node:id});assert.equal(JSON.stringify(h.c.RUN),after);
   const event=h.c.RUN.journeyPreview1[key].encounters[id];assert(event,'Every arrival records its outcome');
   if(['quiet','cache','shelter','market','battle'].includes(event.kind)){
    assert(event.resolved,'Stops without a decision skip the arrival screen');
    assert.equal(h.posts.at(-1).type,['market','battle'].includes(event.kind)?'journey-enter':'journey-request');
    assert.equal(h.c.RUN.journeyPreview1[key].notice.node,id);assert(h.c.RUN.journeyPreview1[key].notice.text);
    h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.money,expectedMoney);
    if(event.kind==='market')assert.equal(h.shops(),1);else if(event.kind==='battle')assert.equal(h.fights(),1);else assert.equal(h.posts.at(-1).type,'journey-request');
   }else{
    assert(!event.resolved,'Interactive arrivals still pause');assert.equal(h.posts.at(-1).type,'journey-encounter');
    h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.posts.at(-1).type,'journey-encounter');assert.equal(h.c.RUN.money,expectedMoney);
    if(event.kind!=='ambush'){h.c.stopAction('listen');assert.equal(h.c.stopEvent.phase,'story');}
    h.c.stopAction(event.kind==='ambush'?'retreat':'continue');assert(h.c.RUN.journeyPreview1[key].encounters[id].resolved);
   }
   if(n.type==='supply'){
    assert.equal(h.shops(),1);h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.shops(),1);assert.equal(h.c.RUN.money,expectedMoney);h.next.onclick();assert(!h.c.RUN.inShop);assert(!h.c.RUN.journeyPreview1[key].atShop);
   }else if(n.type!=='fight'){assert.equal(h.shops(),0);assert.equal(h.fights(),0);}
  }
  assert(h.c.RUN.journeyPreview1[key].arrived);assert.equal(h.fights(),1);
  assert.equal(h.eval('cityRouteTarget(1000)'),effect==='safer'?800:effect==='risky'?1200:1000);assert.equal(h.eval('cityRouteReward()'),effect==='risky'?8:0);
  h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.fights(),1);assert.equal(h.c.RUN.money,expectedMoney);h.eval('startBlind()');assert.equal(h.fights(),2);
  tested++;
 }
}
assert(degrees.has(1)&&degrees.has(2)&&degrees.has(3)&&degrees.has(4));
console.log(`PASS: ${tested} complete paths across all 85 stages; ${shopPaths} shop visits and ${cachePaths} cache visits; 1–4 connections; simple stops stay on the map; shops and battles open directly; interactive scenes resume and block departure; replayed arrivals pay once and reach the correct battle.`);
// A toll is refused before commitment if it is unaffordable, and charged only
// once when a destination is locked (including repeated requests after reload).
{
 const key='0|street|downtown|3',run={land:'street',circuit:'downtown',ante:3,blind:2,money:0,armyStages:4,journeyPreview1:{}};
 run.journeyPreview1[key]={networkVersion:2,position:'s3-a0',route:'road',benefitsVersion:1,arrived:false,visited:['s3-a0'],edges:[],encounters:{}};
 let h=setup(run);const target='fight-3';h.send({type:'journey-commit',key,node:target});assert(!h.c.RUN.journeyPreview1[key].hop);assert.equal(h.posts.at(-1).type,'journey-error');
 h.c.RUN.money=2;h.send({type:'journey-commit',key,node:target});assert.equal(h.c.RUN.money,0);assert.equal(h.c.RUN.journeyPreview1[key].tolls,2);
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));h.send({type:'journey-commit',key,node:target});assert.equal(h.c.RUN.money,0);assert.equal(h.c.RUN.journeyPreview1[key].tolls,2);
 h.send({type:'journey-arrive',key,node:target});assert.equal(h.fights(),1);
}
// Find an authored aid event with a reachable later shop, then play through it.
{
 let chosen;
 outer:for(const land of lands)for(const circuit of circuits)for(let stage=1;stage<=4;stage++){
  if(circuit==='ruler')continue;
  const h=setup({land,circuit,ante:stage,blind:2,money:10,armyStages:4});const data={land,circuitId:circuit,stage};
  const g=h.eval('journeyGraph('+JSON.stringify(data)+')');
  for(const node of g.nodes.filter(n=>n.stage===stage&&n.type!=='fight')){
   const event=h.eval('journeyEventFor('+JSON.stringify(data)+','+JSON.stringify(node)+')');if(event.kind!=='aid')continue;
   const paths=(id,path=[])=>{for(const edge of g.edges.filter(e=>e.from===id&&g.byId[e.to].stage===stage&&g.byId[e.to].type!=='fight')){if(g.byId[edge.to].type==='supply')return [...path,edge.to];const found=paths(edge.to,[...path,edge.to]);if(found)return found;}return null;};
   const path=paths(node.id);if(path){chosen={land,circuit,stage,node,event,path,g};break outer;}
  }
 }
 assert(chosen,'An aid choice can lead to a later shop');const {land,circuit,stage,node,event,path,g}=chosen,key=`0|${land}|${circuit}|${stage}`;
 const run={land,circuit,ante:stage,blind:2,money:10,armyStages:4,roster:['K'],lv:{},relics:[],journeyPreview1:{}};
 event.place={id:node.id,type:node.type,name:node.name};run.journeyPreview1[key]={networkVersion:2,position:node.id,route:'road',benefitsVersion:1,arrived:false,visited:[node.id],edges:[],encounter:node.id,encounters:{[node.id]:event}};
 let h=setup(run);const help=h.c.stopAction;help('help');assert.equal(h.c.RUN.money,7);assert.equal(h.c.RUN.shopCredit,5);help('help');assert.equal(h.c.RUN.money,7,'Aid cannot be paid twice');
 const game=readFileSync('game.html','utf8'),carryLine=game.split('\n').find(line=>line.startsWith('const carryOfRun ='));
 assert.equal(h.eval(carryLine+'\ncarryOfRun(RUN).shopCredit'),5,'Aid supplies survive Circuit carry');
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.shopCredit,5);
 for(const id of path){h.send({type:'journey-commit',key,node:id});h.send({type:'journey-arrive',key,node:id});const event=h.c.RUN.journeyPreview1[key].encounters[id];if(!event.resolved)h.c.stopAction(event.kind==='ambush'?'retreat':'continue');}
 assert.equal(h.c.RUN.shopCredit,0);assert.equal(h.c.RUN.shopCreditApplied,5);const cash=h.c.RUN.money;
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.c.RUN.money,cash);h.send({type:'journey-arrive',key,node:path.at(-1)});assert.equal(h.c.RUN.money,cash,'Shop supplies redeem once');
}
console.log('PASS: unaffordable shortcuts reject safely, tolls persist once across reloads, aid is charged once and carried, and next-shop supplies redeem exactly once.');
