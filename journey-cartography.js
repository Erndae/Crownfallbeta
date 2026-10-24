'use strict';
// The atlas is drawn in the same coordinates as the stops and travel paths.
// Buildings, plazas and roads therefore stay attached to their locations at every zoom.
const JOURNEY_ATLAS_PALETTES={
 street:{ground:'#1d2d38',lot:'#293e47',roof:'#61747a',edge:'#829490',road:'#15252f',pave:'#425660',water:'#1e4f67',park:'#355e51',ink:'#d7d7bd'},
 medieval:{ground:'#354b3c',lot:'#455b46',roof:'#8c775c',edge:'#b8b08d',road:'#a17c50',pave:'#665234',water:'#3e6570',park:'#3d6849',ink:'#e1d4a5'},
 greek:{ground:'#526c68',lot:'#8b9b86',roof:'#dbd9bd',edge:'#e5ddbb',road:'#9bafaa',pave:'#d2d0b6',water:'#2c7c91',park:'#687c48',ink:'#f7e8bb'},
 fantasy:{ground:'#171e35',lot:'#3f4d61',roof:'#797095',edge:'#b4a5d3',road:'#4c486f',pave:'#8e7ba5',water:'#3e4e7e',park:'#437781',ink:'#decaf2'},
 throne:{ground:'#282630',lot:'#453943',roof:'#65515b',edge:'#af8b7d',road:'#322e39',pave:'#6c555c',water:'#492c3b',park:'#44473e',ink:'#e6bc9b'}
};
function drawJourneyAtlas(svg,g,data,paths){
 const p=JOURNEY_ATLAS_PALETTES[data.land]||JOURNEY_ATLAS_PALETTES.street;
 const atlas=networkElement('g',{class:'journey-atlas','aria-hidden':'true','data-atlas-theme':data.land||'street',style:`--atlas-ink:${p.ink}`});
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
 const clear=(x,y,w,h)=>!g.nodes.some(n=>x+w/2>n.x-95&&x-w/2<n.x+95&&y+h/2>n.y-185&&y-h/2<n.y+100)&&!samples.some(([a,b])=>Math.abs(a-x)<w/2+38&&Math.abs(b-y)<h/2+38);
 const seed=(x,y)=>{const variant=['downtown','rooftop','harbor','midnight','ruler'].indexOf(data.circuitId);const value=Math.sin(x*12.9898+y*78.233+g.count*5.13+variant*9.31)*43758.5453;return value-Math.floor(value);};
 const theme=createJourneyAtlasTheme({add,rect,p,g,data,seed,clear,paths,samples});
 theme.terrain(atlas);
 const blocks=add(atlas,'g',{class:'atlas-blocks'});
 for(let x=26;x<g.width-35;x+=theme.step)for(let y=110;y<(data.circuitId==='harbor'&&data.land==='street'||data.land==='greek'?790:970);y+=theme.step){
  const r=seed(x,y),city=data.land==='street',px=x+(city?Math.floor(seed(y,x)*18):0),py=y+(city?Math.floor(r*17):0),w=(city?62:52)+Math.floor(r*(city?45:30)),h=(city?43:38)+Math.floor(seed(y,x)*(city?46:31));
  if(clear(px+w/2,py+h/2,w,h))theme.parcel(blocks,px,py,w,h,r);
 }
 // The district waterfront sits south of the street grid; piers reach into it.
 if(data.circuitId==='harbor'&&(data.land==='street'||data.land==='greek')){
  add(atlas,'path',{d:`M0 874 Q${g.width*.3} 852 ${g.width*.6} 880 T${g.width} 870 V${g.height}H0Z`,fill:p.water});
  add(atlas,'path',{d:`M0 874 Q${g.width*.3} 852 ${g.width*.6} 880 T${g.width} 870`,fill:'none',stroke:p.pave,'stroke-width':9});
  for(let x=160;x<g.width;x+=260){rect(atlas,x,872,34,90,p.roof,p.edge,1);for(let k=0;k<3;k++)add(atlas,'path',{d:`M${x+4} ${893+k*23}H${x+30}`,stroke:p.edge,opacity:.5});}
  add(atlas,'text',{x:g.width*.5,y:970,class:'atlas-water-label'},data.land==='street'?'CROWN HARBOR':data.land==='greek'?'AEGEAN WATERS':'SOUTHERN WATERFRONT');
 }
 const roads=add(atlas,'g',{class:'atlas-roads',fill:'none','stroke-linejoin':'round','stroke-linecap':'round'});
 theme.roads(roads);
 const landmarks=add(atlas,'g',{class:'atlas-landmarks'});
 for(const n of g.nodes){
  const site=add(landmarks,'g',{'data-place':n.id,transform:`translate(${n.x} ${n.y})`});
  const anchor=add(site,'g',{transform:'translate(0 46)',class:'atlas-site-anchor'});theme.site(anchor,n);
 }
 const labels=add(atlas,'g',{class:'atlas-district-labels'});
 for(let i=1;i<=g.count;i++){
  const stride=g.links?540:1400,x=(g.links?120:160)+(i-1)*stride;
  add(labels,'text',{x:x+(g.links?220:330),y:48},data.land==='street'?({downtown:'DOWNTOWN STREETS',rooftop:'ABOVE THE CITY',harbor:'CROWN HARBOR',midnight:'THE NIGHT DISTRICT',ruler:'THE TOWER DISTRICT'}[data.circuitId]||'CROWN CITY'):journeyStagePlace(data.land,data.circuitId||'downtown',i).toUpperCase());
  add(labels,'path',{d:`M${x+160} 62H${Math.min(g.width-35,x+760)}`,stroke:p.edge,'stroke-width':1,opacity:.5});
 }
 const compass=add(atlas,'g',{transform:`translate(${g.width-65} 112)`,class:'atlas-compass'});
 add(compass,'path',{d:'M0-32L9 0 0 30-9 0Z',fill:p.ink,opacity:.7});add(compass,'path',{d:'M-26 0H26',stroke:p.ink});add(compass,'text',{x:0,y:-42},'N');
 svg.append(atlas);document.querySelector('#mapWindow').classList.add('cartographic-map');
}
