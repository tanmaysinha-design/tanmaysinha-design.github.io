/* Hero headline: rotates the noun in the pill. The static headline text lives in .sr-only, so the rotation is visual only. */
(function(){
  var ws=[].slice.call(document.querySelectorAll('.hw')); if(ws.length<2) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var i=0;
  setInterval(function(){
    if(document.hidden) return;
    var out=ws[i]; i=(i+1)%ws.length; var inn=ws[i];
    out.classList.remove('on'); out.classList.add('out'); inn.classList.remove('out'); inn.classList.add('on');
    setTimeout(function(){out.classList.remove('out')},500);
  },2400);
})();
