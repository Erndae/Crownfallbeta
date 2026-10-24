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
 {a:['supply','cache','road','safer'],b:['risky','safer','cache'],ab:[[0],[0,1],[1,2],[2]],direct:[3]}
];
function journeyGraph(data={}){
 const land=data.land||'street',circuit=data.circuitId||'downtown',ruler=circuit==='ruler'||data.ruler;
 const count=ruler?1:4, current=ruler?1:Math.max(1,Math.min(4,Number(data.stage)||2));
 const li=Math.max(0,Object.keys(JOURNEY_WORLD).indexOf(land)),ci=Math.max(0,['downtown','rooftop','harbor','midnight','ruler'].indexOf(circuit));
 const nodes=[],edges=[],byId={};
 const add=n=>{nodes.push(n);byId[n.id]=n;return n;};
 const link=(a,b,extra={})=>edges.push({from:a.id,to:b.id,...extra});
 const stride=1400;
 const battle=(i)=>add({id:'fight-'+i,stage:i,type:i?'fight':'entry',name:i?journeyStagePlace(land,ruler?'ruler':circuit,i):'District entrance',x:160+i*stride,y:500,boss:i===count});
 let prev=battle(0);
 for(let i=1;i<=count;i++){
  const end=battle(i),layout=JOURNEY_LAYOUTS[(i-1+ci+li)%4],base=160+(i-1)*stride;
  const place=journeyStagePlace(land,ruler?'ruler':circuit,i),terrain=(JOURNEY_WORLD[land]||JOURNEY_WORLD.street).terrain;
  const suffix={safer:terrain[0],supply:terrain[1],risky:terrain[2],cache:terrain[3],road:'junction'};
  const layoutIndex=(i-1+ci+li)%4;
  const layer=(types,col)=>types.map((type,j)=>add({id:`s${i}-${col}${j}`,stage:i,type,name:place+' · '+(col==='a'?'West ':'East ')+suffix[type],district:place,short:(col==='a'?'West ':'East ')+suffix[type],x:base+(col==='a'?360:780),y:col==='b'&&layoutIndex===0?[500,800,200][j]:types.length===2?[260,740][j]:types.length===4?[170,390,610,830][j]:[200,500,800][j]}));
  const a=layer(layout.a,'a'),b=layer(layout.b,'b');a.forEach(n=>link(prev,n));
  layout.ab.forEach((targets,j)=>targets.forEach(k=>link(a[j],b[k])));layout.direct.forEach(j=>link(a[j],end,{shortcut:true,cost:2}));b.forEach(n=>link(n,end));
  // A late junction must branch too. Keep the existing direct battle edge
  // so committed journeys and old saves retain their original destination.
  b.filter(n=>n.type==='road').forEach(junction=>{
   ['safer','supply'].forEach((type,k)=>{
    const direction=k?'South ':'North ',short=direction+suffix[type];
    const branch=add({id:`${junction.id}-branch${k}`,stage:i,type,name:place+' · '+short,district:place,short,x:base+1080,y:k?840:640});
    link(junction,branch);link(branch,end);
   });
  });
  prev=end;
 }
 const record=data.record||{},position=record.position||'fight-'+(current-1);
 // A journey already saved on an old connection still reaches its chosen stop.
 // New choices use the untangled layout; IDs, visits and rewards remain stable.
 if(record.hop&&byId[position]&&byId[record.hop]&&!edges.some(e=>e.from===position&&e.to===record.hop)){
  const target=byId[record.hop];
  edges.push({from:position,to:target.id,legacy:true,...(target.type==='fight'?{shortcut:true,cost:2}:{})});
 }
 const active=record.hop?[edges.find(e=>e.from===position&&e.to===record.hop)].filter(Boolean):edges.filter(e=>e.from===position&&byId[e.to].stage===current);
 return {nodes,edges,byId,width:count*stride+340,height:1000,current,count,position,active:data.location?[]:active,start:byId[position]||byId['fight-'+(current-1)]};
}

// Describe the actual outgoing connections, rather than promising unseen paths.
function journeyJunctionSummary(graph,node){
 const exits=graph.edges.filter(e=>e.from===node.id).map(e=>graph.byId[e.to]);
 const labels={safer:'shelter (−20% target)',supply:'shop (+$5 supplies)',risky:'danger (+$8 on victory)',cache:'cache (+$3)',fight:'the next battle',road:'another junction'};
 return 'Choose from '+exits.length+' routes: '+exits.map(n=>labels[n.type]||n.name).join(' · ')+'.';
}

// All lands share readable forward lanes. Only the surface changes by land.
// Cubic fans separate at stops; paid bypasses run outside the roadside lanes.
function journeyRoadSegments(a,b,edge={}){
 const curve=(x,y,u,v)=>[x,y,x+(u-x)*.42,y,u-(u-x)*.42,v,u,v];
 if(edge.shortcut){
  const lane=a.y<500?90:940,exit=a.x+110,entry=b.x-110;
  return [curve(a.x,a.y,exit,lane),curve(exit,lane,entry,lane),curve(entry,lane,b.x,b.y)];
 }
 if(a.type==='road'&&/-b\d+$/.test(a.id)&&b.type==='fight'){
  const mid=a.x+300;
  return [curve(a.x,a.y,mid,a.y),curve(mid,a.y,b.x,b.y)];
 }
 return [curve(a.x,a.y,b.x,b.y)];
}
function journeyRoadPath(a,b,edge={}){
 const segments=journeyRoadSegments(a,b,edge);
 return `M${a.x} ${a.y} `+segments.map(s=>`C${s.slice(2).join(' ')}`).join(' ');
}
