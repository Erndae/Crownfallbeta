import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const c=vm.createContext({});vm.runInContext(readFileSync('journey-map.js','utf8'),c);
for(const stage of [1,2,3,4]){
 const p=vm.runInContext(`planJourneyNetwork({stage:${stage},stages:4})`,c);
 assert.equal(p.links.length,12);assert.equal(p.links.filter(l=>l.active).length,3);
 for(const l of p.links.filter(l=>l.active)){
  assert(l.path.startsWith(`M${p.start.x} ${p.start.y}`));
  const endpoint=l.route==='supply'?l.b:l.c;assert(l.path.endsWith(`${endpoint.x} ${endpoint.y}`));
 }
}
const exit=vm.runInContext("planJourneyNetwork({stage:3,stages:4,leg:'depart'})",c);
assert.equal(exit.links.filter(l=>l.active).length,1);assert.equal(exit.links.find(l=>l.active).route,'supply');
const ruler=vm.runInContext("planJourneyNetwork({stage:6,stages:6,ruler:true})",c);assert.equal(ruler.count,1);assert.equal(ruler.current,1);
const landed=vm.runInContext("planJourneyNetwork({stage:3,stages:4,location:'fight'})",c);assert.equal(landed.links.filter(l=>l.active).length,0);
console.log('PASS: connected multi-stage map; only reachable branches selectable; market path ends at shop; onward leg reaches fight; ruler and arrived views.');
