'use strict';
// Shared geography: the map and Campaign stage screens read the same locations.
const JOURNEY_WORLD = {
 street:{
  downtown:['Back Alley','Union Station','Clocktower Square','Rex’s Traffic Circle'],
  rooftop:['Fire Escape Row','Water Tank Walk','Skybridge Terrace','Sal’s Skyline Penthouse'],
  harbor:['Ferry Landing','Container Yard','Dry Dock Nine','Dee’s Harbor Office'],
  midnight:['Lantern Lane','Neon Arcade','Smuggler’s Court','Nico’s Night Exchange'],
  ruler:['Vex’s Downtown Tower'], terrain:['alley','arcade','overpass','depot']},
 medieval:{
  downtown:['Village Green','River Ford','Old Tollgate','Swiftblade’s Road Keep'],
  rooftop:['Outer Ramparts','Redstone Bailey','Banner Hall','Garran’s War Chamber'],
  harbor:['Meadow Crossing','Cavalry Yard','Ironbridge','Bran’s Great Stables'],
  midnight:['Guild Quarter','Wool Exchange','Treasury Steps','Corvin’s Counting House'],
  ruler:['Aldric’s Iron Throne'], terrain:['cloister','caravan','battlement','granary']},
 greek:{
  downtown:['Marathon Fields','Laurel Mile','Runner’s Colonnade','Atalanta’s Finish Gate'],
  rooftop:['Olympian Steps','Lion Court','Pillar of Trials','Heracles’ Summit Arena'],
  harbor:['Achaean Beach','Horsebuilders’ Yard','Scaean Gate','Hector’s Trojan Rampart'],
  midnight:['Colchis Landing','Golden Agora','Dragon Grove','Aeëtes’ Fleece Sanctuary'],
  ruler:['Athena’s Olympian Throne'], terrain:['olive walk','agora','trial path','offering vault']},
 fantasy:{
  downtown:['Whispering Woods','Gale Bridge','Cloudbreak Isle','Zephyra’s Storm Spire'],
  rooftop:['Crystal Caves','Mirror Stair','Prism Court','Veyl’s Crystal Sanctum'],
  harbor:['Featherfall Landing','Griffin Roost','Skyclaw Ridge','Seraphon’s High Eyrie'],
  midnight:['Mushroom Lane','Goblin Market','Coinburrow','Grubnik’s Hoard Hall'],
  ruler:['Morwen’s Shadow Citadel'], terrain:['runestone path','bazaar','rift crossing','relic cache']},
 throne:{
  downtown:['Gate of Ash','Cinder Causeway','Ember Watch','Herald’s Ashen Beacon'],
  rooftop:['Hall of Echoes','Broken Coronation','Crownless Gallery','Hollow Crown’s Dais'],
  harbor:['Ruined Stables','Pale Rider Bridge','Black Cavalry Yard','Ruined Knight’s Bastion'],
  midnight:['Tribute Steps','Vault of Crowns','Debtor’s Hall','Tithe Lord’s Treasury'],
  ruler:['The Fallen Throne'], terrain:['ash refuge','last outpost','siege path','tribute cache']}
};
function journeyPlaces(land,circuit){const w=JOURNEY_WORLD[land]||JOURNEY_WORLD.street;return w[circuit]||w.downtown;}
function journeyStagePlace(land,circuit,stage){const p=journeyPlaces(land,circuit);return p[circuit==='ruler'?0:(stage-1)%p.length];}
const JOURNEY_STOP_TYPES={
 safer:{symbol:'◇',label:'Shelter',detail:'−20% target',description:'Scout a protected approach: 20% lower target in the next fight. A later danger stop replaces this advantage.'},
 risky:{symbol:'!',label:'Danger',detail:'+20% target · +$8 win',description:'Take a dangerous approach: 20% higher target and $8 extra on victory. A later shelter replaces this challenge.'},
 supply:{symbol:'$',label:'Shop',detail:'Shop · +$5 supplies',description:'Collect $5 once and enter this shop to recruit, trade and train. Leaving returns you to this location on the map.'},
 cache:{symbol:'+',label:'Supply cache',detail:'Collect $3 once',description:'Collect $3 from this cache, then choose your next connection. No shop here.'},
 road:{symbol:'·',label:'Junction',detail:'Choose the next connection',description:'Travel to this junction to reach the paths beyond it. No target change or cash reward.'},
 fight:{symbol:'⚔',label:'Battle',detail:'Enter the next fight',description:'Arrive at this location to enter its Campaign stage. Your chosen approach applies to this fight.'}
};
// Four different junction layouts, rotated across circuits and lands. All paths move forward.
const JOURNEY_LAYOUTS=[
 {a:['safer','road'],b:['supply','risky','cache'],ab:[[0,2],[0,1]],direct:[1]},
 {a:['cache','supply','risky'],b:['safer','road'],ab:[[0],[0,1],[1]],direct:[]},
 {a:['road','safer'],b:['risky','supply'],ab:[[0,1],[1]],direct:[0,1]},
 {a:['supply','cache','road','safer'],b:['risky','safer','cache'],ab:[[0,1],[1,2],[0,2],[2]],direct:[2,3]}
];
function journeyGraph(data={}){
 const land=data.land||'street',circuit=data.circuitId||'downtown',ruler=circuit==='ruler'||data.ruler;
 const count=ruler?1:4, current=ruler?1:Math.max(1,Math.min(4,Number(data.stage)||2));
 const li=Math.max(0,Object.keys(JOURNEY_WORLD).indexOf(land)),ci=Math.max(0,['downtown','rooftop','harbor','midnight','ruler'].indexOf(circuit));
 const nodes=[],edges=[],byId={};
 const add=n=>{nodes.push(n);byId[n.id]=n;return n;};
 const link=(a,b)=>edges.push({from:a.id,to:b.id});
 const ys=[460,650,380,260,510];
 const battle=(i)=>add({id:'fight-'+i,stage:i,type:i?'fight':'entry',name:i?journeyStagePlace(land,ruler?'ruler':circuit,i):'District entrance',x:160+i*1040,y:ys[(i+li+ci)%5],boss:i===count});
 let prev=battle(0);
 for(let i=1;i<=count;i++){
  const end=battle(i),layout=JOURNEY_LAYOUTS[(i-1+ci+li)%4],base=160+(i-1)*1040;
  const place=journeyStagePlace(land,ruler?'ruler':circuit,i),terrain=(JOURNEY_WORLD[land]||JOURNEY_WORLD.street).terrain;
  const suffix={safer:terrain[0],supply:terrain[1],risky:terrain[2],cache:terrain[3],road:'junction'};
  const layer=(types,col)=>types.map((type,j)=>add({id:`s${i}-${col}${j}`,stage:i,type,name:place+' · '+(col==='a'?'West ':'East ')+suffix[type],district:place,short:(col==='a'?'West ':'East ')+suffix[type],x:base+(col==='a'?330:680)+(j%2?20:-20),y:types.length===2?[240,690][j]:types.length===4?[130,350,570,790][j]:[150,450,760][j]}));
  const a=layer(layout.a,'a'),b=layer(layout.b,'b');a.forEach(n=>link(prev,n));
  layout.ab.forEach((targets,j)=>targets.forEach(k=>link(a[j],b[k])));layout.direct.forEach(j=>link(a[j],end));b.forEach(n=>link(n,end));
  prev=end;
 }
 const record=data.record||{},position=record.position||'fight-'+(current-1);
 const active=record.hop?[edges.find(e=>e.from===position&&e.to===record.hop)].filter(Boolean):edges.filter(e=>e.from===position&&byId[e.to].stage===current);
 return {nodes,edges,byId,width:count*1040+340,height:1000,current,count,position,active:data.location?[]:active,start:byId[position]||byId['fight-'+(current-1)]};
}
