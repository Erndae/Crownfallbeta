import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c={};vm.createContext(c);vm.runInContext(readFileSync('journey-world.js','utf8'),c);
const run=s=>vm.runInContext(s,c),lands=['street','medieval','greek','fantasy','throne'];
const point=(s,t)=>{const q=1-t;return {x:q*q*q*s[0]+3*q*q*t*s[2]+3*q*t*t*s[4]+t*t*t*s[6],y:q*q*q*s[1]+3*q*q*t*s[3]+3*q*t*t*s[5]+t*t*t*s[7]};};
function intersect(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<-0.0001&&cross(c,d,a)*cross(c,d,b)<-0.0001;}
let layouts=0;
for(const land of lands)for(const circuitId of ['downtown','rooftop','harbor','midnight','ruler']){
 const g=run('journeyGraph('+JSON.stringify({land,circuitId,stage:1})+')');
 const paths=g.edges.map(e=>{const a=g.byId[e.from],b=g.byId[e.to],segs=run('journeyRoadSegments('+JSON.stringify(a)+','+JSON.stringify(b)+','+JSON.stringify(e)+')');return {e,pts:segs.flatMap(s=>Array.from({length:41},(_,i)=>point(s,i/40)))};});
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){
  const a=paths[i],b=paths[j];
  for(let k=1;k<a.pts.length;k++)for(let l=1;l<b.pts.length;l++)assert(!intersect(a.pts[k-1],a.pts[k],b.pts[l-1],b.pts[l]),`${land}/${circuitId}: ${a.e.from}>${a.e.to} crosses ${b.e.from}>${b.e.to}`);
 }
 layouts++;
}
// Previously locked connections removed by untangling still resume.
const old=run("journeyGraph({land:'street',circuitId:'downtown',stage:4,record:{position:'s4-a2',hop:'s4-b0'}})");
assert.equal(old.active[0].to,'s4-b0');assert(old.active[0].legacy);
const surfaces=readFileSync('journey-atlas-themes.js','utf8');assert(surfaces.includes("medieval:'dirt'"));
console.log(`${layouts} land/circuit maps have no crossing roads; old locked journeys preserved.`);
// Exercise departure, camera following, reduced motion and cancellation with the real UI functions.
let rect={top:0,bottom:440},focusCalls=0,frames=[],camera=[],sent=[],clock=0;
const classes={add(){},remove(){}},els={
 '#mapWindow':{classList:classes,scrollIntoView(){focusCalls++;rect={top:8,bottom:448};},getBoundingClientRect:()=>rect},
 '#mapOverview':{},'#setOff':{},'#setOffText':{},'#travelStatus':{},
 '#traveler':{setAttribute(k,v){this[k]=v;}}
};
const path={getTotalLength:()=>100,getPointAtLength:t=>({x:160+t,y:500})};
Object.assign(c,{$:s=>els[s]||path,document:{querySelector:()=>({innerHTML:''})},networkPlan:{start:{x:160,y:500},active:[{to:'stop'}]},networkCamera:(...a)=>camera.push(a),sizeJourneyNetwork(){c.sized=true;},performance:{now:()=>clock},requestAnimationFrame:f=>frames.push(f),send:(...a)=>sent.push(a),window:{innerHeight:700,visualViewport:{height:700}},setTimeout(){},traveling:false,committed:true,pendingJourney:{key:'saved'},selected:'stop',travelToken:0,reduced:false,networkOverview:true});
vm.runInContext(readFileSync('journey-world-ui.js','utf8'),c);
run('walkWorldStop()');assert.equal(c.networkOverview,false);assert(c.sized);assert.equal(focusCalls,1);assert.equal(sent.length,0);
rect={top:-70,bottom:370};frames.shift()(900);assert.equal(focusCalls,2,'Moving King returns an offscreen map to view');assert(camera.length>=2);
frames.shift()(1800);assert.equal(sent[0][0],'journey-arrive');assert.equal(sent[0][1].node,'stop');
c.traveling=false;c.reduced=true;clock=2000;run('walkWorldStop()');frames.shift()(2000);assert.equal(sent.length,2,'Reduced motion arrives without a travel delay');
c.traveling=false;c.reduced=false;run('walkWorldStop()');const cancelled=frames.shift();c.travelToken++;cancelled(4000);assert.equal(sent.length,2,'Cancelled travel cannot arrive');
console.log('Departure focuses the map, exits overview, follows offscreen movement, supports reduced motion, and cancels safely.');
