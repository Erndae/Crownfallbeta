import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const game=readFileSync('game.html','utf8'),bridge=readFileSync('game-bridge.js','utf8'),ui=readFileSync('journey-encounter-ui.js','utf8');
const source=game.slice(game.indexOf('function pieceSound('),game.indexOf('const T = ms =>'));
let notes=[];const ctx=vm.createContext({soundOn:true,tone:n=>notes.push(['tone',n]),noise:n=>notes.push(['noise',n])});vm.runInContext(source,ctx);
const voices=[];
for(const t of 'PNBRQK'){
 notes=[];vm.runInContext(`pieceSound('${t}','move')`,ctx);assert(notes.length>=2);assert(notes.every(([,n])=>n.vol>0&&n.vol<=.22));voices.push(JSON.stringify(notes));
 notes=[];vm.runInContext(`pieceSound('${t}','pick')`,ctx);assert.equal(notes.length,1);
 notes=[];vm.runInContext(`pieceSound('${t}','capture',true,.18)`,ctx);assert(notes.length>=4);assert(notes.every(([,n])=>n.at>=.18));
}
assert.equal(new Set(voices).size,6,'Each chess piece has a distinct move voice');
ctx.soundOn=false;notes=[];vm.runInContext("pieceSound('N','capture')",ctx);assert.equal(notes.length,0,'Mute remains respected');
assert(bridge.includes("worldPieceSound(piece.t,'pick')"));assert(bridge.includes("victim?'capture':'move'"));assert(bridge.includes("worldPieceSound(mover.t,capture?'capture':'move',true)"));assert(ui.includes("localStorage.setItem('gambit-sound'"));
assert(game.includes("pieceSound(mover.t,'capture')")&&game.includes("pieceSound(p.t,'pick')"));
console.log('PASS: six distinct piece voices, selection/move/capture cues, separated enemy reply audio, saved mute toggle, and main-board/roadside sound wiring.');
