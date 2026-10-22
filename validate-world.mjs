import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const world=readFileSync('journey-world.js','utf8'),helpers=readFileSync('route-benefits.js','utf8'),bridge=readFileSync('game-bridge.js','utf8');
assert(readFileSync('game.html','utf8').includes(helpers+bridge));
function setup(run){
 const posts=[],handlers={},next={};let shops=0,fights=0;const parent={postMessage:m=>posts.push(JSON.parse(JSON.stringify(m)))};
 const c={RUN:run,MODE:'campaign',MATCH:null,B:null,ACH:{},URLSearchParams,window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://test',search:'?journey=1'},document:{querySelector:()=>null},$:()=>next,blindSelect(){fights++},startBlind(){fights++},shop(){shops++;},roadStart(){},save(){},sceneMusic(){},modeIntent(){},title(){},nStages:()=>run.circuit==='ruler'?6:4,CIR:()=>({name:run.circuit}),PACKS:[{id:run.land,name:run.land}],MINIS:{[run.land]:{[run.circuit]:'Boss'}},RULERS:{[run.land]:{name:'Ruler'}},stageName:n=>'Stage '+n};
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
 // Enumerate every possible route to this fight, not just a preferred path.
 const paths=[];function visit(id,path){const edges=g.edges.filter(e=>e.from===id&&g.byId[e.to].stage===g.current);degrees.add(edges.length);for(const e of edges){const p=[...path,e.to];if(g.byId[e.to].type==='fight')paths.push(p);else visit(e.to,p);}}visit(g.position,[]);
 assert(paths.length>=4);assert(paths.some(p=>p.some(id=>g.byId[id].type==='supply')));assert(paths.some(p=>p.every(id=>g.byId[id].type!=='supply')));
 for(const path of paths){
  let h=setup({land,circuit,ante:stage,blind:2,money:10,armyStages:4}),expectedMoney=10,effect='road';const key=`0|${land}|${circuit}|${stage}`;
  for(const id of path){
   const n=g.byId[id];const before=JSON.stringify(h.c.RUN);
   h.send({type:'journey-commit',key,node:'unreachable'});assert.equal(JSON.stringify(h.c.RUN),before);
   h.send({type:'journey-commit',key:'wrong',node:id});assert.equal(JSON.stringify(h.c.RUN),before);
   h.send({type:'journey-commit',key,node:id});assert.equal(h.c.RUN.journeyPreview1[key].hop,id);
   // Reload on the road; a competing choice cannot replace the saved destination.
   h=setup(JSON.parse(JSON.stringify(h.c.RUN)));assert.equal(h.posts.at(-1).record.hop,id);
   h.send({type:'journey-commit',key,node:'unreachable'});assert.equal(h.c.RUN.journeyPreview1[key].hop,id);
   h.send({type:'journey-arrive',key,node:id});
   if(n.type==='cache'){expectedMoney+=3;cachePaths++;}if(n.type==='supply'){expectedMoney+=5;shopPaths++;}
   if(['safer','risky'].includes(n.type))effect=n.type;
   assert.equal(h.c.RUN.money,expectedMoney);assert.equal(h.c.RUN.journeyPreview1[key].position,id);
   const after=JSON.stringify(h.c.RUN);h.send({type:'journey-arrive',key,node:id});assert.equal(JSON.stringify(h.c.RUN),after);
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
console.log(`PASS: ${tested} complete paths across all 85 stages; ${shopPaths} shop visits and ${cachePaths} cache visits; 1–4 connections; every hop reloads, locks, rejects invalid/replayed messages, pays once, and reaches the correct battle.`);
