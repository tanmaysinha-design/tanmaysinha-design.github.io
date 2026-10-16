/* Portal: scripted, looping walkthrough of the TruEnroll app screens (login > list > details > extraction > evaluation).
   Modes (data-mode): "tour" plays every scene in order and loops; "single" loops the one scene named in data-scenes;
   "tabs" plays the scene picked by [data-scene-tab] buttons once, then holds. Plays only while on screen. */
(function(){
  var tpl=document.getElementById('portal-tpl'); if(!tpl) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(q,c){return (c||document).querySelector(q)}, $$=function(q,c){return Array.prototype.slice.call((c||document).querySelectorAll(q))};
  var SPEED=1.35; // walkthrough speed multiplier (1 = original pace)
  var ORDER=['login','list','details','extraction','evaluation'];
  var NAMES={login:'Sign in',list:'Candidate list',details:'Candidate details',extraction:'Extraction review',evaluation:'Evaluation'};

  function Portal(el){
    var me=this; this.el=el; this.tok=0;
    el.appendChild(tpl.content.cloneNode(true));
    el.style.setProperty('--spd',SPEED);
    this.stage=$('.p-stage',el); this.cur=$('.p-cur',el); this.vid=$('.pl-bg',el);
    this.mode=el.dataset.mode||'tour';
    this.scenes=(el.dataset.scenes||ORDER.join(',')).split(',');
    this.view=(el.dataset.view||'0 0 1440 810').split(/\s+/).map(Number);
    this.k=1; this.fx=this.mode!=='single'; this.base=this.view.slice(); this.pops=[];
    el.style.setProperty('--ar',this.view[2]+'/'+this.view[3]);
    el.setAttribute('role','img');
    el.setAttribute('aria-label',el.dataset.label||'Animated walkthrough of the TruEnroll evaluation portal');
    this.fit(); window.addEventListener('resize',function(){me.fit()});
    if('ResizeObserver' in window) new ResizeObserver(function(){me.fit()}).observe(el);
    this.capEl=el.parentNode.querySelector('[data-portal-cap]');
    this.tabs=$$('[data-scene-tab]',el.closest('.portal-wrap')||document.createElement('div'));
    this.tabs.forEach(function(b){b.addEventListener('click',function(){me.go(b.dataset.sceneTab)})});
    this.show(this.scenes[0]); this.final(this.scenes[0]);
    if(reduce||el.hasAttribute('data-static')) return;
    // plays while on screen; inside a gallery card, only while that card is the active one
    var card=el.closest('.wf-card'); me.inView=false;
    function sync(){
      var ok=me.inView&&(!card||card.classList.contains('on'));
      if(ok&&!me.running){me.running=true;me.start()}
      else if(!ok&&me.running){me.running=false;me.tok++}
    }
    var io=new IntersectionObserver(function(es){es.forEach(function(e){me.inView=e.isIntersecting; sync()})},{threshold:.35});
    io.observe(el);
    if(card) window.addEventListener('portal:check',sync);
  }
  var P=Portal.prototype;
  P.fit=function(){
    var w=this.el.clientWidth||1; this.k=w/this.view[2];
    this.el.style.setProperty('--k',this.k); this.el.style.setProperty('--tx',(-this.view[0]*this.k)+'px'); this.el.style.setProperty('--ty',(-this.view[1]*this.k)+'px');
  };
  P.sleep=function(ms){return new Promise(function(res){setTimeout(res,ms/SPEED)})};
  P.ok=function(t){return t===this.tok};
  P.show=function(name){
    var me=this;
    $$('.p-scene',this.el).forEach(function(s){s.classList.toggle('on',s.dataset.scene===name)});
    this.el.dataset.in=name==='login'?'login':'app';
    this.tabs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.sceneTab===name?'true':'false')});
    if(this.capEl) this.capEl.textContent=NAMES[name]||'';
    this.name=name;
    var v=this.vid; if(v){
      if(name==='login'){ if(!v.getAttribute('src')) v.src=v.dataset.src+'#t=0.1'; if(!reduce) v.play().catch(function(){}) }
      else if(v.getAttribute('src')) v.pause();
    }
  };
  P.sk=function(){return this.stage.getBoundingClientRect().width/this.stage.offsetWidth||this.k};
  P.pos=function(sel){
    var t=$(sel,this.stage); if(!t) return null;
    var r=t.getBoundingClientRect(), s=this.stage.getBoundingClientRect(), k=this.sk();
    return {x:(r.left-s.left)/k+Math.min(r.width/k*.5,90),y:(r.top-s.top)/k+r.height/k*.55};
  };
  P.move=function(sel){var p=this.pos(sel); if(!p) return; this.el.classList.add('live'); this.cur.style.transform='translate('+p.x+'px,'+p.y+'px)'};
  P.moveEl=function(t){var r=t.getBoundingClientRect(),s=this.stage.getBoundingClientRect(),k=this.sk();this.el.classList.add('live');this.cur.style.transform='translate('+((r.left-s.left)/k+r.width/k*.5)+'px,'+((r.top-s.top)/k+r.height/k*.55)+'px)'};
  P.tab=function(k){$$('.pe-tabs>span',this.stage).forEach(function(t){t.classList.toggle('on',t.dataset.tab===k)})};
  P.scrollToEl=function(sc,view,el){var d=Math.min(el.offsetTop-8,sc.offsetHeight-view.clientHeight); sc.style.transform='translateY('+(-Math.max(d,0))+'px)'};
  P.scrollTo=function(sc,view){var d=sc.offsetHeight-view.clientHeight; sc.style.transform='translateY('+(-Math.max(d,0))+'px)'};

  /* ---- camera and pop-out cards (tour and tabs modes only) ---- */
  P.cam=function(shot){
    if(!this.fx) return;
    var b=this.base; this.view=shot?[shot[0],shot[1],shot[2],shot[2]*b[3]/b[2]]:b.slice();
    this.stage.classList.add('cam'); this.fit();
  };
  P.box=function(el){var r=el.getBoundingClientRect(), s=this.stage.getBoundingClientRect(), k=this.sk(); return {x:(r.left-s.left)/k,y:(r.top-s.top)/k,w:r.width/k,h:r.height/k}};
  P.pop=function(name,target,dx,dy,o){
    if(!this.fx) return null; o=o||{};
    var tpl=$('.p-pops [data-pop='+name+']',this.stage), el=typeof target==='string'?$(target,this.stage):target; if(!tpl||!el) return null;
    var n=tpl.cloneNode(true), b=this.box(el);
    n.style.left=(b.x+b.w/2+dx)+'px'; n.style.top=(b.y+b.h/2+dy)+'px';
    n.style.setProperty('--px',(-dx*.5)+'px'); n.style.setProperty('--py',(-dy*.5)+'px'); if(o.rot!=null) n.style.setProperty('--pr',o.rot+'deg'); if(o.scale) n.style.setProperty('--ps',o.scale);
    this.stage.appendChild(n);
    var v=this.view, w=n.offsetWidth, h=n.offsetHeight, l=parseFloat(n.style.left), tp=parseFloat(n.style.top);
    n.style.left=Math.min(Math.max(l,v[0]+16),v[0]+v[2]-w-16)+'px'; n.style.top=Math.min(Math.max(tp,v[1]+16),v[1]+v[3]-h-16)+'px';
    void n.offsetWidth; n.classList.add('in'); var u=$('.pbar u',n); if(u) setTimeout(function(){u.classList.add('go')},60);
    this.pops.push(n); return n;
  };
  P.unpop=function(n){if(!n) return; n.classList.add('out'); setTimeout(function(){if(n.parentNode) n.parentNode.removeChild(n)},450)};
  P.clearFx=function(){var me=this; this.pops.forEach(function(n){if(n.parentNode) n.parentNode.removeChild(n)}); this.pops=[]; this.cam(null)};
  P.click=function(){var c=this.cur;c.classList.remove('click');void c.offsetWidth;c.classList.add('click')};
  P.type=function(el,text,t,fast){
    var me=this; return new Promise(function(res){
      var i=0; (function step(){ if(!me.ok(t)){res();return} el.textContent=text.slice(0,++i); if(i<text.length) setTimeout(step,(fast?24+Math.random()*14:28+Math.random()*30)/SPEED); else res() })();
    });
  };
  P.count=function(i,t){
    var me=this, to=parseFloat(i.dataset.n), dec=parseInt(i.dataset.dec||0,10), t0=null;
    return new Promise(function(res){ (function f(ts){ if(!me.ok(t)){res();return} t0=t0||ts; var k=Math.min((ts-t0)*SPEED/1100,1), e=1-Math.pow(1-k,3);
      i.textContent=(to*e).toFixed(dec); if(k<1) requestAnimationFrame(f); else res() })(performance.now()) });
  };

  /* ---- field-to-source mapping (workflow card "Pixel-level bounding OCR audit"): data-variant="map" on the extraction scene ---- */
  P.relBox=function(e,root){var x=0,y=0,n=e; while(n&&n!==root){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent} return {x:x,y:y,w:e.offsetWidth,h:e.offsetHeight}};
  P.mapPairs=function(){ // left-column fields that have a source on the transcript, top to bottom
    var s=this.stage, root=$('.p-ext',s), me=this;
    return $$('.pe-r2>.f',s).map(function(f){var b=me.relBox(f,root), src=$('[data-d='+f.dataset.s+']',s); return src&&b.x<900&&b.y+b.h<680?{f:f,src:src,fb:b,sb:me.relBox(src,root)}:null}).filter(Boolean).sort(function(a,b){return a.fb.y-b.fb.y});
  };
  P.mapLink=function(pr,instant){
    var s=this.stage, root=$('.p-ext',s), svg=$('.p-links',root), ns='http://www.w3.org/2000/svg';
    if(!svg){svg=document.createElementNS(ns,'svg'); svg.setAttribute('class','p-links'); root.appendChild(svg)}
    var x1=pr.sb.x+pr.sb.w, y1=pr.sb.y+pr.sb.h/2, x2=pr.fb.x, y2=pr.fb.y+pr.fb.h/2, dx=Math.max(90,(x2-x1)*.45);
    var path=document.createElementNS(ns,'path'); path.setAttribute('d','M'+x1+' '+y1+'C'+(x1+dx)+' '+y1+' '+(x2-dx)+' '+y2+' '+x2+' '+y2); svg.appendChild(path);
    var a=document.createElementNS(ns,'circle'), b=document.createElementNS(ns,'circle'); a.setAttribute('r',4); b.setAttribute('r',4); a.setAttribute('cx',x1); a.setAttribute('cy',y1); b.setAttribute('cx',x2); b.setAttribute('cy',y2); svg.appendChild(a); svg.appendChild(b);
    var len=path.getTotalLength(); path.style.strokeDasharray=len;
    if(instant){path.style.strokeDashoffset=0; return}
    path.style.strokeDashoffset=len; a.style.opacity=0; b.style.opacity=0; path.getBoundingClientRect(); var on=function(e){e.style.opacity=''};
    path.style.transition='stroke-dashoffset '+(.55/SPEED)+'s var(--ease)'; path.style.strokeDashoffset=0; on(a); setTimeout(function(){on(b)},380/SPEED);
  };
  P.mapClear=function(){var l=$('.p-links',this.stage); if(l) l.remove()};

  /* ---- per-scene reset (start) and final (resting) states ---- */
  P.reset=function(name){
    var s=this.stage;
    if(name==='login'){$('.pl-in',s).classList.remove('has'); $('.pl-in .tx',s).textContent=''}
    if(name==='list'){$$('.pls-row',s).forEach(function(r){r.classList.remove('synced')}); var hi=$('.pls-row.hi',s); if(hi) hi.classList.remove('hi')}
    if(name==='details'){$$('.iss',s).forEach(function(i){i.classList.remove('on')}); $$('.ev b',s).forEach(function(b){b.classList.remove('hot')})}
    if(name==='extraction'){
      $$('[data-d]',s).forEach(function(d){d.classList.remove('rv','ed','sl')});
      $$('.pe-r2>.f',s).forEach(function(f){f.classList.remove('sel','rvw','edt'); f.classList.add('pend'); $('u',f).textContent=''});
      this.mapClear(); $('.scan',s).classList.remove('run'); $('.pe-act b',s).classList.remove('hot');
      $('.pe-scroll',s).style.transform='none'; $$('.g2',s).forEach(function(g){g.classList.remove('hot')}); this.tab('cand');
    }
    if(name==='evaluation'){
      $('.pv-scroll',s).style.transform='none'; $$('.ct-r',s).forEach(function(r){r.classList.remove('on','now')}); $$('.gr',s).forEach(function(g){g.classList.remove('hot')}); $('.rs',s).classList.remove('on'); $('.done',s).classList.remove('hot');
      $$('[data-n]',s).forEach(function(i){i.textContent=(0).toFixed(parseInt(i.dataset.dec||0,10))});
    }
  };
  P.final=function(name){
    var s=this.stage;
    if(name==='login'){var in_=$('.pl-in',s); in_.classList.add('has'); $('.tx',in_).textContent='evaluator@university.edu'}
    if(name==='list'){$('.pls-row:nth-child(2)',s).classList.add('hi'); if(this.el.hasAttribute('data-sync')) $('.pls-row:nth-child(2)',s).classList.add('synced')}
    if(name==='details'){$$('.iss',s).forEach(function(i){i.classList.add('on')})}
    if(name==='extraction'){
      $$('.pe-r2>.f',s).forEach(function(f){f.classList.remove('pend'); $('u',f).textContent=f.dataset.v});
      var by=function(v){return $$('.pe-r2>.f',s).filter(function(f){return f.dataset.v===v})[0]};
      by('Bacharelado em Ciência da Comp.').classList.add('edt'); by('-').classList.add('rvw');
      if(this.el.dataset.variant==='map'){ this.mapClear(); var me=this; this.mapPairs().forEach(function(pr){pr.f.classList.add('sel'); pr.src.classList.add('sl'); me.mapLink(pr,true)}) }
      else ['c1','c3'].forEach(function(d){$('[data-d='+d+']',s).classList.add('rv')});
    }
    if(name==='evaluation'){
      $$('[data-n]',s).forEach(function(i){i.textContent=parseFloat(i.dataset.n).toFixed(parseInt(i.dataset.dec||0,10))});
      $('.rs',s).classList.add('on'); $('.gr:nth-child(3)',s).classList.add('hot'); $$('.ct-r:not(.ct-hd)',s).forEach(function(r){r.classList.add('on')});
    }
  };

  /* ---- scripted scenes ---- */
  P.play={
    login:async function(p,t){
      var s=p.stage, inp=$('.pl-in',s);
      await p.sleep(700); if(!p.ok(t))return;
      p.cam([640,130,800]); p.move('[data-t=login-email]'); await p.sleep(1200); if(!p.ok(t))return;
      p.click(); inp.classList.add('has');
      await p.type($('.tx',inp),'evaluator@university.edu',t); if(!p.ok(t))return;
      await p.sleep(300); p.move('[data-t=login-go]'); await p.sleep(1000); if(!p.ok(t))return; p.click();
      var pp=p.pop('signin','[data-t=login-go]',-420,-30,{rot:-3}); await p.sleep(1500); p.unpop(pp); p.cam(null); await p.sleep(500);
    },
    list:async function(p,t){
      var s=p.stage, row=$('.pls-row:nth-child(2)',s), sync=p.el.hasAttribute('data-sync');
      await p.sleep(600); if(!p.ok(t))return;
      p.cam([92,60,860]); await p.sleep(900); if(!p.ok(t))return;
      p.move('.pls-row:nth-child(2) > span:nth-child(3)'); await p.sleep(900); if(!p.ok(t))return;
      row.classList.add('hi'); p.click();
      var pp=p.pop('case','.pls-row:nth-child(2) > span:nth-child(3)',130,-120,{rot:-3}); await p.sleep(sync?1200:1700); if(!p.ok(t))return;
      p.unpop(pp);
      if(sync){ row.classList.add('synced'); p.move('.pls-row:nth-child(2) .act'); await p.sleep(2200) }
      else { p.cam([640,100,800]); p.move('.pls-row:nth-child(2) .act'); await p.sleep(1300); if(!p.ok(t))return }
      p.cam(null); await p.sleep(400);
    },
    details:async function(p,t){
      var s=p.stage, iss=$$('.iss',s), pops=[];
      await p.sleep(600); if(!p.ok(t))return;
      p.cam([92,70,860]); p.move('.pd-card'); await p.sleep(1500); if(!p.ok(t))return;
      p.cam([400,290,1000]); p.move('.pd-hd u'); await p.sleep(1200); if(!p.ok(t))return;
      for(var i=0;i<iss.length;i++){
        await p.sleep(700); if(!p.ok(t))return; iss[i].classList.add('on');
        if(i===0) pops.push(p.pop('ai',iss[0],140,-90,{rot:-3}));
        if(i===1){ p.unpop(pops[0]); pops.push(p.pop('variation',iss[1],200,-100,{rot:2})) }
      }
      await p.sleep(1300); if(!p.ok(t))return; pops.forEach(function(n){p.unpop(n)});
      var b=$('[data-t=ev2]',s); p.move('[data-t=ev2]'); await p.sleep(1000); if(!p.ok(t))return; b.classList.add('hot'); p.click(); await p.sleep(700);
      p.cam(null);
    },
    extraction:async function(p,t){
      if(p.el.dataset.variant==='map'){
        // each entry field fills in and is linked to its exact source on the original transcript
        var prs=p.mapPairs(), k;
        await p.sleep(600); if(!p.ok(t))return;
        $('.scan',p.stage).classList.add('run'); await p.sleep(900); if(!p.ok(t))return;
        for(k=0;k<prs.length;k++){
          var pr=prs[k]; p.moveEl(pr.f); pr.f.classList.remove('pend'); pr.f.classList.add('sel'); pr.src.classList.add('sl'); p.mapLink(pr);
          p.type($('u',pr.f),pr.f.dataset.v,t,true);
          await p.sleep(650); if(!p.ok(t))return;
        }
        await p.sleep(1800); return;
      }
      var s=p.stage, fs=$$('.pe-r2>.f',s), docs=['c1','c2','c3','c4','c5','c6'], i;
      await p.sleep(500); if(!p.ok(t))return;
      p.cam([60,96,700]); p.move('.doc'); var sc=p.pop('scan','.pe-doc',20,-110,{rot:-3}); $('.scan',s).classList.add('run');
      for(i=0;i<docs.length;i++){ await p.sleep(330); if(!p.ok(t))return; $('[data-d='+docs[i]+']',s).classList.add('rv'); if(i===2) p.cam([60,300,700]) }
      await p.sleep(800); if(!p.ok(t))return; p.unpop(sc);
      docs.forEach(function(d){$('[data-d='+d+']',s).classList.remove('rv')});
      p.cam([60,100,1000]); var fp=p.pop('fields','.pe-tabs',-180,70,{rot:2});
      // all fields populate together; every matching source on the transcript lights up at the same time
      var srcs=[];
      fs.forEach(function(f){var src=$('[data-d='+f.dataset.s+']',s); if(src&&srcs.indexOf(src)<0) srcs.push(src); f.classList.remove('pend'); f.classList.add('sel')});
      srcs.forEach(function(d){d.classList.add('sl')}); p.move('.pe-card');
      await Promise.all(fs.map(function(f){return p.type($('u',f),f.dataset.v,t,true)})); if(!p.ok(t))return;
      await p.sleep(600); if(!p.ok(t))return;
      fs.forEach(function(f){
        f.classList.remove('sel');
        if(f.dataset.v==='Bacharelado em Ciência da Comp.') f.classList.add('edt');
        if(f.dataset.v==='-') f.classList.add('rvw');
      });
      srcs.forEach(function(d){d.classList.remove('sl')}); p.unpop(fp);
      await p.sleep(500); if(!p.ok(t))return;
      p.cam([470,190,940]); p.move('.pe-card'); p.scrollTo($('.pe-scroll',s),$('.pe-card',s)); await p.sleep(1100); if(!p.ok(t))return; p.tab('grades');
      var tp=p.pop('trace','.pe-gt',250,-190,{rot:-2});       var rows=$$('.g2[data-r]',s);
      for(i=0;i<rows.length;i++){
        rows.forEach(function(r){r.classList.remove('hot')}); rows[i].classList.add('hot');
        $$('[data-d]',s).forEach(function(d){d.classList.remove('sl')}); $('[data-d='+rows[i].dataset.r+']',s).classList.add('sl');
        p.moveEl(rows[i]); await p.sleep(520); if(!p.ok(t))return;
      }
      $$('[data-d]',s).forEach(function(d){d.classList.remove('sl')}); rows.forEach(function(r){r.classList.remove('hot')}); p.unpop(tp);
      await p.sleep(400); if(!p.ok(t))return; p.cam(null);
      var b=$('[data-t=ev3]',s); p.move('[data-t=ev3]'); await p.sleep(1100); if(!p.ok(t))return; b.classList.add('hot'); p.click(); await p.sleep(600);     },
    evaluation:async function(p,t){
      var s=p.stage, gr=$$('.gr',s), n=$$('.pv-cs [data-n]',s), i;
      await p.sleep(500); if(!p.ok(t))return;
      p.cam([92,120,780]); var sp=p.pop('scale','.pv-sel',420,-70,{rot:2});
      for(i=0;i<gr.length;i++){ gr.forEach(function(g){g.classList.remove('hot')}); gr[i].classList.add('hot'); p.move('.gr[data-g="'+(i+1)+'"]'); await p.sleep(500); if(!p.ok(t))return }
      gr.forEach(function(g){g.classList.remove('hot')}); p.unpop(sp);
      p.cam([660,150,760]); p.move('.cs-m'); await Promise.all(n.map(function(x){return p.count(x,t)})); if(!p.ok(t))return;
      await p.sleep(500); if(!p.ok(t))return; p.cam(null);
      p.move('.pv-res'); p.scrollToEl($('.pv-scroll',s),$('.pv-view',s),$('.pv-res',s)); await p.sleep(1300); if(!p.ok(t))return;
      $('.rs',s).classList.add('on'); await Promise.all($$('.rs [data-n]',s).map(function(x){return p.count(x,t)})); if(!p.ok(t))return;
      var gp=p.pop('gpa','.eq-g>div:nth-child(3)',-250,-300,{rot:-4,scale:1.05}); await p.sleep(1800); if(!p.ok(t))return; p.unpop(gp);       p.move('.pv-ct'); p.scrollTo($('.pv-scroll',s),$('.pv-view',s)); p.cam([60,90,1380]); await p.sleep(1300); if(!p.ok(t))return;
      var cr=$$('.ct-r:not(.ct-hd)',s);
      for(i=0;i<cr.length;i++){ cr.forEach(function(r){r.classList.remove('now')}); cr[i].classList.add('on','now'); p.moveEl(cr[i]); await p.sleep(560); if(!p.ok(t))return }
      cr.forEach(function(r){r.classList.remove('now')});       await p.sleep(600); if(!p.ok(t))return; p.cam(null);
      var b=$('[data-t=save]',s); p.move('[data-t=save]'); await p.sleep(1000); if(!p.ok(t))return; b.classList.add('hot'); p.click();
      var rp=p.pop('report',b,-380,-110,{rot:-3}); await p.sleep(1800); p.unpop(rp);     }
  };

  P.runScene=async function(name,t){
    this.clearFx(); this.show(name); this.reset(name); this.cur.style.transform='translate(1150px,700px)';
    await this.play[name](this,t);
  };
  P.start=async function(){
    var t=++this.tok, me=this;
    if(this.mode==='tabs'){ await this.runScene(this.name&&this.scenes.indexOf(this.name)>-1?this.name:this.scenes[0],t); return }
    var i=0;
    while(this.ok(t)){
      await this.runScene(this.scenes[i%this.scenes.length],t); if(!this.ok(t))return;
      await this.sleep(this.mode==='single'?2600:300); if(!this.ok(t))return;
      i++;
    }
  };
  P.go=async function(name){
    var t=++this.tok; this.running=true;
    this.el.dataset.in='';
    await this.runScene(name,t);
    if(this.ok(t)) this.final(name);
  };

  document.addEventListener('DOMContentLoaded',function(){ $$('.portal').forEach(function(el){new Portal(el)}) });
})();
