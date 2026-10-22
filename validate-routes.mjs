import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const helpers=readFileSync('route-benefits.js','utf8'),bridge=readFileSync('game-bridge.js','utf8'),game=readFileSync('game.html','utf8');
assert(game.includes(helpers+bridge));
function setup(run={land:'street',circuit:'downtown',ante:2,blind:2,money:10}){
 const handlers={},posts=[];let starts=0,selects=0,shops=0;const next={};
 const parent={postMessage:m=>posts.push(m)};
 const c={MODE:'campaign',RUN:run,B:null,MATCH:null,ACH:{},window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://example.com',search:'?journey=1'},URLSearchParams,blindSelect(){selects++},startBlind(){starts++},shop(){shops++;c.RUN.inShop=true;c.RUN.shop=c.RUN.shop||[];},$:()=>next,modeIntent(){},save(){},sceneMusic(kind){c.musicScene=kind;},title(){},roadStart(){},nStages:()=>run.circuit==='ruler'?6:4,PACKS:[{id:run.land,name:run.land}],CIR:()=>({name:run.circuit}),stageName:n=>'Fight '+n};
 vm.createContext(c);vm.runInContext(helpers+bridge,c);
 const send=d=>handlers.message({source:parent,origin:c.location.origin,data:d});
 return {c,send,posts,key:`0|${run.land}|${run.circuit}|${run.ante}`,run:s=>vm.runInContext(s,c),starts:()=>starts,selects:()=>selects,shops:()=>shops,next};
}
for(const [route,target,reward] of [['safer',800,0],['supply',1000,0],['risky',1200,8]]){
 let h=setup();h.run('blindSelect()');assert.equal(h.posts.at(-1).type,'journey-request');assert.equal(h.c.musicScene,'land');
 h.send({type:'journey-commit',key:h.key,route});assert.equal(h.run('cityRouteTarget(1000)'),target);assert.equal(h.run('cityRouteReward()'),reward);assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h.send({type:'journey-commit',key:h.key,route:'supply'});h.run('cityRouteApply()');assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h=setup(JSON.parse(JSON.stringify(h.c.RUN)));h.run('blindSelect()');assert.equal(h.posts.at(-1).route,route);assert.equal(h.selects(),0);
 h.run('startBlind()');assert.equal(h.starts(),0); // unfinished travel cannot be skipped
 h.send({type:'journey-arrive',key:h.key});
 if(route==='supply'){
  assert.equal(h.shops(),1);assert.equal(h.selects(),0);assert.equal(h.c.RUN.inShop,true);
  // A reload at the market returns to the same shop, with no second supplies payment.
  h=setup(JSON.parse(JSON.stringify(h.c.RUN)));h.run('blindSelect()');assert.equal(h.shops(),1);assert.equal(h.c.RUN.money,15);
  h.next.onclick();assert.equal(h.posts.at(-1).leg,'depart');assert.equal(h.c.RUN.inShop,false);
  h.send({type:'journey-arrive',key:h.key});
 }else assert.equal(h.shops(),0);
 assert.equal(h.selects(),1);
 h.run('startBlind(); startBlind()');assert.equal(h.starts(),2); // retries need no repeat journey
 assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h.c.RUN.ante=3;h.run('blindSelect()');assert.equal(h.posts.at(-1).stage,3);assert.equal(h.run('cityRouteTarget(1000)'),1000);assert.equal(h.run('cityRouteReward()'),0);
 h.c.RUN.ante=2;h.c.MODE='gauntlet';assert.equal(h.run('cityRouteReward()'),0);assert.equal(h.run('cityRouteTarget(1000)'),1000);
}
for(const land of ['street','medieval','greek','fantasy','throne']){
 for(const stage of [1,2,3,4]){
  const h=setup({land,circuit:'harbor',ante:stage,blind:2,money:10,armyStages:4,carried:true});h.run('blindSelect()');assert.equal(h.posts.at(-1).type,'journey-request');assert.equal(h.c.musicScene,'land');assert.equal(h.posts.at(-1).stage,stage);
  h.send({type:'journey-commit',key:h.key,route:'safer'});assert.equal(h.run('cityRouteTarget(1000)'),800);
 }
 const h=setup({land,circuit:'ruler',ante:6,blind:2,money:10,armyStages:16});h.run('blindSelect()');assert.equal(h.posts.at(-1).ruler,true);
}
const first=setup({land:'street',circuit:'downtown',ante:1,blind:2,money:10});first.run('startBlind()');assert.equal(first.starts(),1);assert.equal(first.posts.length,0);
for(const mode of ['gauntlet','match','completed']){
 const h=setup();if(mode==='gauntlet'){h.c.MODE='gauntlet';h.c.RUN.gauntlet=true;}if(mode==='match')h.c.MATCH={};if(mode==='completed'){h.c.RUN.won=true;h.c.RUN.ante=5;}
 h.run('blindSelect()');assert.equal(h.posts.length,0);
}
const bad=setup();bad.run('blindSelect()');bad.send({type:'journey-commit',key:'wrong',route:'supply'});assert.equal(bad.c.RUN.money,10);
const old=setup();old.c.RUN.journeyPreview1={[old.key]:{route:'supply'}};old.c.B={target:1000};old.run('cityRouteApply()');assert.equal(old.c.RUN.money,10);old.c.B=null;old.run('cityRouteApply()');assert.equal(old.c.RUN.money,15);old.run('blindSelect()');assert.equal(old.posts.length,0);
assert(game.includes('const t = cityRouteTarget(targetParts(i).final);'));assert(game.includes('mateBonus + chal.cash + routeBonus'));
assert(!game.includes('RUN.restocks = 0; genShop();'));
const noShop=setup();noShop.run('shop()');assert.equal(noShop.shops(),0);assert.equal(noShop.posts.at(-1).type,'journey-request');
console.log('PASS: travel across stages, circuits, lands and Rulers; first-fight/mode exclusions; locked reload/resume; retry behavior; one-time benefits; optional shop arrival, reload, departure and bypass protection; reward integration.');
