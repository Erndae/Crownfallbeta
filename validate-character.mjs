import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const values=new Map([['campaign-save','untouched'],['gauntlet-save','untouched']]),events=[];let blocked=false;
const c={window:{addEventListener(){},dispatchEvent:e=>events.push(e.type)},document:{querySelectorAll:()=>[],addEventListener(){}},CustomEvent:class{constructor(type){this.type=type;}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('quota');values.set(k,v);}}};vm.createContext(c);vm.runInContext(readFileSync('character-style.js','utf8'),c);const api=c.window.CrownfallCharacter;
assert.equal(api.get().name,'Crownrunner');const drawings=new Set();
for(const palette of ['gold','ivory','coral','mint','sky','lilac'])for(const crown of ['classic','street','regal','runic'])for(const crest of ['none','diamond','bolt','star']){assert(api.save({name:'Night Runner',palette,crown,crest}));assert.equal(api.get().palette,palette);assert.equal(api.get().crown,crown);assert.equal(api.get().crest,crest);drawings.add(api.svg());}
assert.equal(drawings.size,96);assert.equal(values.size,3);assert.equal(values.get('campaign-save'),'untouched');assert.equal(values.get('gauntlet-save'),'untouched');
api.save({name:'\u0000   ',palette:'__proto__',crown:'<script>',crest:'unknown'});assert.equal(api.get().name,'Crownrunner');assert.equal(api.get().palette,'gold');assert.equal(api.get().crown,'classic');assert.equal(api.get().crest,'none');
values.set('crownrunner-character-v1','broken JSON');assert.equal(api.get().name,'Crownrunner');const count=events.length;blocked=true;assert.equal(api.save({name:'Unsaved'}),false);assert.equal(events.length,count);
console.log('PASS: 96 distinct cosmetic combinations, normalized profiles, persistent selection, corrupt-storage fallback, failed-save handling, and untouched Campaign/Gauntlet data.');
