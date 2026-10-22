import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8');
const tracks=game.slice(game.indexOf('const MUSIC ='),game.indexOf('let musicOn ='));
const routing=game.slice(game.indexOf('function sceneMusic(kind)'),game.indexOf('function musicControls'));
const c={RUN:null,MM:{},document:{body:{dataset:{}}},coachReady(){},land(){return c.RUN?.land||'street'},bossAt:()=>c.boss,setMusicContext(k){c.playing=k}};
vm.createContext(c);vm.runInContext(tracks+routing,c);
const call=s=>vm.runInContext(s,c);
call("sceneMusic('menu')");assert.equal(c.playing,'menu');
call("sceneMusic('training')");assert.equal(c.playing,'street-battle');
for(const land of ['street','medieval','greek','fantasy','throne']){
 c.PACK=land;call("sceneMusic('selection')");assert.equal(c.playing,land);
 c.RUN={land,circuit:'normal',blind:2,ante:1};
 call("sceneMusic('land')");assert.equal(c.playing,land);
 call("sceneMusic('battle')");assert.equal(c.playing,land+'-battle');
 call("sceneMusic('land')");assert.equal(c.playing,land);
 call("sceneMusic('menu')");assert.equal(c.playing,'menu');
}
c.RUN={land:'throne',circuit:'ruler',blind:2,ante:6};c.boss='ruler';
call("sceneMusic('battle')");assert.equal(c.playing,'crownless');
call("sceneMusic('land')");assert.equal(c.playing,'throne');
c.RUN.blind=1;call("sceneMusic('battle')");assert.equal(c.playing,'throne-battle');
const files=call('Object.values(MUSIC.tracks)');assert.equal(new Set(files).size,12);
for(const f of files)assert(existsSync(f),f);
const manifest=JSON.parse(readFileSync('soundtrack/manifest.json','utf8'));assert.equal(manifest.tracks.length,12);
for(const t of manifest.tracks){assert(t.seconds>30&&t.peak>0&&t.peak<1);assert(files.includes(t.file))}
assert(readFileSync('legacy.html','utf8').includes("'crownfall-main-theme.mp3'"));
console.log('PASS: twelve distinct audio assets; title, tutorial, all land travel/battle routes and final-boss restrictions; decoded audio levels; legacy preserved.');
