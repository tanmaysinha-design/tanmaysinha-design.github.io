/* Blog index: live search, topic filter. While filtering, the featured post and tinted trio give way to one flat grid. */
(function(){
  var main=document.getElementById('b-main'); if(!main) return;
  var q=document.getElementById('b-q'), btn=document.querySelector('.b-topic-t'), list=document.getElementById('b-topics'), cur=document.getElementById('b-cur'), empty=document.getElementById('b-empty');
  var cards=[].slice.call(main.querySelectorAll('.b-card')), topic='';
  function apply(){
    var s=q.value.trim().toLowerCase(), on=!!(s||topic), shown=0;
    main.classList.toggle('filtering',on);
    cards.forEach(function(c){
      var ok=(!s||c.dataset.t.indexOf(s)>-1)&&(!topic||c.dataset.topics.split('|').indexOf(topic)>-1);
      c.hidden=!ok; if(ok&&(on||!c.classList.contains('b-dup'))) shown++;
    });
    empty.hidden=shown>0;
  }
  q.addEventListener('input',apply);
  btn.addEventListener('click',function(){var o=btn.getAttribute('aria-expanded')==='true'; btn.setAttribute('aria-expanded',o?'false':'true'); list.hidden=o});
  list.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    topic=b.dataset.topic; cur.textContent=topic?': '+topic:'';
    [].forEach.call(list.children,function(x){x.setAttribute('aria-selected',x===b?'true':'false')});
    apply();
  });
})();
