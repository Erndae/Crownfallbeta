import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8'), source=readFileSync('city-onboarding.js','utf8');
assert(game.includes(source));
const slice=(a,b)=>game.slice(game.indexOf(a),game.indexOf(b,game.indexOf(a)));
function harness(){
 const nodes=new Map(),timers=new Map(),marks=[];let id=0,drafts=0;
 const node=k=>{if(!nodes.has(k))nodes.set(k,{innerHTML:'',onclick:null});return nodes.get(k);};
 const app={innerHTML:'',classList:{add(){},remove(){}},querySelector:node,querySelectorAll(){return Array.from({length:64},(_,i)=>Object.assign(node('sq'+i),{dataset:{trainingSquare:String(i)}}));}};
 const run={money:19,roster:['K','P']},battle={score:25};
 const ctx={app,$:node,MODE:'campaign',PACK:'street',RUN:run,B:battle,onTitle:true,ONBOARD_KEYS:['intro','score','brilliance','damage'],coachMark:k=>marks.push(k),title(){},startNewGame(){drafts++},firstGame(){},leaveBoard(){},setPack(){},setLandBg(){},sceneMusic(){},pieceSVG:()=>'<svg></svg>',localStorage:{setItem(){}},sfx:{tick(){}},setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:i=>timers.delete(i),rc:i=>[Math.floor(i/8),i%8],ix:(r,c)=>r*8+c,inb:(r,c)=>r>=0&&r<8&&c>=0&&c<8,doubleMarch:()=>false,armorHolds:()=>false};
 vm.createContext(ctx);
 vm.runInContext(slice('const TYPE = {','const SHAPE = {')+slice('function movesFor(','function attackSquares(')+slice('function attackSquares(','function attacksOn(')+slice('const kingIdx =','/* ---------- castling & en passant')+slice('function legalFor(','function anyLegal(')+source,ctx);
 return {ctx,app,node,timers,marks,drafts:()=>drafts,run,battle};
}
let h=harness();vm.runInContext('startNewGame()',h.ctx);assert.match(h.app.innerHTML,/Play tutorial fight/);assert.match(h.app.innerHTML,/Skip tutorial/);
h.node('#citySkip').onclick();assert.equal(h.drafts(),1);assert(h.marks.includes('damage'));
h=harness();vm.runInContext('cityTraining()',h.ctx);
h.node('sq57').onclick();h.node('sq42').onclick();assert.match(h.app.innerHTML,/160/);assert.equal(h.timers.size,1);
[...h.timers.values()][0]();h.node('sq56').onclick();h.node('sq32').onclick();assert.match(h.app.innerHTML,/Training won/);assert.match(h.app.innerHTML,/>260</);
h.node('#trainingDone').onclick();assert.equal(h.drafts(),1);assert.deepEqual(h.marks,['score','brilliance']);assert.deepEqual(h.run,{money:19,roster:['K','P']});assert.deepEqual(h.battle,{score:25});
h=harness();vm.runInContext('cityTraining()',h.ctx);h.node('sq57').onclick();h.node('sq42').onclick();const pending=[...h.timers.values()][0];vm.runInContext('title()',h.ctx);h.app.innerHTML='menu';pending();assert.equal(h.app.innerHTML,'menu');
const index=readFileSync('index.html','utf8');assert.match(index,/body class="game-open"/);assert(!index.includes('id="gameShell" hidden'));
console.log('PASS: opening first, tutorial skip/completion, legal training captures and scoring, save preservation, and timer cancellation.');
