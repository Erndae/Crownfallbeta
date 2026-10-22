import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
for(const file of ['index.html','game.html','legacy.html']) {
 const html=readFileSync(file,'utf8');
 assert.match(html, /<head>\s*<script src="beta-storage.js"><\/script>/);
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(m[1],{filename:file});
 for(const m of html.matchAll(/["']([^"'<>\n]+\.(?:webp|png|mp3|svg|css|js))["']/g)) if(!m[1].includes(':')) assert(existsSync(m[1]),'Missing '+m[1]);
}
for(const file of ['beta-storage.js','journey.js','journey-world.js','journey-events.js','journey-encounter-ui.js','journey-world-ui.js','journey-cartography.js','journey-atlas-themes.js','journey-map.js','journey-lands.js','sw.js']) new vm.Script(readFileSync(file,'utf8'),{filename:file});
const html=readFileSync('game.html','utf8');
const storageLayer=html.slice(html.indexOf('const RAW_GET ='),html.indexOf('(function(){\nconst $ ='));
for(const mode of ['campaign','gauntlet']) {
 const ctx=vm.createContext({});
 vm.runInContext(`class Storage {
  constructor(){this.data=new Map()}
  getItem(k){return this.data.get(String(k))??null}
  setItem(k,v){this.data.set(String(k),String(v))}
  removeItem(k){this.data.delete(String(k))}
  clear(){this.data.clear()}
  key(i){return [...this.data.keys()][i]??null}
  get length(){return this.data.size}
 }
 const localStorage=new Storage(), sessionStorage=new Storage();
 const window={localStorage};
 localStorage.setItem('cf151c-gambit-run','production');
 localStorage.setItem('crownfall-beta-army-limits-gambit-run','old-beta');
 localStorage.setItem('crownfall-beta-journey-crownfall-mode','${mode}');`,ctx);
 vm.runInContext(readFileSync('beta-storage.js','utf8'),ctx);
 vm.runInContext(storageLayer,ctx);
 vm.runInContext(`localStorage.setItem('gambit-run','beta');rawSet('crownfall-intent','journey-open');sessionStorage.setItem('test','session');`,ctx);
 const data=vm.runInContext('Object.fromEntries(localStorage.data)',ctx);
 assert.equal(data['cf151c-gambit-run'],'production');
 assert.equal(data['crownfall-beta-army-limits-gambit-run'],'old-beta');
 assert.equal(data['crownfall-beta-journey-'+(mode==='gauntlet'?'cf151g-':'cf151c-')+'gambit-run'],'beta');
 assert.equal(data['crownfall-beta-journey-crownfall-intent'],'journey-open');
 assert.equal(vm.runInContext("localStorage.getItem('gambit-run')",ctx),'beta');
 vm.runInContext('localStorage.clear()',ctx);
 assert.equal(vm.runInContext("localStorage.data.get('cf151c-gambit-run')",ctx),'production');
 assert.equal(vm.runInContext("localStorage.data.get('crownfall-beta-army-limits-gambit-run')",ctx),'old-beta');
 assert.equal(vm.runInContext("sessionStorage.getItem('test')",ctx),'session');
}
console.log('PASS: scripts parse, assets resolve, Campaign/Gauntlet beta storage and raw mode operations stay isolated; production and old-beta saves survive clear.');
