(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(q,c){return Array.prototype.slice.call((c||document).querySelectorAll(q))};
  // 1. tag elements for reveal, with stagger inside each parent
  var groups=['.head','.cmp','.shift','.logos .lab','.tiles div','.stats .stat','.rcard','.fgrid>div','.node','.layer-core','.tbl tr','.certs','.sblock','.cdl>div','.pcols','.topics','.faq details','.cta .wrap>*','.form-head'];
  var seen=new Map();
  groups.forEach(function(g){ $(g).forEach(function(el){
    el.classList.add('reveal');
    var p=el.parentNode; var n=seen.get(p)||0; seen.set(p,n+1);
    el.style.setProperty('--d',Math.min(n*0.07,0.5)+'s');
  });});
  // 1b. card stack: earlier cards shrink and dim as the next one slides over
  var cards=$('.wstep');
  if(cards.length&&!reduce){
    var tick=false;
    var upd=function(){tick=false;cards.forEach(function(c,i){
      var nx=cards[i+1]; if(!nx){c.style.setProperty('--s',1);c.style.setProperty('--b',1);return}
      var top=parseFloat(getComputedStyle(c).top)||0;
      var k=Math.max(0,Math.min(1,(c.getBoundingClientRect().height-(nx.getBoundingClientRect().top-top))/c.getBoundingClientRect().height));
      if(window.innerWidth<=960)k=k*.6;
      c.style.setProperty('--s',(1-k*.05).toFixed(4));c.style.setProperty('--b',(1-k*.35).toFixed(3));
    })};
    var req=function(){if(!tick){tick=true;requestAnimationFrame(upd)}};
    window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);upd();
  }
  // 1c. mark the current page in the nav
  $('nav a.l, nav .mg-item').forEach(function(a){var u=a.getAttribute('href'); if(u&&u.charAt(0)==='/'&&u.indexOf('#')<0&&u.length>1&&location.pathname.indexOf(u)===0){a.setAttribute('aria-current','page'); var dd=a.closest('.dd'); if(dd)dd.classList.add('cur')}});
  // 1d. nav dropdowns: hover (pointer devices) plus click, keyboard and outside-click
  (function(){
    var dds=$('.dd'); if(!dds.length) return;
    var hov=window.matchMedia('(hover:hover) and (min-width:961px)');
    function frost(){var open=dds.some(function(d){return d.classList.contains('open')}); var n=document.querySelector('nav'); n.classList.toggle('dd-on',open); if(open){n.style.setProperty('--nav-blur','16px');n.style.setProperty('--nav-bg','1');n.style.setProperty('--nav-fade','1')} else {window.dispatchEvent(new Event('scroll'))}}
    function set(d,on){d.classList.toggle('open',on); frost(); var t=d.querySelector('.dd-t'); if(t)t.setAttribute('aria-expanded',on?'true':'false')}
    function closeAll(except){dds.forEach(function(d){if(d!==except)set(d,false)})}
    dds.forEach(function(d){
      var t=d.querySelector('.dd-t'), timer;
      t.addEventListener('click',function(e){var on=!d.classList.contains('open'); closeAll(d); set(d,on)});
      d.addEventListener('mouseenter',function(){if(!hov.matches)return; clearTimeout(timer); closeAll(d); set(d,true)});
      d.addEventListener('mouseleave',function(){if(!hov.matches)return; timer=setTimeout(function(){set(d,false)},160)});
      d.addEventListener('focusout',function(e){if(!d.contains(e.relatedTarget))set(d,false)});
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=dds.filter(function(d){return d.classList.contains('open')})[0]; if(o){set(o,false); o.querySelector('.dd-t').focus()}}});
    document.addEventListener('click',function(e){if(!e.target.closest('.dd'))closeAll()});
  })();
  // 2. counters
  function count(el){
    var to=parseFloat(el.dataset.count),dec=parseInt(el.dataset.dec||0,10);
    var fm=function(v){return el.dataset.sep?Math.round(v).toLocaleString('en-US'):v.toFixed(dec)};
    if(reduce){el.textContent=fm(to);return}
    var t0=null,dur=1400;
    function f(t){t0=t0||t;var k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,3);el.textContent=fm(to*e);if(k<1)requestAnimationFrame(f)}
    el.textContent=fm(0);requestAnimationFrame(f);
  }
  // 3. observer
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;
    var el=e.target;el.classList.add('in');setTimeout(function(){el.classList.add('done')},1800);
    $('[data-count]',el).forEach(count);
    if(el.dataset&&el.dataset.count)count(el);
    io.unobserve(el);
  })},{threshold:.18,rootMargin:'0px 0px -6% 0px'});
  $('.reveal').forEach(function(el){ if(reduce){el.classList.add('in')} else io.observe(el) });
  // 4. hero sequence: sweep, then trace brackets one by one, count GPA
  var traces=$('.tr');
  function hero(){
    var sw=$('.sweep')[0]; if(sw)sw.classList.add('go');
    traces.forEach(function(t,i){setTimeout(function(){t.classList.add('on')},1100+i*420)});
    var g=$('.gpa[data-count]')[0]; if(g)setTimeout(function(){count(g)},1300);
  }
  if(reduce){traces.forEach(function(t){t.classList.add('on')})} else {
    var g=$('.gpa[data-count]')[0]; if(g)g.textContent='0.00';
    setTimeout(hero,500);
  }
  // 5. progress bar + nav shadow
  var prog=document.getElementById('prog'),nav=document.querySelector('nav'),tick=false;
  function onScroll(){
    var h=document.documentElement.scrollHeight-innerHeight;
    prog.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
    nav.classList.toggle('scrolled',scrollY>8);
    var onDark=false,probe=34; $('.dark').forEach(function(d){var r=d.getBoundingClientRect(); if(r.top<=probe&&r.bottom>=probe)onDark=true}); nav.classList.toggle('on-dark',onDark);
    var k=Math.min(scrollY/140,1); if(!nav.classList.contains('dd-on')){nav.style.setProperty('--nav-blur',(k*16).toFixed(2)+'px');nav.style.setProperty('--nav-bg',k.toFixed(3));nav.style.setProperty('--nav-fade',k.toFixed(3))}
    tick=false;
  }
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
  // 6. cursor spotlight on cards
  $('.bc').forEach(function(c){c.addEventListener('pointermove',function(e){
    var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');
  })});
  // 7. mobile menu
  var navEl=document.querySelector('nav'),tg=document.querySelector('.nav-toggle');
  if(tg&&navEl){
    var setOpen=function(o){navEl.classList.toggle('open',o);tg.setAttribute('aria-expanded',o?'true':'false')};
    tg.addEventListener('click',function(){setOpen(!navEl.classList.contains('open'))});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&navEl.classList.contains('open')){setOpen(false);tg.focus()}});
    navEl.addEventListener('click',function(e){if(e.target.closest('.nav-menu a'))setOpen(false)});
    document.addEventListener('click',function(e){if(navEl.classList.contains('open')&&!e.target.closest('nav'))setOpen(false)});
    matchMedia('(min-width: 961px)').addEventListener('change',function(e){if(e.matches)setOpen(false)});
  }
})();
