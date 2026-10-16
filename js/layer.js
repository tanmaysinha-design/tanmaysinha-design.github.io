/* AI credential layer card: cycles the status line, as if the model were working through a document. */
(function(){
  var el=document.querySelector('.lc-st'); if(!el||!el.dataset.steps) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var steps=el.dataset.steps.split('|'), i=0;
  setInterval(function(){
    if(document.hidden) return;
    el.classList.add('sw');
    setTimeout(function(){i=(i+1)%steps.length; el.textContent=steps[i]; el.classList.remove('sw')},350);
  },2400);
})();
