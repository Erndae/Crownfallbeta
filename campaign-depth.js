'use strict';
// Small, explicit Campaign bonuses; all helpers are pure and safe to preview.
const CAMPAIGN_LAND_PLAY={
 street:{name:'Opening tempo',text:'Captures in your first 3 moves gain +10 Material.'},
 medieval:{name:'Shieldwall',text:'Captures by a piece defended by your Pawn gain +2 Brilliance.'},
 greek:{name:'Trial of precision',text:'Captures that also give check gain +2 Brilliance.'},
 fantasy:{name:'Changing paths',text:'Alternate the capturing piece type to gain +15 Material.'},
 throne:{name:'Last stand',text:'Captures while outnumbered gain +2 Brilliance.'}
};
const CAMPAIGN_BUILDS=[
 {id:'cavalry',type:'N',need:2,name:'Cavalry pair',text:'Recruit 2 Knights: Knight captures that fork two enemies gain +2 Brilliance.'},
 {id:'towers',type:'R',need:2,name:'Tower guard',text:'Recruit 2 Rooks: Rook captures defended by another Rook gain +20 Material.'},
 {id:'pawns',type:'P',need:3,name:'Pawn company',text:'Recruit 3 Pawns: Pawn captures in the enemy half gain +2 Brilliance.'}
];
function campaignBuilds(roster=[]){
 const counts={};roster.filter(Boolean).forEach(p=>{const t=typeof p==='object'?p.t:String(p)[0];counts[t]=(counts[t]||0)+1;});
 return CAMPAIGN_BUILDS.map(b=>({...b,count:counts[b.type]||0,active:(counts[b.type]||0)>=b.need}));
}
function campaignCaptureBonuses({run,battle,before,after,from,to,capture,check,attacks}){
 if(!run||run.gauntlet||run.match||!capture)return [];
 const mover=before[from],type=mover.t,out=[],supports=t=>after.some((p,i)=>i!==to&&p?.side==='me'&&p.t===t&&attacks(after,i).includes(to));
 const add=(label,c=0,m=0)=>out.push({src:'campaign',label,c,m});
 for(const build of campaignBuilds(run.roster).filter(b=>b.active)){
  if(build.id==='cavalry'&&type==='N'&&attacks(after,to).filter(i=>after[i]?.side==='en').length>=2)add(build.name,0,2);
  if(build.id==='towers'&&type==='R'&&supports('R'))add(build.name,20);
  if(build.id==='pawns'&&type==='P'&&to<32)add(build.name,0,2);
 }
 const land=run.land,rule=CAMPAIGN_LAND_PLAY[land];
 if(land==='street'&&(battle.moveCount||0)<3)add(rule.name,10);
 if(land==='medieval'&&supports('P'))add(rule.name,0,2);
 if(land==='greek'&&check)add(rule.name,0,2);
 if(land==='fantasy'&&battle.lastCaptureType&&battle.lastCaptureType!==type)add(rule.name,15);
 if(land==='throne'&&before.filter(p=>p?.side==='me').length<before.filter(p=>p?.side==='en').length)add(rule.name,0,2);
 return out;
}
const CAMPAIGN_BOSS_PLANS={
 downtown:[['aggressive','knightRush','Fast assault','Keep your King covered; trade the advanced Knights.'],['defensive','phalanx','Pawn formation','Open a file before committing your heavy pieces.'],['tricky','nightRaid','Tactical ambush','Watch Knight forks; exchange attackers before advancing.']],
 rooftop:[['hunter','bishopCourt','Diagonal pressure','Break the long diagonals with supported Pawns.'],['aggressive','twinQueens','Heavy attack','Force Queen trades and attack loose defenders.'],['tricky','mirror','Mirror formation','Change the Pawn structure to break the symmetry.']],
 harbor:[['defensive','rookFortress','Rook fortress','Challenge the open files with supported Rooks.'],['tricky','knightPack','Mounted flank','Trade Knights before opening your King’s side.'],['defensive','royalGuard','Layered guard','Remove the Pawn defenders before attacking the majors.']],
 midnight:[['greedy','merchant','Material hunter','Offer a defended target to draw attackers out.'],['hunter','bishopGuard','Royal pressure','Trade the active Bishop and protect your back rank.'],['aggressive','pawnWave','Pawn advance','Block the leading Pawns and attack from the side.']]
};
function campaignBossPlan(run,stage=run?.ante){
 if(!run||run.gauntlet||run.match)return null;
 if(run.circuit==='ruler'){const hints={street:'Favor captures to avoid the quiet-move tax; keep cash in reserve.',medieval:'Open files and capture officers; enemy Pawns give no Material.',greek:'Attack with Bishops and Rooks; your Knights cannot capture.',fantasy:'Keep two defenders near your King until the double turn is spent.',throne:'Plan captures, build checks, and keep your King covered.'};return {style:'defensive',signature:null,tactic:'Ruler challenge',weakness:hints[run.land]||'Read the ruler’s rules before committing.'};}
 if(Number(stage)===4){const signatures={street:['knightRush','twinQueens','rookFortress','nightRaid'],medieval:['knightRush','royalGuard','knightPack+','merchant'],greek:['knightRush','rookFortress','phalanx','bishopGuard'],fantasy:['nightRaid','bishopCourt','knightPack','pawnWave'],throne:['promotionHorde','twinQueens','knightPack+','pawnWave']};const i=['downtown','rooftop','harbor','midnight'].indexOf(run.circuit);const styles=['aggressive','hunter','defensive','greedy'],tips=['Trade the advanced attackers before opening your King’s position.','Close the open lines and exchange the strongest attacker.','Break the Pawn screen, then contest the open files.','Make profitable captures and keep reserves for the endgame.'];return i<0?null:{style:styles[i],signature:signatures[run.land]?.[i]||'classic',tactic:['Fast assault','Royal pressure','Defended formation','War of resources'][i],weakness:tips[i]};}
 const plan=CAMPAIGN_BOSS_PLANS[run.circuit]?.[Number(stage)-1];if(!plan)return null;
 const [style,signature,tactic,weakness]=plan;
 return {style,signature,tactic,weakness};
}
function campaignBuildSummary(run){
 if(!run||run.gauntlet||run.match)return '';
 const builds=campaignBuilds(run.roster),active=builds.filter(b=>b.active),next=builds.filter(b=>!b.active).sort((a,b)=>(a.need-a.count)-(b.need-b.count))[0];
 return (active.length?'Active: '+active.map(b=>b.name).join(' · ')+'. ':'')+(next?'Build toward '+next.name+': '+next.count+'/'+next.need+' '+({N:'Knights',R:'Rooks',P:'Pawns'}[next.type])+'.':'');
}
function campaignBossVoice(plan){
 const lines={knightRush:['The center belongs to my riders.','You broke our charge.'],phalanx:['One shield falls, another takes its place.','The line has broken.'],nightRaid:['Watch the shadows between your pieces.','You saw us coming.'],bishopCourt:['Every open diagonal leads back to me.','My sightlines are gone.'],twinQueens:['Two crowns. One board. No room for you.','Both crowns, brought low.'],mirror:['I know your army as well as you do.','You found the difference.'],rookFortress:['These files are mine. Come and take them.','The gates are open.'],knightPack:['You cannot guard every landing.','Our riders are scattered.'],royalGuard:['You will reach me only after the guard falls.','The guard could not hold.'],merchant:['Every exchange has a price. I expect a profit.','A ruinous bargain.'],bishopGuard:['The court watches every diagonal.','You outplayed the court.'],pawnWave:['Step by step, your squares become mine.','Our advance ends here.'],promotionHorde:['Every Pawn you ignore becomes a crown.','None reached the throne.']};
 const [intro,lose]=lines[plan?.signature?.replace('+','')]||['Make your move.','The road is yours.'];
 return {intro,lose,capture:['Another square under my control.'],hurt:['A weakness exposed.'],check:'Your King needs a defender.',win:'This crossing is still mine.'};
}
