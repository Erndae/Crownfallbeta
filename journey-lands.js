'use strict';
const JOURNEY_LANDS = {
 street:{name:'Crown City',art:'downtown-journey.webp',alt:'Illustrated city streets, warm shop windows and rooftop crossings.',tagline:'Every crown starts on these streets.',accent:'#e66898',safe:'#9db8aa',shop:'#e6be7e',risk:'#e66898',ground:'#142025',shape:'streets',heights:[440,440,440,440,440],lanes:[650,310,130],routes:{safer:'Back alley',supply:'Market stop',risky:'Rooftop crossing'},captions:{safer:'KEEP TO THE SHADOWS.',supply:'FOLLOW THE WARM WINDOWS.',risky:'TAKE THE HIGH ROAD.'}},
 medieval:{name:'The Iron Kingdom',art:'iron-kingdom.webp',alt:'Mountain fortress, torchlit ramparts and stone bridges of the Iron Kingdom.',tagline:'Past the walls. Across the bridges. Toward the crown.',accent:'#dba962',safe:'#aab794',shop:'#edc273',risk:'#da8274',ground:'#24251f',shape:'ramparts',heights:[450,400,470,410,450],lanes:[670,290,120],routes:{safer:'Sheltered pass',supply:'Caravan market',risky:'Siege road'},captions:{safer:'TAKE THE SHELTERED PASS.',supply:'TRADE BENEATH THE BANNERS.',risky:'ADVANCE UNDER FIRE.'}},
 greek:{name:'The Olympian Court',art:'olympian-court.webp',alt:'Marble temples, golden colonnades and Aegean skies of the Olympian Court.',tagline:'A road of marble beneath the gaze of the gods.',accent:'#8ccbd7',safe:'#a7d3c1',shop:'#ecd18c',risk:'#dc9b90',ground:'#172a32',shape:'arches',heights:[440,480,440,400,440],lanes:[670,290,120],routes:{safer:'Olive grove',supply:'Agora market',risky:'Trial of heroes'},captions:{safer:'WALK BENEATH THE OLIVES.',supply:'THE AGORA IS OPEN.',risky:'PROVE YOURSELF TO THE GODS.'}},
 fantasy:{name:'The Shattered Realm',art:'shattered-realm.webp',alt:'Floating islands, broken bridges, glowing ruins and a fractured moon in the Shattered Realm.',tagline:'The world is broken. Find your way across.',accent:'#ce9fe8',safe:'#9ad8d0',shop:'#eac58d',risk:'#ed8dbd',ground:'#251d32',shape:'shards',heights:[460,390,480,400,460],lanes:[680,285,115],routes:{safer:'Runestone path',supply:'Wandering bazaar',risky:'Rift crossing'},captions:{safer:'FOLLOW THE QUIET RUNES.',supply:'TRADE BETWEEN WORLDS.',risky:'CROSS THE FRACTURE.'}},
 throne:{name:'The Fallen Throne',art:'fallen-throne.webp',alt:'Obsidian ruins and ember-lit approaches to the Fallen Throne.',tagline:'Through the ashes. One final crown.',accent:'#d1a16f',safe:'#b0b9b2',shop:'#e7bb74',risk:'#e47782',ground:'#271b20',shape:'ashes',heights:[460,440,420,400,380],lanes:[660,280,110],routes:{safer:'Ashen refuge',supply:'Last outpost',risky:'Crownless road'},captions:{safer:'SHELTER AMONG THE ASHES.',supply:'ONE LAST CHANCE TO PREPARE.',risky:'FACE THE FALLEN.'}}
};
function journeyLand(id){return JOURNEY_LANDS[id] || JOURNEY_LANDS.street;}
function applyJourneyLand(data){
 const id=Object.hasOwn(JOURNEY_LANDS,data.land)?data.land:'street',theme=journeyLand(id);
 document.body.dataset.journeyLand=id;
 for(const [key,value] of Object.entries({'--pink':theme.accent,'--green':theme.safe,'--amber':theme.shop,'--route-risk':theme.risk,'--journey-ground':theme.ground,'--journey-art':`url("${theme.art}")`}))document.body.style.setProperty(key,value);
 const art=document.querySelector('.map-art');art.src=theme.art;art.alt=theme.alt;
 document.querySelector('.map-column').setAttribute('aria-label',theme.name+' journey map');
 document.querySelector('#journeyLand').textContent=theme.name;
 document.querySelector('.tagline').textContent=theme.tagline;
 const descriptions={safer:'A protected approach: 20% lower target in the next fight. Standard reward. This branch skips the shop.',supply:'Stop to recruit, trade and train. Collect $5 for supplies, then travel onward. Only this branch opens a shop.',risky:'A dangerous approach: 20% higher target in the next fight and $8 extra on victory. This branch skips the shop.'};
 for(const route of ['safer','supply','risky']){
  Object.assign(ROUTES[route],{title:theme.routes[route],caption:theme.captions[route],description:descriptions[route],color:theme[route==='safer'?'safe':route==='supply'?'shop':'risk']});
  const heading=document.querySelector(`.route-card[data-route="${route}"] h3`);if(heading)heading.textContent=theme.routes[route];
 }
 const index=Object.keys(JOURNEY_LANDS).indexOf(id);
 document.querySelectorAll('.world-progress>div>b,.world-progress>div>span').forEach((el,i)=>{el.classList.toggle('current',i===index);el.classList.toggle('passed',i<index);el.setAttribute('aria-current',i===index?'step':'false');});
 return theme;
}
