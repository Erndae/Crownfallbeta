'use strict';
// Authored roadside scenes. The chosen scene and its progress are saved with the stop.
const JOURNEY_SCENES={
 street:{quiet:['A train rumbles beyond the rooftops. Here, the windows are dark and the street is quiet. Your crew takes a breath.','Rain ticks against an empty bus shelter. Someone has painted a crown beside the words: keep going.'],rumor:['A courier leans out of a doorway. “Vex owns the towers, but he hasn’t bought every street.” They point you toward the next district.','An old shop radio crackles with news of your victories. The name of your crew travels ahead of you.'],ambush:'A lookout whistles from a fire escape. A small patrol blocks the street, certain your crew will turn back.',market:'Warm light spills across the pavement. A shopkeeper waves you inside and slides a supply purse across the counter.',cache:'Behind a loose service panel, your crew finds an envelope of cash. A crown is scribbled on the seal.',shelter:'A caretaker opens a side gate. Your crew studies the streets from a sheltered courtyard and finds a safer approach.'},
 medieval:{quiet:['Wind moves through the banners, but the watchfires are cold. For a moment, the kingdom is quiet.','An empty cart stands beside a milestone. Fresh hoofprints lead onward; whoever passed this way did not stay.'],rumor:['A messenger shares bread with your soldiers. “Aldric’s iron hand cannot hold every village forever.”','A weathered shield hangs beside the road. Below it are carved the names of villages still waiting for a fair ruler.'],ambush:'A horn sounds beyond the wall. Riders close the gate behind you and demand your banner.',market:'Canvas stalls crowd a torchlit square. A caravan keeper offers provisions and a place to recruit.',cache:'Under an old milepost, your scouts uncover a supply chest left by an earlier company.',shelter:'A cloister offers dry ground and a clear view of the pass. Your scouts mark a protected approach.'},
 greek:{quiet:['The sea wind carries distant bells. The colonnade is empty. Your company pauses beneath the olives.','An offering bowl stands untouched beside a marble stair. No trial awaits you here today—only a little peace.'],rumor:['A temple attendant lowers their voice. “Athena values wisdom as much as victory. Learn the road before you challenge the summit.”','An inscription tells of a champion who reached Olympus without walking the easiest road. A fresh olive branch lies beneath it.'],ambush:'Bronze shields flash between the pillars. A temple patrol demands a trial of skill before allowing you to pass.',market:'Merchants call beneath the painted roof of the agora. A trader sets aside a purse of provisions.',cache:'Beside an offering stone, your company discovers coins and a message wishing the next traveller courage.',shelter:'An olive grove offers shelter. From its terrace, your scouts trace a less exposed approach to the next trial.'},
 fantasy:{quiet:['Tiny lights drift through the broken air. The runes beneath your feet hum softly, and nothing follows you across the island.','For once, the rift is still. Your companions watch an island turn slowly beneath the fractured moon.'],rumor:['A scholar reads your runestones. “Morwen’s shadow grows where the bridges fail. Keep your company together.”','A voice echoes from an old crystal: “The realm remembers every road, even those that have fallen.” Then the light fades.'],ambush:'A rift snaps open across the path. A shadow patrol steps through, blocking the bridge.',market:'Lanterns bloom around a wandering bazaar. Its keeper offers supplies, lessons and recruits before the stalls drift away.',cache:'A cracked crystal opens at your touch. Inside lies a traveller’s purse, protected from the passing years.',shelter:'Warding stones awaken around your company. Within their light, you discover a stable crossing.'},
 throne:{quiet:['Ash falls without a sound. No enemy stands among the pillars. Your company waits until the embers settle.','The hall is empty. A torn banner stirs in air you cannot feel. It is quiet here, but the throne still waits ahead.'],rumor:['An oathkeeper points toward the ruined halls. “The Crownless King still guards what the fire could not take.”','Names of forgotten rulers cover a monument. A newer carving reads: a crown is only as strong as those beneath it.'],ambush:'Armor scrapes against stone. A remnant of the old guard steps from the ash and blocks your path.',market:'Behind scorched iron shutters, a last outpost is still open. Its keeper offers what remains of the royal stores.',cache:'Your company lifts a fallen seal. A tribute purse lies beneath it, overlooked since the hall fell.',shelter:'An intact arch shelters you from the ash. The foundations reveal a protected approach through the ruins.'}
};
const JOURNEY_DISTRICT_STORIES={
 street:{downtown:'Rush Hour Rex keeps the traffic circle under watch.',rooftop:'Skyline Sal’s lookouts move between the highest rooftops.',harbor:'Dockmaster Dee controls which crews cross the harbor.',midnight:'Night Owl Nico hears every bargain made after dark.',ruler:'Vex’s tower rises above streets that are beginning to remember your name.'},
 medieval:{downtown:'Swiftblade’s riders hold the old road keeps.',rooftop:'Garran’s red banners hang above the outer walls.',harbor:'Bran’s cavalry is gathering at the great stables.',midnight:'Corvin’s guild counts every coin that enters the kingdom.',ruler:'Aldric’s throne waits beyond the last iron gate.'},
 greek:{downtown:'Atalanta’s trial draws nearer with every mile.',rooftop:'Heracles waits where the Olympian steps meet the sky.',harbor:'Hector’s defenders still hold the Trojan ramparts.',midnight:'The roads of Colchis lead toward Aeëtes and the Golden Fleece.',ruler:'The final stair leads to Athena’s court.'},
 fantasy:{downtown:'Zephyra’s storms gather above the broken bridges.',rooftop:'Veyl’s crystal eye watches the mirrored paths.',harbor:'Seraphon’s riders circle the distant eyries.',midnight:'Grubnik’s agents carry treasure toward the hoard hall.',ruler:'Every surviving bridge seems to point toward Morwen’s citadel.'},
 throne:{downtown:'The Ash Herald’s beacon still burns beyond the gate.',rooftop:'The Hollow Crown waits among echoes of a vanished court.',harbor:'The Ruined Knight’s riders guard the broken bastions.',midnight:'The Tithe Lord still demands tribute from empty halls.',ruler:'Beyond the final approach, the Crownless King keeps his silent vigil.'}
};
function journeyEventHash(value){let h=2166136261;for(const char of value){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function journeyEventFor(data,node){
 const land=data.land||'street',scene=JOURNEY_SCENES[land]||JOURNEY_SCENES.street,hash=journeyEventHash(land+'|'+data.circuitId+'|'+data.stage+'|'+node.id);
 let kind=node.type==='fight'?'battle':node.type==='supply'?'market':node.type==='cache'?'cache':node.type==='safer'?'shelter':(node.type==='risky'&&hash%3===0||node.type==='road'&&hash%5===0)?'ambush':hash%2?'rumor':'quiet';
 if(kind==='rumor'&&hash%3===0)kind='aid';
 const titles={aid:'Supplies for the road',quiet:'It’s quiet here.',rumor:'A story along the road',ambush:'An unexpected patrol',market:'A welcome at the market',cache:'Something left behind',shelter:'A place to catch your breath',battle:node.boss?'At the stronghold gates':'Your next battle awaits'};
 const text=kind==='aid'?'A stranded traveler needs $3 to send supplies ahead. Help now, and collect $5 at the next shop you choose.':kind==='battle'?'Your army reaches '+node.name+'. '+(node.boss?'The guards fall back toward their ruler.':'The road opens onto a defended position.')+' Take a moment to prepare before the next confrontation.':Array.isArray(scene[kind])?scene[kind][hash%scene[kind].length]:scene[kind];
 return {node:node.id,kind,title:titles[kind],text,story:(JOURNEY_DISTRICT_STORIES[land]||JOURNEY_DISTRICT_STORIES.street)[data.circuitId]||'',phase:'intro',resolved:false,variant:hash%3,...(kind==='ambush'?{objective:['hunt','escape','hold','courier'][(hash>>>3)%4]}:{})};
}
function journeySkirmishBoard(variant,version=1){
 const setups=[[[60,'K','me'],[56,'R','me'],[57,'N','me'],[4,'K','en'],[42,'R','en'],[24,'P','en']],[[60,'K','me'],[58,'B','me'],[62,'N','me'],[4,'K','en'],[40,'R','en'],[15,'P','en']],[[60,'K','me'],[56,'R','me'],[62,'N','me'],[4,'K','en'],[16,'R','en'],[23,'P','en']]];
 const patrols=[
 [[62,'K','me'],[56,'R','me'],[42,'N','me'],[34,'B','me'],[51,'P','me'],[54,'P','me'],[4,'K','en'],[7,'R','en'],[21,'N','en'],[18,'B','en'],[11,'P','en'],[30,'P','en']],
 [[57,'K','me'],[63,'R','me'],[45,'N','me'],[37,'B','me'],[52,'P','me'],[49,'P','me'],[3,'K','en'],[0,'R','en'],[18,'N','en'],[21,'B','en'],[12,'P','en'],[25,'P','en']],
 [[62,'K','me'],[56,'R','me'],[42,'N','me'],[34,'B','me'],[49,'P','me'],[51,'P','me'],[54,'P','me'],[4,'K','en'],[7,'R','en'],[21,'N','en'],[18,'B','en'],[11,'P','en'],[30,'P','en']]
 ];
 const board=Array(64).fill(null);for(const [i,t,side]of (version===2?patrols:setups)[variant%3])board[i]={t,side};return board;
}

// Two-ply patrol: evaluate each reply against the player's strongest counter.
// Pure board copies keep search separate from the saved encounter and Campaign army.
function journeyPatrolReply(board,legal,check,event={}){
 const weights={K:0,Q:900,R:550,B:330,N:320,P:100};
 const moves=(b,side)=>b.flatMap((p,from)=>p&&p.side===side?legal(b,from).filter(to=>b[to]?.t!=='K').map(to=>({from,to})):[]);
 const apply=(b,m)=>{const n=b.slice();n[m.to]={...n[m.from]};n[m.from]=null;if(n[m.to].t==='P'&&(m.to<8||m.to>=56))n[m.to].t='Q';return n;};
 const value=b=>{
  const objective=event.objective||'hunt';
  if(objective==='hunt'&&!b.some(p=>p?.side==='en'&&p.t==='R'))return -100000;
  if(objective==='courier'&&!b.some(p=>p?.side==='en'&&p.courier))return -100000;
  if(objective==='hold'&&!b.some(p=>p?.side==='me'&&p.escort))return 100000;
  if(objective==='escape'&&[24,32].some(i=>b[i]?.side==='me'&&b[i].t==='K'))return -100000;
  let score=0;
  b.forEach((p,i)=>{if(!p)return;const center=7-Math.abs(3.5-i%8)-Math.abs(3.5-Math.floor(i/8));score+=(p.side==='en'?1:-1)*(weights[p.t]+(p.courier||p.escort?250:0)+(p.t==='K'?0:center*3));});
  if(check(b,'me'))score+=28;if(check(b,'en'))score-=28;return score;
 };
 let best=null,bestScore=-Infinity;
 for(const move of moves(board,'en')){
  const next=apply(board,move),counters=moves(next,'me');
  let score=counters.length?Infinity:check(next,'me')?100000:0;
  for(const counter of counters){const after=apply(next,counter);let v=value(after);if(check(after,'en')&&!moves(after,'en').length)v=-100000;score=Math.min(score,v);}
  // Prefer a purposeful developing move when minimax scores tie.
  score+=value(next)*0.001;
  if(score>bestScore){bestScore=score;best=move;}
 }
 return best;
}

const JOURNEY_PATROL_GOALS={
 hunt:{name:'Break the patrol',short:'Rook',verb:'Capture',reward:2,limit:10,text:'Capture the patrol’s Rook or deliver checkmate.',win:'The patrol retreats.'},
 escape:{name:'Run the blockade',short:'Exit',verb:'Reach',reward:3,limit:10,text:'Move your King onto either marked exit, or deliver checkmate.',win:'Your company escapes the blockade.'},
 hold:{name:'Guard the convoy',short:'6 turns',verb:'Survive',reward:3,limit:6,text:'Keep the marked supply Rook alive through 6 patrol replies, or deliver checkmate.',win:'The supply convoy reaches safety.'},
 courier:{name:'Intercept the courier',short:'Courier',verb:'Capture',reward:4,limit:10,text:'Capture the marked courier before time runs out, or deliver checkmate.',win:'The courier’s dispatch is yours.'}
};
function journeyPatrolGoal(event={}){return JOURNEY_PATROL_GOALS[event.objective]||JOURNEY_PATROL_GOALS.hunt;}
function journeyPatrolSetup(objective,variant=0){
 if(!objective||objective==='hunt')return journeySkirmishBoard(variant,2);
 const rows={
  escape:[[44,'K','me'],[56,'R','me'],[45,'N','me'],[53,'P','me'],[54,'P','me'],[4,'K','en'],[7,'R','en'],[18,'B','en'],[11,'P','en'],[30,'P','en']],
  hold:[[62,'K','me'],[51,'R','me','escort'],[42,'N','me'],[34,'B','me'],[53,'P','me'],[54,'P','me'],[4,'K','en'],[7,'R','en'],[18,'B','en'],[21,'N','en'],[11,'P','en'],[13,'P','en']],
  courier:[[62,'K','me'],[56,'Q','me'],[42,'N','me'],[34,'B','me'],[53,'P','me'],[4,'K','en'],[7,'R','en'],[28,'P','en','courier'],[21,'N','en'],[11,'P','en'],[22,'P','en']]
 };
 const board=Array(64).fill(null);for(const [i,t,side,tag]of rows[objective]||rows.escape)board[i]={t,side,...(tag?{[tag]:true}:{})};return board;
}
function journeyPatrolStatus(event,afterReply=false){
 const b=event.board,objective=event.objective||'hunt';
 if(objective==='hold'&&!b.some(p=>p?.side==='me'&&p.escort))return 'escaped';
 if(objective==='hunt'&&!b.some(p=>p?.side==='en'&&p.t==='R'))return 'won';
 if(objective==='courier'&&!b.some(p=>p?.side==='en'&&p.courier))return 'won';
 if(objective==='escape'&&[24,32].some(i=>b[i]?.side==='me'&&b[i].t==='K'))return 'won';
 if(objective==='hold'&&afterReply&&(event.moves||0)>=6)return 'won';
 return 'skirmish';
}
