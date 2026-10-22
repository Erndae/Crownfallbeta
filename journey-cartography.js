'use strict';
// The atlas is drawn in the same coordinates as the stops and travel paths.
// Buildings, plazas and roads therefore stay attached to their locations at every zoom.
const JOURNEY_ATLAS_PALETTES={
 street:{ground:'#29332f',lot:'#354139',roof:'#596252',edge:'#83907b',road:'#182321',pave:'#647063',water:'#244751',park:'#3c5940',ink:'#d7d7b8'},
 medieval:{ground:'#34372a',lot:'#474a34',roof:'#6c6b4d',edge:'#999879',road:'#282c22',pave:'#77765a',water:'#304d50',park:'#485c38',ink:'#e1d4a5'},
 greek:{ground:'#45483b',lot:'#5d6049',roof:'#94917a',edge:'#c4bea1',road:'#333c32',pave:'#a39d7e',water:'#2f6571',park:'#566b43',ink:'#f1e2b6'},
 fantasy:{ground:'#2d293e',lot:'#3c3b4d',roof:'#646279',edge:'#9891b5',road:'#211e31',pave:'#6e6686',water:'#363d67',park:'#3b554d',ink:'#d6c9ed'},
 throne:{ground:'#302c2e',lot:'#40393b',roof:'#655550',edge:'#927b6e',road:'#211e23',pave:'#72605b',water:'#472d37',park:'#45483e',ink:'#d9b89a'}
};
function drawJourneyAtlas(svg,g,data,paths){
 const p=JOURNEY_ATLAS_PALETTES[data.land]||JOURNEY_ATLAS_PALETTES.street;
 const atlas=networkElement('g',{class:'journey-atlas','aria-hidden':'true',style:`--atlas-ink:${p.ink}`});
 const add=(parent,tag,attrs,text)=>{const el=networkElement(tag,attrs,text);parent.append(el);return el;};
 const rect=(parent,x,y,w,h,fill,stroke=p.edge,rx=3)=>add(parent,'rect',{x,y,width:w,height:h,rx,fill,stroke,'stroke-width':1.5});
 add(atlas,'rect',{width:g.width,height:g.height,fill:p.ground});
 const defs=add(atlas,'defs',{}),pattern=add(defs,'pattern',{id:'atlas-paper',width:28,height:28,patternUnits:'userSpaceOnUse'});
 add(pattern,'path',{d:'M28 0H0V28',fill:'none',stroke:p.edge,'stroke-opacity':.055});add(pattern,'circle',{cx:14,cy:14,r:.7,fill:p.edge,opacity:.18});
 add(atlas,'rect',{width:g.width,height:g.height,fill:'url(#atlas-paper)'});
 const samples=[];
 // Measure the actual SVG travel lines, rather than approximating a second road layout.
 const geometry=add(svg,'g',{visibility:'hidden'});
 for(const d of paths){const line=add(geometry,'path',{d}),len=line.getTotalLength();for(let t=0;t<=len;t+=24){const q=line.getPointAtLength(t);samples.push([q.x,q.y]);}}
 geometry.remove();
 const clear=(x,y,w,h)=>!g.nodes.some(n=>Math.abs(n.x-x)<w/2+105&&Math.abs(n.y-y)<h/2+112)&&!samples.some(([a,b])=>Math.abs(a-x)<w/2+48&&Math.abs(b-y)<h/2+48);
 const seed=(x,y)=>{const value=Math.sin(x*12.9898+y*78.233+g.count*5.13)*43758.5453;return value-Math.floor(value);};
 const blocks=add(atlas,'g',{class:'atlas-blocks'});
 for(let x=35;x<g.width-35;x+=116)for(let y=90;y<(data.circuitId==='harbor'?820:970);y+=112){
  const r=seed(x,y),w=54+Math.floor(r*33),h=42+Math.floor(seed(y,x)*36),cx=x+w/2,cy=y+h/2;
  if(!clear(cx,cy,w,h))continue;
  if(r<.17){rect(blocks,x-7,y-7,w+14,h+14,p.park,p.park,12);for(let k=0;k<4;k++)add(blocks,'circle',{cx:x+12+(k%2)*30,cy:y+12+Math.floor(k/2)*29,r:8,fill:p.edge,opacity:.35});continue;}
  rect(blocks,x-7,y-7,w+14,h+14,p.lot,p.lot,5);rect(blocks,x+4,y+5,w,h,'#131b1b', 'none');rect(blocks,x,y,w,h,p.roof);
  add(blocks,'path',{d:`M${x+6} ${y+h/2}H${x+w-6} M${x+w/2} ${y+5}V${y+h-5}`,stroke:p.edge,'stroke-width':1,opacity:.5});
  if(data.land==='street'||data.land==='throne'){rect(blocks,x+8,y+8,12,10,p.lot,p.edge,1);if(w>65)rect(blocks,x+w-23,y+h-19,14,10,p.lot,p.edge,1);}
 }
 // The district waterfront sits south of the street grid; piers reach into it.
 if(data.circuitId==='harbor'){
  add(atlas,'path',{d:`M0 874 Q${g.width*.3} 852 ${g.width*.6} 880 T${g.width} 870 V${g.height}H0Z`,fill:p.water});
  add(atlas,'path',{d:`M0 874 Q${g.width*.3} 852 ${g.width*.6} 880 T${g.width} 870`,fill:'none',stroke:p.pave,'stroke-width':9});
  for(let x=160;x<g.width;x+=260){rect(atlas,x,872,34,90,p.roof,p.edge,1);for(let k=0;k<3;k++)add(atlas,'path',{d:`M${x+4} ${893+k*23}H${x+30}`,stroke:p.edge,opacity:.5});}
  add(atlas,'text',{x:g.width*.5,y:970,class:'atlas-water-label'},data.land==='street'?'CROWN HARBOR':data.land==='greek'?'AEGEAN WATERS':'SOUTHERN WATERFRONT');
 }
 const roads=add(atlas,'g',{class:'atlas-roads',fill:'none','stroke-linejoin':'round','stroke-linecap':'round'});
 for(const d of paths){add(roads,'path',{d,stroke:p.pave,'stroke-width':65});add(roads,'path',{d,stroke:p.road,'stroke-width':48});add(roads,'path',{d,stroke:p.edge,'stroke-width':1.8,'stroke-dasharray':'10 16','stroke-opacity':.4});}
 const landmarks=add(atlas,'g',{class:'atlas-landmarks'});
 for(const n of g.nodes){
  const site=add(landmarks,'g',{'data-place':n.id,transform:`translate(${n.x} ${n.y})`});
  add(site,'circle',{r:n.type==='fight'?78:59,fill:p.pave,stroke:p.edge,'stroke-width':2});
  add(site,'circle',{r:n.type==='fight'?67:49,fill:p.lot,stroke:p.edge,'stroke-width':1,'stroke-opacity':.5});
  // The marker stands in a forecourt; its building is directly north of that point.
  const type=n.type==='entry'?'gate':n.type==='fight'?(n.boss?'keep':/station|landing|yard|dock|stables|roost/i.test(n.name)?'station':/grove|woods|green|fields/i.test(n.name)?'park':'hall'):n.type;
  if(type==='safer'||type==='park'){
   rect(site,-62,-145,124,82,p.park,p.edge,15);add(site,'path',{d:'M-50 -101H50 M0 -136V-70',stroke:p.pave,'stroke-width':8});
   for(const [x,y]of[[-35,-121],[35,-121],[-35,-82],[35,-82]]){add(site,'circle',{cx:x+3,cy:y+4,r:14,fill:'#111c19',opacity:.4});add(site,'circle',{cx:x,cy:y,r:13,fill:p.edge,opacity:.65});}
  }else if(type==='cache'){
   rect(site,-58,-124,116,64,p.lot);for(let k=0;k<3;k++){rect(site,-45+k*32,-110,25,32,p.roof);add(site,'path',{d:`M${-43+k*32} -107l21 26m0-26l-21 26`,stroke:p.edge,'stroke-width':2});}
  }else if(type==='road'){
   // Junctions are recognisable public squares, with a central fountain.
   add(site,'circle',{cy:-109,r:32,fill:p.pave,stroke:p.edge,'stroke-width':3});add(site,'circle',{cy:-109,r:21,fill:p.water,stroke:p.edge,'stroke-width':2});add(site,'circle',{cy:-109,r:7,fill:p.ink});
  }else{
   const w=type==='keep'?146:type==='station'?156:116,h=type==='station'?62:76,x=-w/2,y=-h-65;
   rect(site,x+5,y+6,w,h,'#131b1b','none');rect(site,x,y,w,h,p.roof,p.edge,4);rect(site,x+9,y+9,w-18,h-18,p.lot,p.edge,2);
   add(site,'path',{d:`M${x+6} ${y+6}L0 ${y+h/2}L${w/2-6} ${y+6} M0 ${y+h/2}V${y+h-6}`,fill:'none',stroke:p.edge,'stroke-width':2});
   if(type==='supply'){
    for(let k=0;k<6;k++)rect(site,x+k*w/6,y+h-13,w/6,20,k%2?p.ink:journeyLand(data.land).shop,'none',0);
   }else if(type==='keep'||type==='risky'||type==='gate'){
    for(const dx of[-w/2,w/2])for(const dy of[y,y+h])rect(site,dx-10,dy-10,20,20,p.roof,p.edge,2);
   }else if(type==='station'){
    for(let k=0;k<3;k++)add(site,'path',{d:`M${x+10} ${y-12-k*7}H${w/2-10}`,stroke:p.edge,'stroke-width':2});
   }
   add(site,'path',{d:`M-13 ${y+h}V-49H13V${y+h}`,fill:p.pave,stroke:p.edge,'stroke-width':1});
  }
 }
 const labels=add(atlas,'g',{class:'atlas-district-labels'});
 for(let i=1;i<=g.count;i++){
  const stride=g.links?540:1040,x=(g.links?120:160)+(i-1)*stride;
  add(labels,'text',{x:x+(g.links?220:330),y:48},journeyStagePlace(data.land,data.circuitId||'downtown',i).toUpperCase());
  add(labels,'path',{d:`M${x+160} 62H${Math.min(g.width-35,x+760)}`,stroke:p.edge,'stroke-width':1,opacity:.5});
 }
 const compass=add(atlas,'g',{transform:`translate(${g.width-65} 112)`,class:'atlas-compass'});
 add(compass,'path',{d:'M0-32L9 0 0 30-9 0Z',fill:p.ink,opacity:.7});add(compass,'path',{d:'M-26 0H26',stroke:p.ink});add(compass,'text',{x:0,y:-42},'N');
 svg.append(atlas);document.querySelector('#mapWindow').classList.add('cartographic-map');
}
