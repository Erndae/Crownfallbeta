/* Compact battle briefing with visible opponent tactics and optional preparation. */
function cityBattleBriefing(boss){
  const circuit=CIR(),trait=cpDef(land(),RUN.circuit),limit=moveLimitFor(parFor(),boss.id);
  const target=targetFor(RUN.blind),reward=BLINDS[RUN.blind].reward,bonus=cityRouteReward();
  const roster=(RUN.roster||[]).filter(Boolean),relics=(RUN.relics||[]).filter(Boolean),cards=RUN.cards||[];
  const stage=rulerRoad()?'Final battle':`Fight ${RUN.ante} of ${CIRCUIT_STAGES}`;
  const rule=RUN.blind===2?boss.desc:'',plan=campaignBossPlan(RUN),landPlay=CAMPAIGN_LAND_PLAY[RUN.land];
  app.innerHTML=`<section class="screen battle-briefing" aria-labelledby="briefingOpponent">
    <div class="briefing-top"><button class="city-text-button" id="bback">Menu</button><span>${hearts(lives())} <b>$${RUN.money}</b></span></div>
    <p class="briefing-kicker">${circuit.name} · ${stage}</p>
    <p class="briefing-location">${stageName(RUN.ante)}</p>
    <div class="briefing-emblem">${journeyStopLogo(boss.ruler||boss.mini?'boss':'fight')}</div>
    <p class="briefing-label">${boss.ruler?'Ruler challenge':boss.mini?'Circuit boss':'Your opponent'}</p>
    <h1 id="briefingOpponent">${bossName(boss.id)}</h1>
    <div class="briefing-goal"><span>Score <strong>${target.toLocaleString()}</strong> or checkmate</span>${limit?`<b class="briefing-limit">Within ${limit} moves</b>`:''}</div>
    ${rule?`<p class="briefing-rule">${rule}</p>`:''}
    ${plan?`<p class="campaign-boss-note"><b>${plan.tactic}</b> · ${plan.weakness}</p>`:''}
    <p class="briefing-reward">Win reward <b>$${reward}${bonus?` + $${bonus} route bonus`:''}</b></p>
    <button class="btn" id="play">Start battle</button>
    <button class="city-text-button briefing-rules" id="battleRules">Full battle rules</button>
    <details class="briefing-details"><summary>Land, army &amp; route details</summary><div>${landPlay?`<p><b>${landPlay.name}</b> · ${landPlay.text}</p>`:""}<p>${campaignBuildSummary(RUN)}</p>${trait?`<p><b>${trait.tr}</b><br>${trait.line}</p>`:''}${cityRouteNote()}${csMyst(land(),RUN.circuit)?`<p>${csMyst(land(),RUN.circuit)}</p>`:''}<p>${stage} · ${rulerRoad()?'Win to claim the crown.':RUN.ante<CIRCUIT_STAGES?'Win to reach the next stop.':'Win to clear this circuit.'}</p></div></details>
    <div class="briefing-prep"><button id="armyReview">Review army <small>${roster.length} pieces</small></button><button id="trainbtn">Training <small>$${RUN.money} available</small></button></div>
    ${relics.length||cards.length?`<details class="briefing-details"><summary>Equipment · ${relics.length} relics · ${cards.length} cards</summary><div>${relics.length?relicRow():''}${cards.length?`<p>${cards.map(id=>`<b style="color:${C(id).col}">${C(id).name}</b>`).join(', ')}</p>`:''}</div></details>`:''}
  </section>`;
  $('#play').onclick=()=>{ $('#play').disabled=true;startBlind(); };
  $('#battleRules').onclick=()=>bossDetails(boss);
  $('#armyReview').onclick=armyInfo;
  $('#trainbtn').onclick=()=>trainingModal(blindSelect);
  $('#bback').onclick=()=>{save();title();};
  bindRelicTips(app);
  // Circuit geography and traits are now inline; no timed skyline covers the briefing.
  if(RUN.ante===1&&RUN.csArrived!==RUN.circuit){RUN.csArrived=RUN.circuit;save();}
}
