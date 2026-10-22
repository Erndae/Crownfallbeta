'use strict';
const legacyCards=document.querySelector('.route-cards').innerHTML;
function worldBenefit(type){return {safer:'Next fight is 20% easier.',risky:'Next fight is 20% harder. Win $8 extra.',supply:'Get $5, then recruit, train and shop.',cache:'Collect $3, then keep travelling.',road:'Reach a junction with more routes.',fight:'Enter the battle at this location.'}[type]||'Continue your journey.';}
function restoreLegacyCards(){
 const cards=document.querySelector('.route-cards');cards.innerHTML=legacyCards;
 cards.querySelectorAll('button').forEach(b=>b.onclick=()=>selectRoute(b.dataset.route));
}
function worldColor(type){const t=journeyLand(networkData.land);return type==='supply'||type==='cache'?t.shop:type==='risky'?t.risk:type==='safer'?t.safe:'#d1d8d4';}
function worldPath(a,b){
 const shape=journeyLand(networkData.land).shape;
 if(shape==='arches')return `M${a.x} ${a.y} C${a.x+130} ${a.y} ${b.x-130} ${b.y} ${b.x} ${b.y}`;
 if(shape==='shards')return `M${a.x} ${a.y} L${a.x+(b.x-a.x)*.4} ${a.y+(b.y-a.y)*.25} L${a.x+(b.x-a.x)*.65} ${a.y+(b.y-a.y)*.8} L${b.x} ${b.y}`;
 return `M${a.x} ${a.y} L${a.x+(b.x-a.x)*.55} ${a.y} L${b.x} ${b.y}`;
}
function worldText(parent,text,y,cls,max=24){
 const words=text.split(' '),lines=[];let line='';
 for(const word of words){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);
 lines.forEach((value,i)=>parent.append(networkElement('text',{class:cls,y:y+i*32},value)));
 return lines.length;
}
function buildWorldNetwork(data){
 networkData=data;applyJourneyLand(data);$('#mapInstructions').textContent='Tap a numbered stop to choose your destination.';networkPlan=journeyGraph(data);const g=networkPlan,svg=document.querySelector('.route-overlay');
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);svg.setAttribute('aria-label',journeyLand(data.land).name+' · connected world locations');
 const reachable=new Map(g.active.map((e,i)=>[e.to,i+1]));
 const history=Object.values(data.history||{}),visitedEdges=new Set(history.flatMap(r=>(r.edges||[]).map(e=>e.join('>'))));
 for(const e of data.record?.edges||[])visitedEdges.add(e.join('>'));
 drawJourneyAtlas(svg,g,data,g.edges.map(e=>worldPath(g.byId[e.from],g.byId[e.to])));
 for(const edge of g.edges){
  const a=g.byId[edge.from],b=g.byId[edge.to],active=g.active.some(e=>e.from===edge.from&&e.to===edge.to),visited=visitedEdges.has(edge.from+'>'+edge.to);
  const path=worldPath(a,b),group=networkElement('g',{class:'network-edge'+(visited?' visited':'')+(b.stage<g.current?' past':'')});
  group.append(networkElement('path',{d:path,class:'network-link'}));svg.append(group);
  if(active){const track=networkElement('g',{class:'route-track','data-route':b.id,style:'--route:'+worldColor(b.type)});track.append(networkElement('path',{d:path,class:'route-glow'}),networkElement('path',{d:path,class:'route-line'}),networkElement('path',{d:path,class:'route-hit'}));track.onclick=()=>selectRoute(b.id);svg.append(track);}
 }
 for(const n of g.nodes){
  const active=g.active.some(e=>e.to===n.id),visited=history.some(r=>r.visited?.includes(n.id))||data.record?.visited?.includes(n.id)||n.type==='fight'&&n.stage<g.current;
  const group=networkElement('g',{class:`network-node ${n.type} ${active?'reachable':'locked'} ${visited?'visited':''} ${n.id===g.position?'current-stop':''} ${!active&&n.id!==g.position?'context-stop':''}`,transform:`translate(${n.x} ${n.y})`,style:'color:'+worldColor(n.type)});
  if(active){group.setAttribute('data-route',n.id);group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',n.name+'. '+JOURNEY_STOP_TYPES[n.type].detail);group.onclick=()=>selectRoute(n.id);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRoute(n.id);}};}
  group.append(networkElement('circle',{r:active?52:n.type==='fight'?42:32}),networkElement('text',{class:'node-symbol',y:12},active?String(reachable.get(n.id)):visited?'✓':n.type==='fight'?(n.boss?'♛':String(n.stage)):JOURNEY_STOP_TYPES[n.type]?.symbol||'•'));
  const label=n.type==='fight'||n.type==='entry'?n.name:n.short;
  const lines=worldText(group,label,78,'node-label',19);
  worldText(group,n.type==='fight'?(n.boss?'Boss battle':'Battle '+n.stage):JOURNEY_STOP_TYPES[n.type]?.label||'Your road begins',84+lines*32,'node-detail',24);
  svg.append(group);
 }
 const traveler=networkElement('g',{id:'traveler',transform:`translate(${g.start.x} ${g.start.y})`,'aria-label':'You are at '+g.start.name});
 traveler.append(networkElement('circle',{cy:-12,r:54,class:'traveler-halo'}));const icon=networkElement('svg',{x:-22,y:-68,width:44,height:60,class:'king-piece'});icon.append(networkElement('use',{href:'#king'}));traveler.append(networkElement('rect',{x:-112,y:-123,width:224,height:39,rx:7,fill:'#18242e',stroke:'#ffe0a4','stroke-width':2}),icon,networkElement('text',{class:'you-label',y:-96},'YOU ARE HERE'));svg.append(traveler);
 const cards=document.querySelector('.route-cards');cards.replaceChildren();
 for(const [index,e] of g.active.entries()){const n=g.byId[e.to],t=JOURNEY_STOP_TYPES[n.type],button=document.createElement('button');button.className='route-card';button.dataset.route=n.id;button.style.setProperty('--route',worldColor(n.type));button.setAttribute('aria-pressed','false');
  const top=document.createElement('div');top.className='route-card-top';top.textContent=(index+1)+' · '+t.label.toUpperCase();
  const title=document.createElement('h3');title.textContent=n.type==='fight'?n.name:n.short;
  const desc=document.createElement('p');desc.textContent=worldBenefit(n.type);
  const bottom=document.createElement('span');bottom.className='route-bottom';bottom.textContent=n.type==='fight'?'Advance the Campaign':n.district;
  button.append(top,title,desc,bottom);button.onclick=()=>selectRoute(n.id);cards.append(button);
 }
 $('#currentPlace').textContent=g.start.name;$('#nextBattle').textContent=data.destination||journeyStagePlace(data.land,data.circuitId||'downtown',data.ruler?1:data.stage||2);
 sizeJourneyNetwork();resetCamera();
}
function selectWorldStop(id){
 if(traveling||committed||!networkPlan.active.some(e=>e.to===id))return;
 selected=id;const n=networkPlan.byId[id],t=JOURNEY_STOP_TYPES[n.type],color=worldColor(n.type);
 document.querySelectorAll('[data-route]').forEach(el=>{el.classList.toggle('selected',el.dataset.route===id);if(el.matches('.route-card'))el.setAttribute('aria-pressed',String(el.dataset.route===id));});
 $('.route-overlay').classList.add('has-selection');$('#routeActionLabel').textContent=n.name;$('#setOff').disabled=false;$('#setOff').style.background=color;$('#setOffText').textContent='Start · '+(n.type==='fight'?'Enter battle':t.label);
 $('.note-label').textContent=t.label.toUpperCase();$('.note-label').style.color=color;$('#routeNote').style.borderColor=color;$('#routeNote p').textContent=t.description;
 $('#travelStatus').textContent=worldBenefit(n.type);
}
function requestWorldJourney(d){
 travelToken++;traveling=false;committed=false;pendingJourney={key:d.key,networkVersion:2};selected=null;
 $('#mapWindow').classList.remove('is-traveling');buildJourneyNetwork(d);hideGame();
 $('#journeyLand').textContent=d.landName||journeyLand(d.land).name;$('#journeyCircuit').textContent=d.circuit||'Your journey';$('#journeyChapter').textContent=d.ruler?'THE RULER’S ROAD':`STAGE ${d.stage} OF ${d.stages}`;
 $('#panelTitle').textContent='Your next move.';$('#panelCopy').textContent='Pick a numbered stop, check its benefit, then press Start. Your next battle is '+d.destination+'.';
 $('#routeActionLabel').textContent='At '+networkPlan.start.name;$('#setOff').disabled=true;$('#setOff').style.removeProperty('background');$('#setOffText').textContent='Choose your next stop';$('#travelStatus').textContent='Choose a number on the map or a stop below.';
 $('.note-label').textContent='CURRENT APPROACH';$('#routeNote p').textContent=d.record?.route==='safer'?'Shelter: next fight target −20%.':d.record?.route==='risky'?'Danger: next fight target +20%; victory +$8.':'Standard target. Shelters and danger stops change your next fight.';
 const strip=$('.stage-strip');strip.replaceChildren();
 const places=journeyPlaces(d.land,d.circuitId);places.forEach((place,i)=>{const stage=document.createElement('div');stage.className='stage'+(i+1===networkPlan.current?' current':i+1<networkPlan.current?' done':'');const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');const label=document.createElement('b');label.textContent=place;label.title=place;stage.append(num,label);strip.append(stage);});
 if(d.record?.hop){selectWorldStop(d.record.hop);committed=true;$('#setOffText').textContent='Continue saved journey';$('#travelStatus').textContent='Destination locked · resume where you left off';}
 // Keep repeated hops at the map; the primary action remains fixed on phones.
 $('.journey-summary').scrollIntoView({behavior:'instant',block:'start'});
}
function walkWorldStop(){
 if(traveling)return;
 if(!pendingJourney)return launch('campaign');
 if(!selected||!networkPlan.active.some(e=>e.to===selected))return;
 if(!committed){traveling=true;$('#setOff').disabled=true;$('#setOffText').textContent='Saving journey…';send('journey-commit',{key:pendingJourney.key,node:selected});const key=pendingJourney.key;setTimeout(()=>{if(pendingJourney?.key===key&&traveling&&!committed){traveling=false;$('#setOff').disabled=false;$('#setOffText').textContent='Retry departure';}},3000);return;}
 traveling=true;const token=++travelToken,key=pendingJourney.key,node=selected,path=$(`.route-track[data-route="${node}"] .route-line`),length=path.getTotalLength(),start=performance.now(),duration=reduced?0:1800;
 $('#setOff').disabled=true;$('#setOffText').textContent='On the road…';$('#mapWindow').classList.add('is-traveling');
 function tick(now){if(token!==travelToken)return;const t=duration?Math.min(1,(now-start)/duration):1,p=path.getPointAtLength(length*(t*t*(3-2*t)));$('#traveler').setAttribute('transform',`translate(${p.x} ${p.y})`);networkCamera(p.x,false,p.y);
  if(t<1)return requestAnimationFrame(tick);
  $('#mapWindow').classList.remove('is-traveling');$('#travelStatus').textContent='Arrived · saving progress';send('journey-arrive',{key,node});
 }
 requestAnimationFrame(tick);
}
