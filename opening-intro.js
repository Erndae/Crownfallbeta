/* A brief city title sequence. Startup and saved-game routing run underneath. */
(function splash(){
  const sp=document.createElement('div');sp.id='splash';sp.className='city-title-intro';
  sp.setAttribute('role','dialog');sp.setAttribute('aria-modal','true');sp.setAttribute('aria-label','Crownfall opening');sp.tabIndex=-1;
  sp.innerHTML=`<div class="intro-city" aria-hidden="true"></div><div class="intro-shade" aria-hidden="true"></div>
    <div class="intro-topline"><span>A CROWN IS NEVER GIVEN.</span><button id="introSkip" type="button">Skip intro</button></div>
    <div class="intro-title"><p class="intro-eyebrow">THE STREETS ARE WAITING</p><div class="intro-poster"><span class="intro-poster-tag" aria-hidden="true">CLAIM YOUR CROWN</span><img class="brandimg" src="${LOGO}" alt="Crownfall" width="869" height="423"><span class="intro-poster-rule" aria-hidden="true"></span></div><p class="intro-tagline">Make your first move.</p></div>
    <div class="intro-road" aria-hidden="true"><svg viewBox="0 0 320 100"><path class="intro-road-base" d="M0 80H65V50H160V20H255V50H320"/><path class="intro-road-light" d="M0 80H65V50H160V20H255V50H320" pathLength="1"/><circle cx="160" cy="20" r="6"/><circle cx="160" cy="20" r="13" class="intro-road-ring"/></svg></div>
    <div class="intro-footer"><span>CROWN CITY</span><span class="intro-loading" role="status">Entering the city<span aria-hidden="true">…</span></span></div>`;
  document.body.appendChild(sp);
  const notify=active=>{if(window.parent!==window)window.parent.postMessage({type:'crownfall-intro',active},location.origin);};
  notify(true);sp.focus({preventScroll:true});
  let gone=false;
  const key=e=>{if(['Enter','Escape',' '].includes(e.key)){e.preventDefault();close();}else if(e.key==='Tab'){e.preventDefault();sp.querySelector('button').focus();}};
  const close=()=>{
    if(gone)return;gone=true;document.removeEventListener('keydown',key,true);sp.classList.add('out');sp.style.pointerEvents='none';
    setTimeout(()=>{const needsFocus=sp.contains(document.activeElement);sp.remove();notify(false);if(needsFocus){const next=document.querySelector('#openingWalk, #play, #cont, #new');next?.focus({preventScroll:true});}},calm?0:450);
  };
  document.addEventListener('keydown',key,true);sp.addEventListener('pointerdown',close);sp.querySelector('button').onclick=close;
  const entrance=new Promise(r=>setTimeout(r,calm?450:2200));
  const loaded=new Promise(r=>document.readyState==='complete'?r():window.addEventListener('load',r,{once:true}));
  Promise.all([entrance,loaded]).then(close);
  setTimeout(close,6000);
})();
