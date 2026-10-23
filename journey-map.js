'use strict';
// One circuit, shown as a connected network. Every battle has three approaches.
function planJourneyNetwork(data={}){
 const count=data.ruler?1:Math.max(1,Math.min(6,Number(data.stages)||4));
 const current=data.ruler?1:Math.max(1,Math.min(count,Number(data.stage)||2));
 const theme=journeyLand(data.land);
 const width=count*540+240,height=860;
 const fight=i=>({x:120+i*540,y:theme.heights[i%theme.heights.length]});
 const way=(i,route)=>({x:120+(i-1)*540+270,y:theme.lanes[route==='safer'?0:route==='supply'?1:2]+(i%2?0:18)});
 const links=[];
 for(let i=1;i<=count;i++)for(const route of ['safer','supply','risky']){
  const a=fight(i-1),b=way(i,route),c=fight(i);
  const visited=data.history?.[data.ruler?data.stage:i];
  const active=i===current&&!data.location;
  const departed=active&&data.leg==='depart';
  const segment=(u,v)=>theme.shape==='arches'?`Q${(u.x+v.x)/2} ${u.y} ${v.x} ${v.y}`:theme.shape==='ramparts'?`L${(u.x+v.x)/2} ${u.y} L${v.x} ${v.y}`:theme.shape==='shards'?`L${u.x+(v.x-u.x)*.35} ${u.y+(v.y-u.y)*.65} L${u.x+(v.x-u.x)*.7} ${u.y+(v.y-u.y)*.35} L${v.x} ${v.y}`:theme.shape==='ashes'?`L${u.x} ${(u.y+v.y)/2} L${v.x} ${v.y}`:`L${v.x} ${v.y}`;
  const full=`M${a.x} ${a.y} ${segment(a,b)} ${segment(b,c)}`;
  const path=departed&&route==='supply'?`M${b.x} ${b.y} ${segment(b,c)}`:route==='supply'?`M${a.x} ${a.y} ${segment(a,b)}`:full;
  links.push({i,route,a,b,c,active:active&&(!departed||route==='supply'),path,full,visited:visited?.route===route,completed:i<current});
 }
 const start=data.location==='fight'?fight(current):data.location==='shop'||data.leg==='depart'?way(current,'supply'):fight(current-1);
 return {width,height,count,current,links,start,fight,way};
}
let networkData={land:'street',circuitId:'downtown',stage:2,stages:4,networkVersion:2},networkPlan=planJourneyNetwork(networkData),networkOverview=false;
function networkElement(tag,attrs={},text){
 const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
 if(text!==undefined)el.textContent=text;
 return el;
}
function stopLogoElement(type){const g=networkElement('g',{class:'node-logo'});g.innerHTML=journeyStopLogo(type,true);return g;}
function stopVisitedBadge(){const g=networkElement('g',{class:'stop-visited',transform:'translate(25 -27)'});g.append(networkElement('rect',{x:-11,y:-11,width:22,height:22,rx:6,fill:'#182b25',stroke:'#adcbb2','stroke-width':2}),networkElement('path',{d:'M-6 0L-1 5L7-5',fill:'none',stroke:'#d5f3da','stroke-width':3}));return g;}
function renderStopLegend(){
 const legend=document.querySelector('#stopLegend');if(!legend)return;
 legend.innerHTML=[['fight','Fight'],['boss','Boss'],['supply','Shop'],['cache','Supplies'],['safer','Shelter'],['risky','Danger'],['road','Crossroads'],['entry','Entrance']].map(([type,label])=>`<span>${journeyStopLogo(type)}${label}</span>`).join('');
}
function buildJourneyNetwork(data){
 renderStopLegend();
 if(data.networkVersion===2)return buildWorldNetwork(data);
 restoreLegacyCards();
 const theme=applyJourneyLand(data);
 networkData=data;networkPlan=planJourneyNetwork(data);const g=networkPlan,svg=document.querySelector('.route-overlay');
 document.querySelector('#currentPlace').textContent=data.location==='fight'?(data.destination||'Battle location'):data.leg==='depart'||data.location==='shop'?theme.routes.supply:(data.stageNames?.[g.current-2]||'District entrance');
 document.querySelector('#nextBattle').textContent=data.destination||data.stageNames?.[g.current-1]||'Next battle';
 document.querySelector('#mapInstructions').textContent='Choose a highlighted road, then press Start.';
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);svg.setAttribute('aria-label',theme.name+' route network. Choose a reachable stop; only shop branches open shops.');
 const atlasNodes=[];for(let i=0;i<=g.count;i++)atlasNodes.push({...g.fight(i),id:'fight-'+i,type:i?'fight':'entry',name:data.stageNames?.[i-1]||'District entrance',boss:i===g.count});
 for(const l of g.links)atlasNodes.push({...l.b,id:l.i+'-'+l.route,type:l.route,name:theme.routes[l.route]});
 drawJourneyAtlas(svg,{...g,nodes:atlasNodes},data,g.links.map(l=>l.full));
 for(const l of g.links){
  const group=networkElement('g',{class:`network-edge ${l.visited?'visited':''} ${l.completed?'past':''}`});
  group.append(networkElement('path',{d:l.full,class:'network-link'}));svg.append(group);
  if(l.active){
   const track=networkElement('g',{class:'route-track','data-route':l.route});
   track.append(networkElement('path',{d:l.path,class:'route-glow'}),networkElement('path',{d:l.path,class:'route-line'}),networkElement('path',{d:l.path,class:'route-hit'}));
   track.onclick=()=>selectRoute(l.route);svg.append(track);
  }
 }
 for(const l of g.links){
  const node=networkElement('g',{class:`network-node ${l.route} ${l.active?'reachable':'locked'} ${l.visited?'visited':''}`,transform:`translate(${l.b.x} ${l.b.y})`});
  if(l.active){node.setAttribute('data-route',l.route);node.setAttribute('role','button');node.setAttribute('tabindex','0');node.setAttribute('aria-label',theme.routes[l.route]+(l.route==='supply'?': visit shop and collect $5':l.route==='safer'?': 20% lower next fight target':': 20% higher target and $8 extra on victory'));node.onclick=()=>selectRoute(l.route);node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRoute(l.route);}};}
  node.append(networkElement('circle',{r:38}),stopLogoElement(l.route));if(l.visited)node.append(stopVisitedBadge());
  node.append(networkElement('text',{class:'node-label',y:65},theme.routes[l.route].toUpperCase()));
  node.append(networkElement('text',{class:'node-detail',y:89},l.route==='supply'?'SHOP · trade · recruit':l.route==='safer'?'−20% target':'+20% target · +$8'));
  svg.append(node);
 }
 for(let i=0;i<=g.count;i++){
  const p=g.fight(i),done=i<g.current||data.location==='fight'&&i===g.current;
  const node=networkElement('g',{class:`battle-node ${done?'cleared':''}`,transform:`translate(${p.x} ${p.y})`});
  node.append(networkElement('circle',{r:42}),stopLogoElement(i===0?'entry':i===g.count?'boss':'fight'));if(done&&i>0)node.append(stopVisitedBadge());
  node.append(networkElement('text',{class:'node-label',y:72},i===0?'ENTRY':data.ruler?'RULER':i===g.count?'CIRCUIT BOSS':`FIGHT ${i}`));
  node.append(networkElement('text',{class:'node-detail',y:96},i===0?'Your road begins':done?'Cleared':(data.stageNames?.[data.ruler?Number(data.stage)-1:i-1] || (i===g.current?'Next opponent':'Ahead'))));
  svg.append(node);
 }
 const traveler=networkElement('g',{id:'traveler',transform:`translate(${g.start.x} ${g.start.y})`,'aria-label':'Your current position'});
 traveler.append(networkElement('circle',{cy:-12,r:54,class:'traveler-halo'}));
 const icon=networkElement('g',{'data-character-token':'map'});icon.innerHTML=CrownfallCharacter.svg(CrownfallCharacter.get(),true);traveler.append(icon);
 traveler.append(networkElement('text',{class:'you-label',y:-83},'YOU'));svg.append(traveler);
 sizeJourneyNetwork();resetCamera();
}
function sizeJourneyNetwork(){
 const viewport=document.querySelector('#mapWindow'),world=document.querySelector('#mapWorld');
 const mobile=window.innerWidth<=800,height=networkOverview?viewport.clientHeight:(mobile?viewport.clientHeight:Math.max(viewport.clientHeight,600));
 world.style.height=height+'px';
 world.style.width=(networkOverview?viewport.clientWidth:Math.max(viewport.clientWidth,networkPlan.width*height/networkPlan.height))+'px';
}
function networkCamera(x,smooth=false,y=networkPlan.start.y){
 const viewport=document.querySelector('#mapWindow'),world=document.querySelector('#mapWorld');
 viewport.scrollTo({left:Math.max(0,x/networkPlan.width*world.clientWidth-viewport.clientWidth*.25),top:Math.max(0,y/networkPlan.height*world.clientHeight-viewport.clientHeight*.52),behavior:smooth?'smooth':'instant'});
}
