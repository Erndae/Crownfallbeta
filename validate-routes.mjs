import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const helpers=readFileSync('route-benefits.js','utf8'), bridge=readFileSync('game-bridge.js','utf8'), game=readFileSync('game.html','utf8');
assert(game.includes(helpers+bridge));
function setup(){
 const handlers={},posts=[];const parent={postMessage:m=>posts.push(m)};
 const c={MODE:'campaign',RUN:{land:'street',circuit:'downtown',ante:2,blind:2,money:10},B:null,MATCH:null,ACH:{},window:{parent,addEventListener:(t,f)=>handlers[t]=f},location:{origin:'https://example.com',search:'?journey=1'},URLSearchParams,blindSelect(){},modeIntent(){},save(){},title(){}};
 vm.createContext(c);vm.runInContext(helpers+bridge,c);
 const send=d=>handlers.message({source:parent,origin:c.location.origin,data:d});
 vm.runInContext('blindSelect()',c);
 return {c,send,posts,key:'0|street|downtown|2',run:s=>vm.runInContext(s,c)};
}
for(const [route,target,reward] of [['safer',800,0],['supply',1000,0],['risky',1200,8]]){
 const h=setup();h.send({type:'journey-commit',key:h.key,route});
 assert.equal(h.run('cityRouteTarget(1000)'),target);assert.equal(h.run('cityRouteReward()'),reward);
 assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h.send({type:'journey-commit',key:h.key,route:'supply'});h.run('cityRouteApply()');assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h.c.RUN=JSON.parse(JSON.stringify(h.c.RUN));h.run('cityRouteApply()');assert.equal(h.c.RUN.money,route==='supply'?15:10);
 h.send({type:'journey-arrive',key:h.key});assert(h.run('cityRouteNote()').includes(route==='safer'?'Back alley':route==='supply'?'Market street':'Rooftop'));
 h.c.RUN.ante=3;assert.equal(h.run('cityRouteTarget(1000)'),1000);assert.equal(h.run('cityRouteReward()'),0);
 h.c.RUN.ante=2;h.c.MODE='gauntlet';assert.equal(h.run('cityRouteReward()'),0);assert.equal(h.run('cityRouteTarget(1000)'),1000);
}
const bad=setup();bad.send({type:'journey-commit',key:'wrong',route:'supply'});assert.equal(bad.c.RUN.money,10);
const old=setup();old.c.RUN.journeyPreview1={[old.key]:{route:'supply'}};old.c.B={target:1000};old.run('cityRouteApply()');assert.equal(old.c.RUN.money,10);old.c.B=null;old.run('cityRouteApply()');assert.equal(old.c.RUN.money,15);
assert(game.includes('const t = cityRouteTarget(targetParts(i).final);'));
assert(game.includes('mateBonus + chal.cash + routeBonus'));
console.log('PASS: all three effects, locked choice, duplicate messages, saved reload, later-stage/mode isolation, existing battle preservation, and reward integration.');
