/* Blog post: reading progress, contents scrollspy, share/copy link, newsletter sign-up (simulated until an endpoint is set). */
(function(){
  var bar=document.querySelector('.bp-progress i'), body=document.querySelector('.bp-body');
  var links=[].slice.call(document.querySelectorAll('.bp-toc li a')), heads=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
  var ticking=false;
  function frame(){
    ticking=false;
    if(body&&bar){var r=body.getBoundingClientRect(), h=r.height-innerHeight*.5; bar.style.transform='scaleX('+Math.max(0,Math.min(1,(-r.top+innerHeight*.25)/(h>0?h:1)))+')';}
    var cur=-1; heads.forEach(function(h,i){ if(h&&h.getBoundingClientRect().top<innerHeight*.32) cur=i; });
    links.forEach(function(a,i){ a.classList.toggle('on',i===cur); if(i===cur) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
  }
  addEventListener('scroll',function(){ if(!ticking){ticking=true;requestAnimationFrame(frame)} },{passive:true}); addEventListener('resize',frame); frame();

  var url=location.href.split('#')[0], t=document.title;
  var li=document.querySelector('[data-share=linkedin]'), x=document.querySelector('[data-share=x]');
  if(li) li.href='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url);
  if(x) x.href='https://x.com/intent/post?text='+encodeURIComponent(t)+'&url='+encodeURIComponent(url);
  var cp=document.querySelector('[data-copy]');
  if(cp) cp.addEventListener('click',function(){
    var done=function(){cp.classList.add('ok'); setTimeout(function(){cp.classList.remove('ok')},1600)};
    if(navigator.clipboard) navigator.clipboard.writeText(url).then(done,function(){}); else done();
  });

  var f=document.querySelector('form[data-news]');
  if(f){
    var inp=f.elements.email, msg=f.querySelector('.bp-news-m'), EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!EMAIL.test(inp.value.trim())){ inp.setAttribute('aria-invalid','true'); msg.className='bp-news-m err'; msg.textContent='Enter a valid email address.'; inp.focus(); return; }
      inp.removeAttribute('aria-invalid');
      console.info('[TruEnroll newsletter] no endpoint set; sign-up simulated.',inp.value.trim());
      msg.className='bp-news-m ok'; msg.textContent='Thanks, you are on the list.'; f.reset();
    });
  }
})();
