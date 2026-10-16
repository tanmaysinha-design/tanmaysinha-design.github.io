/* Workflow highlights gallery: scroll-snap carousel with autoplay, progress dots and pause (after Apple's media-card gallery). */
(function(){
  var wrap=document.getElementById('wfg'); if(!wrap) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=wrap.querySelector('.wfg'), cards=[].slice.call(wrap.querySelectorAll('.wf-card')), dots=[].slice.call(wrap.querySelectorAll('.wfg-dot')), pp=wrap.querySelector('.wfg-pp');
  var cur=0, timer=null, userPaused=reduce, inView=false, ticking=false, programmatic=0;

  function active(i){
    if(i===cur&&cards[i].classList.contains('on')) return;
    cur=i; cards.forEach(function(c,k){c.classList.toggle('on',k===i)}); dots.forEach(function(d,k){d.classList.toggle('on',k===i); d.setAttribute('aria-current',k===i?'true':'false')});
    window.dispatchEvent(new Event('portal:check')); restart();
  }
  function nearest(){
    var c=track.scrollLeft+track.clientWidth/2, best=0, bd=1e9;
    cards.forEach(function(el,k){var m=el.offsetLeft+el.offsetWidth/2, d=Math.abs(m-c); if(d<bd){bd=d;best=k}}); return best;
  }
  function go(i,smooth){
    i=(i+cards.length)%cards.length; var el=cards[i];
    programmatic=Date.now(); programmatic=Date.now(); track.scrollTo({left:el.offsetLeft-(track.clientWidth-el.offsetWidth)/2,behavior:(smooth===false||reduce)?'auto':'smooth'}); active(i);
  }
  track.addEventListener('scroll',function(){
    if(scrolled||ticking||Date.now()-programmatic<1000) return; ticking=true; requestAnimationFrame(function(){ticking=false; active(nearest())});
  },{passive:true});

  track.addEventListener('scrollend',function(){if(scrolled)return; programmatic=0; active(nearest())});
  // autoplay: progress bar (CSS animation on the active dot) and the timer share one duration
  function dur(){return parseInt(cards[cur].dataset.dur||12000,10)}
  function playing(){return inView&&!userPaused&&!document.hidden}
  function restart(){
    clearTimeout(timer); wrap.style.setProperty('--dur',dur()+'ms');
    wrap.classList.remove('run','hold'); void wrap.offsetWidth;
    wrap.classList.toggle('paused',userPaused); wrap.classList.toggle('stopped',reduce);
    if(reduce) return;
    if(playing()){wrap.classList.add('run'); timer=setTimeout(function(){go(cur+1)},dur())}
    else if(!userPaused){wrap.classList.add('run','hold')}
  }
  pp.addEventListener('click',function(){userPaused=!userPaused; pp.setAttribute('aria-label',userPaused?'Play autoplay':'Pause autoplay'); restart()});
  dots.forEach(function(d,k){d.addEventListener('click',function(){go(k)})});
  track.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){e.preventDefault();go(cur+1)} else if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1)}
  });
  ['pointerdown','wheel','touchstart'].forEach(function(t){track.addEventListener(t,function(){clearTimeout(timer); wrap.classList.add('hold')},{passive:true})});
  ['pointerup','touchend'].forEach(function(t){track.addEventListener(t,function(){setTimeout(restart,350)},{passive:true})});
  var wasHidden=document.hidden;
  document.addEventListener('visibilitychange',function(){if(document.hidden!==wasHidden){wasHidden=document.hidden; restart()}});
  new IntersectionObserver(function(es){
    var e=es[0], visible=e.intersectionRect.height, need=Math.min(e.boundingClientRect.height*.45,window.innerHeight*.45);
    var v=e.isIntersecting&&visible>=need; if(v!==inView){inView=v; restart()}
  },{threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]}).observe(wrap);
  window.addEventListener('resize',function(){if(!scrolled) go(cur,false)});
  active(0); go(0,false);

  // Scroll-driven mode: while the section is pinned, vertical scrolling moves the cards sideways.
  var sec=document.getElementById('how'), stage=document.getElementById('wfs'), pin=stage&&stage.querySelector('.wf-pin'), inner=stage&&stage.querySelector('.wf-in');
  if(!sec||!stage||reduce) return;
  var scrolled=false, C=function(x){return x<0?0:x>1?1:x}, S=function(a,b,x){var t=C((x-a)/(b-a));return t*t*(3-2*t)};
  var stepPx=function(){return window.innerHeight*.7}, ticking2=false;
  function fits(){return window.innerWidth>960&&inner.offsetHeight+100<=window.innerHeight}
  function offs(i){var el=cards[i];return el.offsetLeft-(track.clientWidth-el.offsetWidth)/2}
  function topOff(){return Math.max(0,(window.innerHeight-pin.offsetHeight)/2)}
  function travelPx(){return stage.offsetHeight-pin.offsetHeight}
  function frame(){
    ticking2=false;
    var r=stage.getBoundingClientRect(), tr=travelPx(), u=C((topOff()-r.top)/(tr>0?tr:1))*(cards.length-1);
    var i=Math.min(Math.floor(u),cards.length-2), f=S(.2,.8,u-i);
    track.scrollLeft=offs(i)+(offs(i+1)-offs(i))*f;
    var near=Math.round(u); if(near!==cur||!cards[near].classList.contains('on')){programmatic=Date.now(); active(near)}
  }
  function layout(){pin.style.top=topOff()+'px'; stage.style.height=(pin.offsetHeight+stepPx()*(cards.length-1))+'px'}
  function onScrollP(){if(!ticking2){ticking2=true;requestAnimationFrame(frame)}}
  function enable(){
    if(scrolled) return; scrolled=true; userPaused=true; clearTimeout(timer);
    sec.classList.add('wf-scroll'); wrap.classList.add('scrolled'); wrap.classList.remove('run','hold');
    layout(); window.addEventListener('scroll',onScrollP,{passive:true}); frame();
  }
  function disable(){
    if(!scrolled) return; scrolled=false; userPaused=false;
    sec.classList.remove('wf-scroll'); wrap.classList.remove('scrolled'); stage.style.height=''; pin.style.top='';
    window.removeEventListener('scroll',onScrollP); go(cur,false); restart();
  }
  function evalMode(){fits()?(scrolled?(layout(),frame()):enable()):disable()}
  // dots jump to a card's scroll position while in this mode
  dots.forEach(function(d,k){d.addEventListener('click',function(e){
    if(!scrolled) return; e.stopImmediatePropagation();
    var top=stage.getBoundingClientRect().top+window.scrollY-topOff();
    window.scrollTo({top:top+travelPx()*k/(cards.length-1)+1,behavior:'smooth'})
  },true)});
  window.addEventListener('resize',evalMode); evalMode();
})();