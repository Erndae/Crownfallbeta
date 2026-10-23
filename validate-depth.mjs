import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8'),depth=readFileSync('campaign-depth.js','utf8'),events=readFileSync('journey-events.js','utf8');
const slice=(a,b)=>game.slice(game.indexOf(a),game.indexOf(b,game.indexOf(a)));
const engine=slice('const TYPE = {','const SHAPE = {')+slice('function movesFor(','function attackSquares(')+slice('function attackSquares(','function attacksOn(')+slice('const kingIdx =','/* ---------- castling & en passant')+slice('function legalFor(','function anyLegal(');
const c=vm.createContext({B:null,RUN:{relics:[]},rc:i=>[Math.floor(i/8),i%8],ix:(r,c)=>r*8+c,inb:(r,c)=>r>=0&&r<8&&c>=0&&c<8,has:()=>false,doubleMarch:()=>false,armorHolds:()=>false});
vm.runInContext(depth+events+engine,c);
const board=rows=>{const b=Array(64).fill(null);rows.forEach(([i,t,side])=>b[i]={t,side});return b;};
function bonuses(land,roster,rows,from,to,extra={}){
 const before=board(rows),after=c.applyMove(before,from,to),battle={moveCount:0,...extra};
 const args={run:{land,roster},battle,before,after,from,to,capture:true,check:false,attacks:c.attackSquares,...(extra.check?{check:true}:{})},original=JSON.stringify(args);
 const out=c.campaignCaptureBonuses(args);assert.equal(JSON.stringify(args),original,'Preview cannot mutate battle or army');return out;
}
const basic=[[62,'K','me'],[56,'R','me'],[48,'P','en'],[4,'K','en']];
assert.equal(bonuses('street',['K','R'],basic,56,48)[0].c,10);assert.equal(bonuses('street',['K','R'],basic,56,48,{moveCount:3}).length,0);
assert.equal(bonuses('greek',['K','R'],basic,56,48,{check:true})[0].m,2);
assert.equal(bonuses('fantasy',['K','R'],basic,56,48,{lastCaptureType:'N'})[0].c,15);assert.equal(bonuses('fantasy',['K','R'],basic,56,48,{lastCaptureType:'R'}).length,0);
assert.equal(bonuses('throne',['K','R'],[...basic,[7,'R','en']],56,48)[0].m,2);
assert.equal(bonuses('medieval',['K','R','P'],[[62,'K','me'],[35,'R','me'],[36,'P','me'],[27,'P','en'],[4,'K','en']],35,27)[0].m,2);
assert(bonuses('', ['K','N','N'],[[62,'K','me'],[42,'N','me'],[27,'P','en'],[10,'R','en'],[12,'B','en'],[4,'K','en']],42,27).some(b=>b.label==='Cavalry pair'));
assert(bonuses('', ['K','R','R'],[...basic,[55,'R','me']],56,48).some(b=>b.label==='Tower guard'));
assert(bonuses('', ['K','P','P','P'],[[62,'K','me'],[36,'P','me'],[27,'P','en'],[4,'K','en']],36,27).some(b=>b.label==='Pawn company'));
for(const excluded of [{gauntlet:true},{match:true}])assert.equal(c.campaignCaptureBonuses({run:{land:'street',roster:['N','N'],...excluded},capture:true}).length,0);
const plans=new Set();
for(const land of ['street','medieval','greek','fantasy','throne'])for(const circuit of ['downtown','rooftop','harbor','midnight'])for(let ante=1;ante<=3;ante++){
 const run={land,circuit,ante};const plan=c.campaignBossPlan(run);assert(plan.style&&plan.signature&&plan.weakness);assert.deepEqual(JSON.parse(JSON.stringify(plan)),JSON.parse(JSON.stringify(c.campaignBossPlan(JSON.parse(JSON.stringify(run))))));plans.add(plan.signature);
}
assert(plans.size>=10);assert.equal(c.campaignBossPlan({gauntlet:true}),null);
for(const objective of ['hunt','escape','hold','courier']){
 const b=c.journeyPatrolSetup(objective,0),e={objective,board:b,moves:0};assert(!c.inCheck(b,'me')&&!c.inCheck(b,'en'),'Fair starting position: '+objective);assert.equal(c.journeyPatrolStatus(e),'skirmish');assert.equal(b.filter(p=>p?.t==='K').length,2);
 const m=c.journeyPatrolReply(b,c.legalFor,c.inCheck,e);assert(c.legalFor(b,m.from).includes(m.to));
}
console.log('PASS: all 5 land bonuses, 3 conditional army synergies, preview immutability, mode isolation, 60 stable officer strategies, 4 fair patrol objectives and legal enemy replies.');

// Optional bounded search used to playtest each new objective against the real
// legal-move engine and deterministic patrol replies. Printed lines become regressions.
if(process.argv.includes('--solve')){
 const material={K:0,Q:9,R:5,B:3,N:3,P:1};
 const key=b=>b.map(p=>p?(p.side==='me'?p.t:p.t.toLowerCase())+(p.courier?'!':'')+(p.escort?'*':''):'.').join('');
 const rank=(e)=>{
  if(c.journeyPatrolStatus(e)==='won')return 100000;if(c.journeyPatrolStatus(e)==='escaped')return -100000;
  let value=e.board.reduce((s,p)=>s+(p?(p.side==='me'?1:-1)*material[p.t]:0),0);
  if(e.objective==='escape'){const k=e.board.findIndex(p=>p?.side==='me'&&p.t==='K');value-=Math.min(...[24,32].map(i=>Math.max(Math.abs(k%8-i%8),Math.abs((k>>3)-(i>>3)))))*20;}
  if(e.objective==='courier'){const t=e.board.findIndex(p=>p?.courier);value-=Math.min(...e.board.map((p,i)=>p?.side==='me'&&p.t!=='K'?Math.max(Math.abs(i%8-t%8),Math.abs((i>>3)-(t>>3))):99))*2;}
  if(e.objective==='hold'){const i=e.board.findIndex(p=>p?.escort);if(e.board.some((p,j)=>p?.side==='en'&&c.attackSquares(e.board,j).includes(i)))value-=20;}
  return value;
 };
 for(const objective of (process.argv.includes('--courier')?['courier']:['escape','hold','courier'])){
  let beam=[{objective,board:c.journeyPatrolSetup(objective,0),moves:0,line:[]}],solved=null;
  for(let turn=0;turn<c.journeyPatrolGoal({objective}).limit&&!solved;turn++){
   const next=[];
   for(const state of beam){
    const candidates=[];state.board.forEach((p,from)=>{if(p?.side==='me')for(const to of c.legalFor(state.board,from)){const e={...state,board:c.applyMove(state.board,from,to),moves:state.moves+1,line:[...state.line,[from,to]]};candidates.push(e);}});
    candidates.sort((a,b)=>rank(b)-rank(a));
    for(const e of candidates.slice(0,10)){
     if(c.journeyPatrolStatus(e)==='won'){solved=e;break;}
     const reply=c.journeyPatrolReply(e.board,c.legalFor,c.inCheck,e);
     if(!reply){if(c.inCheck(e.board,'en')){solved=e;break;}continue;}
     e.board=c.applyMove(e.board,reply.from,reply.to);
     const canMove=e.board.some((p,i)=>p?.side==='me'&&c.legalFor(e.board,i).length);
     if(!canMove||c.journeyPatrolStatus(e,true)==='escaped')continue;
     if(c.journeyPatrolStatus(e,true)==='won'){solved=e;break;}
     next.push(e);
    }if(solved)break;
   }
   const unique=new Map();for(const state of next.sort((a,b)=>rank(b)-rank(a)))if(!unique.has(key(state.board)))unique.set(key(state.board),state);
   beam=[...unique.values()].slice(0,8);
  }
  console.log(JSON.stringify({objective,solution:solved?.line||null}));assert(solved,'Objective must be beatable: '+objective);
 }
}
// Verify the real main-board scoring function adds the named Campaign step.
{
 const b=board(basic);Object.assign(c,{MATCH:false,scoreLv:()=>1,RULE:()=>false,epVictim:()=>null,hasE:()=>false,isC:()=>false,chalBonusNow:()=>false});
 c.RUN={land:'street',roster:['K','R'],money:10,relics:[]};c.B={board:b,moveCount:0,caps:0,moves:10,lost:0,streak:0};
 c.attacksOn=(b,side)=>[...new Set(b.flatMap((p,i)=>p?.side===side?c.attackSquares(b,i):[]))];
 vm.runInContext(slice('function scoreCapture(','/* ---------- screens ----------'),c);
 const res=c.scoreCapture(56,48);assert(res.steps.some(s=>s.label==='Opening tempo'&&s.c===10));assert.equal(res.total,Math.round(res.chips*res.mult));
 const state=JSON.stringify(c.B);c.scoreCapture(56,48);assert.equal(JSON.stringify(c.B),state,'Score preview is pure');
}
// The paid, saved route stays actionable at $0 while unpaid shortcuts disable.
{
 const ui=readFileSync('journey-world-ui.js','utf8'),from=ui.indexOf('function selectWorldStop('),to=ui.indexOf('function requestWorldJourney(');
 const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{classList:{add(){}},style:{},textContent:''});return nodes.get(id);};
 const d=vm.createContext({traveling:false,committed:false,selected:null,networkData:{money:0,record:{}},networkPlan:{active:[{to:'fight-3',cost:2}],byId:{'fight-3':{id:'fight-3',type:'fight'}}},JOURNEY_STOP_TYPES:{fight:{label:'Battle',description:'Battle'}},document:{querySelectorAll:()=>[]},$:el,worldColor:()=>'',worldStopName:()=>'',worldBenefit:()=>''});
 vm.runInContext(ui.slice(from,to),d);vm.runInContext("selectWorldStop('fight-3')",d);assert.equal(el('#setOff').disabled,true);
 d.networkData.record.hop='fight-3';vm.runInContext("selectWorldStop('fight-3')",d);assert.equal(el('#setOff').disabled,false,'Committed toll is never requested again');
}
console.log('PASS: actual battle score totals include Campaign bonuses, previews do not mutate state, and paid shortcut resumes remain enabled at zero cash.');
// Every Campaign identity has a readable strategy; the real signature roster
// generator respects the requested army size and exactly one King.
{
 c.clamp=(x,a,b)=>Math.max(a,Math.min(b,x));c.parseR=x=>({t:String(x)[0]});c.RUN={roster:['K','Q','R','B','N','N','P','P']};
 vm.runInContext("const sigBase = a => a ? a.replace('+', '') : null;\n"+slice('function signatureRoster(','/* ---------- enemy army progression'),c);
 let identities=0,armies=0;
 for(const land of ['street','medieval','greek','fantasy','throne']){
  for(const circuit of ['downtown','rooftop','harbor','midnight'])for(let ante=1;ante<=4;ante++){
   const plan=c.campaignBossPlan({land,circuit,ante});assert(plan.tactic&&plan.weakness);identities++;
   for(let n=6;n<=16;n++){const army=c.signatureRoster(plan.signature,n,0);assert.equal(army.length,n);assert.equal(army.filter(t=>t==='K').length,1);armies++;}
  }
  assert(c.campaignBossPlan({land,circuit:'ruler',ante:6}).weakness);identities++;
 }
 assert.equal(identities,85);console.log('PASS: all 85 encounter strategies have counterplay; '+armies+' generated signature armies respect size and King constraints.');
}
