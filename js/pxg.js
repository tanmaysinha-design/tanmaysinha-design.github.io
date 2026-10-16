/* Manual vs TruEnroll: while the section is pinned, vertical scrolling slides the cards sideways (same idea as the homepage workflow gallery). */
(function(){
  var sec=document.getElementById('pxs'); if(!sec) return;
  var pin=sec.querySelector('.pxg-pin'), track=sec.querySelector('.pxg-track'), cards=[].slice.call(sec.querySelectorAll('.pxc')), dots=[].slice.call(sec.querySelectorAll('.pxg-dot'));
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrolled=false, ticking=false, cur=0;
  var C=function(x){return x<0?0:x>1?1:x}, S=function(a,b,x){var t=C((x-a)/(b-a));return t*t*(3-2*t)};
  var stepPx=function(){return window.innerHeight*.7}, n=cards.length;
  function active(i){ if(i===cur&&cards[i].classList.contains('on')) return; cur=i; cards.forEach(function(c,k){c.classList.toggle('on',k===i)}); dots.forEach(function(d,k){d.classList.toggle('on',k===i)}); }
  function fits(){ return window.innerWidth>960&&!reduce&&pin.offsetHeight+60<=window.innerHeight; }
  function offs(i){ var el=cards[i]; return el.offsetLeft-(window.innerWidth-el.offsetWidth)/2; }
  function topOff(){ return Math.max(0,(window.innerHeight-pin.offsetHeight)/2); }
  function travel(){ return sec.offsetHeight-pin.offsetHeight; }
  function frame(){
    ticking=false;
    var r=sec.getBoundingClientRect(), tr=travel(), u=C((topOff()-r.top)/(tr>0?tr:1))*(n-1);
    var i=Math.min(Math.floor(u),n-2), f=S(.2,.8,u-i);
    track.style.transform='translate3d('+(-(offs(i)+(offs(i+1)-offs(i))*f))+'px,0,0)';
    active(Math.round(u));
  }
  function layout(){ pin.style.top=topOff()+'px'; sec.style.height=(pin.offsetHeight+stepPx()*(n-1))+'px'; }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } }
  function enable(){ if(scrolled) return; scrolled=true; sec.classList.add('pxg-scroll'); layout(); addEventListener('scroll',onScroll,{passive:true}); frame(); }
  function disable(){ if(!scrolled) return; scrolled=false; sec.classList.remove('pxg-scroll'); sec.style.height=''; pin.style.top=''; track.style.transform=''; removeEventListener('scroll',onScroll); cards.forEach(function(c){c.classList.add('on')}); }
  function evalMode(){ if(fits()){ if(scrolled){ layout(); frame(); } else { enable(); } } else disable(); }
  dots.forEach(function(d,k){ d.addEventListener('click',function(){
    if(!scrolled) return; var top=sec.getBoundingClientRect().top+scrollY-topOff();
    scrollTo({top:top+travel()*k/(n-1)+1,behavior:'smooth'});
  }); });
  addEventListener('resize',evalMode); evalMode();
  if(!scrolled) cards.forEach(function(c){c.classList.add('on')});
})();
