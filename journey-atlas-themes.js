'use strict';
// Separate architecture and terrain for each land; travel geometry comes from the game graph.
function createJourneyAtlasTheme(c){
 const {add,rect,p,g,data,seed,clear,paths,samples}=c,land=data.land||'street';
 const path=(parent,d,fill,stroke=p.edge,width=2,extra={})=>add(parent,'path',{d,fill,stroke,'stroke-width':width,...extra});
 const group=(parent,cls,x=0,y=0)=>add(parent,'g',{class:cls,transform:`translate(${x} ${y})`});
 const circle=(parent,x,y,r,fill,stroke='none',width=1)=>add(parent,'circle',{cx:x,cy:y,r,fill,stroke,'stroke-width':width});
 function tree(parent,x,y,s=1,kind=land){
  const t=group(parent,'atlas-tree',x,y);t.setAttribute('transform',`translate(${x} ${y}) scale(${s})`);
  if(kind==='throne'){path(t,'M0 12V-24M0-8L-13-19M0-15L13-29','none','#70605e',3);return;}
  circle(t,4,5,17,'#101c214d');
  if(kind==='medieval'){path(t,'M0-29L17 0H10L20 13H-20L-10 0H-17Z','#355443','#678266',1);path(t,'M0-20V15','none','#9da579',1);}
  else{circle(t,0,0,17,kind==='greek'?'#829064':kind==='fantasy'?'#426c77':'#41695b',kind==='fantasy'?'#72b0b5':'#75917a');circle(t,-5,-5,8,kind==='greek'?'#b4b68b':'#87a18b66');}
 }
 function cityBuilding(parent,x,y,w,h,tall=false,neon=false){
  const roof=tall?'#485464':seed(x,y)>.5?'#7a514b':'#566373',rise=tall?19:9;
  const b=group(parent,'atlas-city-building',x,y);
  path(b,`M5 ${h}L${w+13} ${h}L${w+13} ${rise}L${w} 0Z`,'#0c151c88','none');
  rect(b,0,rise,w,h,'#263445','#14212b',1);
  for(let i=6;i<w-5;i+=12)rect(b,i,h+rise-5,5,4,neon?'#f1c17e':'#9eafac','#182532',0);
  rect(b,0,0,w,h,roof,'#9ca5a0',1);rect(b,5,5,w-10,h-10,'none','#1a293a',1);
  if(tall){rect(b,9,9,w-18,h-18,'#38485a','#7f939b',1);path(b,`M${w/2} 6V${h-6}M6 ${h/2}H${w-6}`,'none','#8da6ae',1);}
  else{rect(b,10,10,14,10,'#303d4b','#a4a49a',1);if(w>50)circle(b,w-15,h-15,7,'#33414b','#a1a8a2');}
  if(neon){path(b,`M-2 ${h-2}V-2H${w+2}`,'none',seed(x,y)>.5?'#dc6398':'#6cb6c4',2.5);}
 }
 function temple(parent,x,y,w=124,h=80){
  const t=group(parent,'atlas-marble-temple',x,y);
  rect(t,-w/2-10,-h/2-9,w+20,h+18,'#9eabac','#c6d6cf',1);
  rect(t,-w/2-5,-h/2-5,w+10,h+10,'#d3d7c0','#f2e7c9',1);
  rect(t,-w/2+10,-h/2+11,w-20,h-22,'#a1aaa0','#eee9cd',0);
  for(let xx=-w/2+7;xx<w/2;xx+=17)for(const yy of[-h/2+4,h/2-4])circle(t,xx,yy,4.5,'#fff1d0','#929e98');
  path(t,`M${-w/2+13} 0L0 ${-h/2+12}L${w/2-13} 0L0 ${h/2-12}Z`,'#e6dec2','#a6ad9c');
 }
 function keep(parent,x,y,large=false){
  const t=group(parent,'atlas-stone-fortress',x,y),w=large?146:112,h=large?90:72;
  rect(t,-w/2,-h/2,w,h,'#6a7171','#b5b49b',1);rect(t,-w/2+15,-h/2+15,w-30,h-30,'#424f49','#a09c87',1);
  for(const xx of[-w/2,w/2])for(const yy of[-h/2,h/2]){circle(t,xx+3,yy+5,16,'#111d2388');circle(t,xx,yy,16,'#a39d88','#c6bea3',2);circle(t,xx,yy,8,'#555f61');}
  for(let xx=-w/2+20;xx<w/2-12;xx+=18){rect(t,xx,-h/2-5,9,10,'#c0b69a','#5d6665',0);rect(t,xx,h/2-5,9,10,'#c0b69a','#5d6665',0);}
  rect(t,-9,h/2-8,18,18,'#292d2b','#b6ac89',1);
  path(t,'M0-8V-49M0-49L25-42 0-33Z','#b45755','#ce9a6a',2);
 }
 function crystal(parent,x,y,size=1,color='#8db8e4'){
  const t=group(parent,'atlas-crystal',x,y);t.setAttribute('transform',`translate(${x} ${y}) scale(${size})`);
  path(t,'M0-39L16-13 10 12-10 12-17-13Z',color,'#d1e4f2',1.5);path(t,'M0-39V12M-17-13H16','none','#f1edff',1);circle(t,0,0,25,'none',color,1);}
 function floatingIsland(parent,x,y,w,h){
  const t=group(parent,'atlas-floating-island',x,y);
  path(t,`M${-w/2} 0L${-w*.27} ${h*.37}L-12 ${h*.7}L15 ${h*.34}L${w*.3} ${h*.25}L${w/2} 0Z`,'#292438','#686080',2);
  path(t,`M${-w/2} 0L${-w*.35} ${-h*.3}L${w*.12} ${-h*.36}L${w/2} ${-h*.15}L${w/2} 0L${w*.1} ${h*.16}L${-w*.34} ${h*.1}Z`,'#4b5365','#a49ac2',2);
  path(t,`M${-w*.3} ${h*.12}L-12 ${h*.7}M${w*.2} ${h*.1}L15 ${h*.34}`,'none','#77708c',1);
 }
 function ruin(parent,x,y,w=90,h=70){
  const t=group(parent,'atlas-shattered-ruin',x,y);
  path(t,`M${-w/2}-4V${-h/2}H-12L-5 ${-h/2+15}L8 ${-h/2}H${w/2}V8L${w/2-18} 2L${w/2} 24V${h/2}H15L3 ${h/2-17}L-8 ${h/2}H${-w/2}V14L${-w/2+17} 5Z`,'#514954','#9a7e7b',3);
  path(t,`M${-w/2+12} -3V${-h/2+12}H${w/2-12}V${h/2-12}H-3`,'none','#201f2c',7);
  path(t,'M-15-24L-3-8-11 2 5 21M4-5L26-17','none','#e99b71',2);
  for(let k=0;k<4;k++)rect(t,-w/2+k*27,h/2+12+(k%2)*9,12,8,'#6e5a60','#8b7472',0);
 }
 function terrain(parent){
  parent.dataset.architecture=land;
  if(land==='street'){
   // Side streets, rail lines and blocks establish a dense urban district around the route.
   const grid=group(parent,'atlas-city-grid');
   for(let x=100;x<g.width;x+=270){path(grid,`M${x} 75V965`,'none','#111d2b',18);path(grid,`M${x-12} 75V965M${x+12} 75V965`,'none','#5c657044',2);}
   for(const y of[105,882,950])path(grid,`M0 ${y}H${g.width}`,'none','#172432',18);
   path(grid,`M0 916H${g.width}M0 928H${g.width}`,'none','#8a9291',2);
   for(let x=0;x<g.width;x+=28)path(grid,`M${x} 911V933`,'none','#697777',2);
   for(let x=420;x<g.width;x+=1040)add(grid,'text',{x,y:970,fill:'#aab2b2',opacity:.6,'font-size':15,'letter-spacing':4},data.circuitId==='midnight'?'NIGHT EXCHANGE':'CROWN CITY TRANSIT');
  }else if(land==='medieval'){
   const hills=group(parent,'atlas-kingdom-terrain');
   for(let x=0;x<g.width;x+=155){path(hills,`M${x-45} 85L${x+35} 5L${x+110} 95Z`,'#31483f','#5f7961',1);path(hills,`M${x+14} 27L${x+35} 5L${x+55} 28L${x+37} 22Z`,'#b4b6a0','none');}
   for(let x=120;x<g.width;x+=1040){path(hills,`M${x-60} 114H${x+820}M${x-60} 876H${x+820}`,'none','#686c60',17);path(hills,`M${x-60} 114H${x+820}M${x-60} 876H${x+820}`,'none','#b3aa8a',5,{'stroke-dasharray':'13 15'});}
  }else if(land==='greek'){
   const coast=group(parent,'atlas-aegean-coast');
   path(coast,`M0 830Q260 875 490 840T${g.width} 842V1000H0Z`,'#245369','none');
   for(const y of[867,914,962])path(coast,`M0 ${y}Q260 ${y+30} 490 ${y}T${g.width} ${y}`,'none','#80b8bc',2,{opacity:.35});
   for(let x=190;x<g.width;x+=460){path(coast,`M${x} 850L${x+80} 825L${x+135} 850L${x+80} 867Z`,'#bfb79a','#ede3bd',2);}
  }else if(land==='fantasy'){
   const sky=group(parent,'atlas-astral-void');
   for(let x=20;x<g.width;x+=47)for(let y=22;y<980;y+=73){const r=seed(x,y);circle(sky,x+r*20,y,1+r*1.5,r>.6?'#b3b2e7':'#6d7ea5');}
   for(let x=250;x<g.width;x+=580){path(sky,`M${x-150} 850Q${x} 710 ${x+160} 880T${x+400} 790`,'none','#7062a5',37,{opacity:.12});}
   for(const n of g.nodes)floatingIsland(sky,n.x,n.y-30,n.type==='fight'?245:190,n.type==='fight'?175:138);
  }else{
   const ash=group(parent,'atlas-volcanic-ruins');
   for(let x=30;x<g.width;x+=260){const y=110+seed(x,4)*730;path(ash,`M${x-100} 0L${x-40} ${y*.4}L${x-65} ${y*.6}L${x+35} ${y}L${x} 1000`,'none','#9a493e',16,{opacity:.7});path(ash,`M${x-100} 0L${x-40} ${y*.4}L${x-65} ${y*.6}L${x+35} ${y}L${x} 1000`,'none','#ed9760',3,{opacity:.75});}
   for(let x=100;x<g.width;x+=210)path(ash,`M${x-30} 950L${x-10} 885L${x+10} 850L${x+25} 950Z`,'#211f2b','#65555e',2);
  }
 }
 function parcel(parent,x,y,w,h,r){
  if(land==='street'){
   if(r<.1){rect(parent,x,y,w,h,'#315244','#608478',4);tree(parent,x+w/2,y+h/2,.8);return;}
   const tall=data.circuitId==='rooftop'||r>.68;
   if(w>60&&r<.6){cityBuilding(parent,x,y,w*.45,h,tall,data.circuitId==='midnight'||r>.4);cityBuilding(parent,x+w*.53,y+3,w*.47,h-3,tall,r>.3);}
   else cityBuilding(parent,x,y,w,h,tall,data.circuitId==='midnight'||r>.72);
  }else if(land==='medieval'){
   if(r<.42){for(let k=0;k<3;k++)tree(parent,x+12+(k%2)*29,y+12+Math.floor(k/2)*29,.8);return;}
   const t=group(parent,'atlas-timber-houses',x,y);rect(t,3,6,w,h,'#2b343188','none');rect(t,0,0,w,h,'#918466','#4a463e',1);path(t,`M-4 ${h/2}L${w/2} -8L${w+4} ${h/2}L${w/2} ${h+7}Z`,r>.72?'#625c68':'#885b48','#baa47d',1);path(t,`M${w/2}-5V${h+4}`,'none','#d1b387',2);rect(t,w*.7,3,9,16,'#595b53','#a29c81',0);
  }else if(land==='greek'){
   if(r<.45){for(let k=0;k<3;k++)tree(parent,x+13+(k%2)*29,y+12+Math.floor(k/2)*28,.7,'greek');return;}
   if(r>.82){temple(parent,x+w/2,y+h/2,w,h);return;}
   rect(parent,x+4,y+5,w,h,'#142a3966','none');rect(parent,x,y,w,h,'#c2c6b6','#ece2bf',0);rect(parent,x+8,y+8,w-16,h-16,'#677e83','#f3e5c8',0);rect(parent,x+w/2-5,y+h/2-5,10,10,'#a2b5b2','#ebe4ca',0);
  }else if(land==='fantasy'){
   if(r<.4){floatingIsland(parent,x+w/2,y+h/2,w*.9,h*.8);crystal(parent,x+w/2,y+h/2,.45,r>.2?'#82c8c7':'#b394da');}
   else if(r>.84){tree(parent,x+w/2,y+h/2,.9,'fantasy');}
  }else{
   if(r<.3)tree(parent,x+w/2,y+h/2,.85,'throne');else ruin(parent,x+w/2,y+h/2,w,h);
  }
 }
 function roads(parent){
  parent.dataset.surface={street:'asphalt',medieval:'cobblestone',greek:'marble',fantasy:'rune-bridge',throne:'broken-causeway'}[land];
  for(const d of paths){
   if(land==='fantasy'){
    path(parent,d,'none','#101526',27);path(parent,d,'none','#887eac',17);path(parent,d,'none','#c7b9e2',2,{'stroke-dasharray':'3 16'});
   }else{
    path(parent,d,'none',p.pave,land==='street'?65:54);path(parent,d,'none',p.road,land==='street'?47:39);
    path(parent,d,'none',land==='street'?'#b9bfae':p.edge,land==='medieval'?26:1.5,{'stroke-dasharray':land==='medieval'?'2 10':land==='greek'?'3 12':'10 16','stroke-opacity':land==='medieval'?.22:.38});
   }
  }
  if(land==='street'){
   const furniture=group(parent,'atlas-city-traffic');
   samples.forEach(([x,y],i)=>{if(i%13||g.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<95))return;const color=['#a16c64','#c2ac74','#648fa0'][i%3];rect(furniture,x-4,y-9,8,18,color,'#172d38',2);rect(furniture,x-3,y-4,6,6,'#283e4b','none',0);});
   for(const n of g.nodes){for(let k=0;k<4;k++)rect(furniture,n.x-18+k*10,n.y+48,5,20,'#d2d4be99','none',0);for(const dx of[-50,50]){circle(furniture,n.x+dx,n.y-24,9,'#f6d19b13');circle(furniture,n.x+dx,n.y-24,2.5,'#f4d29d');}}
  }
 }
 function site(parent,n){
  const type=n.type,market=type==='supply',battle=type==='fight',safe=type==='safer'||battle&&!n.boss&&/woods|grove|fields|green|meadow/i.test(n.name);
  const bridge=battle&&!n.boss&&/bridge|crossing|ford|causeway/i.test(n.name);
  if(land==='fantasy'){
   circle(parent,0,0,battle?69:48,'#363e55','#9c92c2',2);circle(parent,0,0,battle?61:40,'none','#c4a4df',1);
   for(let k=0;k<8;k++){const a=k*Math.PI/4;path(parent,`M${Math.cos(a)*46} ${Math.sin(a)*46}l4-8 4 8-4 5Z`,'none','#9dc5db',1);}
   if(bridge){floatingIsland(parent,-50,-105,75,58);floatingIsland(parent,50,-105,75,58);path(parent,'M-48-111H48M-48-100H48','none','#c5badf',5);crystal(parent,-62,-122,.42);crystal(parent,62,-122,.42);}
   else if(safe){tree(parent,-40,-99,1.3,'fantasy');tree(parent,39,-98,1.1,'fantasy');crystal(parent,0,-104,.7,'#98d1cd');}
   else if(type==='cache'){crystal(parent,-30,-98,.65);crystal(parent,13,-112,.9,'#c39ddd');crystal(parent,43,-94,.5,'#93cfca');}
   else if(type==='road'){circle(parent,0,-98,31,'none','#b5a0da',4);circle(parent,0,-98,21,'#282e4f','#8ad0d1',2);path(parent,'M-21-98H21M0-119V-77','none','#d6b9ee',2);}
   else{const t=group(parent,'atlas-arcane-spire',0,-105);path(t,'M-30 39L-25-36 0-79 25-36 30 39Z','#5c607c','#b9a6d7',2);path(t,'M-38-33L0-90 38-33Z',battle?'#b19abf':'#669ca7','#ded0ed',2);path(t,'M0-84V38','none','#d1c0e7',2);for(const x of[-15,15])rect(t,x-4,-17,8,25,'#b8dedd','#6e9ab8',3);if(market){path(t,'M-60 40L-42 8-20 40M20 40L42 8 60 40','#b58fa7','#edd0d5',2);}}
   return;
  }
  circle(parent,0,0,battle?75:57,p.pave,p.edge,2);circle(parent,0,0,battle?65:47,p.lot,p.edge,1);
  if(land==='street'){
   if(safe){rect(parent,-65,-150,130,90,'#304e46','#6c897a',8);tree(parent,-36,-116,.9);tree(parent,35,-115,.9);path(parent,'M-52-80H52','none','#b09c83',8);}
   else if(type==='cache'){cityBuilding(parent,-67,-135,134,68,false,false);for(let i=0;i<3;i++)rect(parent,-48+i*35,-87,27,27,'#aa9674','#d3c29f',1);}
   else if(type==='road'){circle(parent,0,-106,30,'#485864','#859ba6',3);circle(parent,0,-106,18,'#335b6a','#96c1c5',2);}
   else if(/station|landing|yard|dock/i.test(n.name)&&battle&&!n.boss){cityBuilding(parent,-86,-149,172,81,false,true);for(let i=0;i<3;i++)path(parent,`M-86 ${-161-i*8}H86`,'none','#9eadaf',2);rect(parent,-47,-123,94,22,'#313e50','#caac77',0);add(parent,'text',{x:0,y:-107,'text-anchor':'middle',fill:'#f0d4a3','font-size':13,'letter-spacing':3},'TRANSIT');}
   else{const tall=n.boss||data.circuitId==='rooftop';cityBuilding(parent,tall?-55:-66,tall?-175:-143,tall?110:132,tall?119:78,tall,market||data.circuitId==='midnight'||n.boss);if(market){for(let k=0;k<8;k++)rect(parent,-66+k*16.5,-78,16.5,21,k%2?'#e5c08b':'#9f596f','none',0);add(parent,'text',{x:0,y:-98,'text-anchor':'middle',fill:'#f2d5a7','font-size':14,'letter-spacing':3},'MARKET');}if(n.boss){path(parent,'M-18-176L-25-195-7-188 0-202 7-188 25-195 18-176Z','#d89d76','#efd3ac',2);}}
  }else if(land==='medieval'){
   if(bridge){path(parent,'M-83-99Q-31-153 10-108T84-109','none','#4c8490',29);path(parent,'M-49-114H49M-49-100H49','none','#c0bba1',7);for(const x of[-43,43])rect(parent,x-5,-130,10,48,'#879184','#c9c4a4',1);}
   else if(safe){for(const x of[-42,0,42])tree(parent,x,-105,1.15,'medieval');path(parent,'M-26-73L0-118 27-73Z','#a99c75','#d4bc8d',2);}
   else if(market){for(let k=0;k<3;k++){const x=-62+k*46;rect(parent,x,-128,38,57,'#735d45','#c3ad81',1);path(parent,`M${x-4}-118L${x+19}-148 ${x+42}-118Z`,k%2?'#8a5962':'#b28b55','#d5b880',2);}}
   else if(type==='cache'){rect(parent,-60,-135,120,64,'#555b4b','#a1a082',2);for(const x of[-35,0,35])circle(parent,x,-101,14,'#8b704c','#c4a26c',2);}
   else if(type==='road'){circle(parent,0,-109,30,'#85846a','#b5aa87',3);path(parent,'M-16-88L0-139 16-88Z','#a7a38c','#d5c7a1',2);}
   else keep(parent,0,-112,n.boss);
  }else if(land==='greek'){
   if(safe){for(const x of[-43,0,43])tree(parent,x,-112,1.1,'greek');rect(parent,-57,-81,114,13,'#d1c6a7','#f2e3bf',0);}
   else if(market){temple(parent,0,-113,132,70);for(let i=0;i<4;i++)rect(parent,-63+i*33,-85,25,24,i%2?'#b8987b':'#7eacb2','#ede1bd',1);}
   else if(type==='cache'){rect(parent,-61,-139,122,69,'#b4bba6','#ebe3c4',0);for(const x of[-35,0,35]){circle(parent,x,-107,12,'#ad7755','#e1b18a',2);rect(parent,x-5,-127,10,9,'#bd8a62','#edc29b',1);}}
   else if(type==='road'){circle(parent,0,-112,36,'#b3c3bd','#ede3c8',3);circle(parent,0,-112,25,'#4f929e','#d4e0cf',2);path(parent,'M-5-91V-137H5V-91Z','#eae0c5','#b3b59f',2);}
   else{temple(parent,0,-117,n.boss?162:133,n.boss?94:77);if(n.boss){path(parent,'M-28-174Q0-198 28-174M-28-174L-20-165M28-174L20-165','none','#d9bd73',5);}}
  }else{
   if(bridge){path(parent,'M-84-96L-22-111 4-99 86-112','none','#ae604c',21);path(parent,'M-61-121L-8-116M9-110L61-116','none','#9e8b7b',12);path(parent,'M-61-121L-8-116M9-110L61-116','none','#d0b394',2);}
   else if(safe){path(parent,'M-65-69L-57-140H57L65-69Z','#504b53','#a09083',2);path(parent,'M-45-83V-125H45V-83','none','#242333',7);circle(parent,0,-96,11,'#d39b66','#f2cb87',2);}
   else if(market){ruin(parent,0,-113,143,77);path(parent,'M-55-69L-45-94H45L55-69Z','#826154','#c79b78',2);}
   else if(type==='cache'){ruin(parent,0,-113,110,65);for(const x of[-33,0,33])rect(parent,x-12,-102,24,20,'#6d5750','#b68e68',1);}
   else if(type==='road'){circle(parent,0,-109,34,'#51424a','#a17e75',3);path(parent,'M-22-88L-6-110-12-134H8L4-111 23-88Z','#8c6b64','#c4a088',2);}
   else{ruin(parent,0,-113,n.boss?165:132,n.boss?98:79);for(const x of[-57,57])path(parent,`M${x-13}-73L${x-10}-159L${x+2}-183L${x+11}-157L${x+13}-73Z`,'#4a414f','#a18980',2);if(n.boss){path(parent,'M-20-132V-156H20V-132M-30-132H30L21-107H-21Z','#ab806b','#e7bc85',3);}}
  }
 }
 return {terrain,parcel,roads,site,step:land==='street'?94:112};
}
