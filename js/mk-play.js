/* Starts a mockup's loop only while it is on screen. */
(function(){
  var els=document.querySelectorAll('.mk'); if(!els.length) return;
  if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('on')}); return; }
  var io=new IntersectionObserver(function(en){ en.forEach(function(x){ x.target.classList.toggle('on',x.isIntersecting); }); },{threshold:.35});
  els.forEach(function(e){ io.observe(e); });
})();
