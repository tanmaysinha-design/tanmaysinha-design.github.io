/* From transcript to verified report. Scroll progress p (0..1 through the pinned section) drives every element.
   Phases: .00 fly in | .14 scan | .30 extract | .44 translate | .56 form table | .72 zoom out to report | .86 verified */
(function(){
  var sec=document.getElementById('story'); if(!sec) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(q,c){return (c||document).querySelector(q)}, $$=function(q,c){return [].slice.call((c||document).querySelectorAll(q))};
  var stage=$('.st-stage',sec), world=$('.st-world',sec), doc=$('.st-doc',sec), scan=$('.st-scan',sec), grp=$('.st-grp',sec),
      tcard=$('.st-tcard',sec), badge=$('.st-badge',sec), report=$('.st-report',sec), stamp=$('.st-stamp',sec), rh=$('.st-rh',sec),
      rep=$('.st-rep',sec), eng=$('.st-eng',sec), wires=$$('.st-w',sec), lits=$$('.st-wl',sec), crms=$$('.st-crm',sec), dots=$$('.st-dot',sec), facets=$('.st-facets',sec), dispM=document.querySelector('#st-paper feDisplacementMap'), turb=document.querySelector('#st-paper feTurbulence'), chips=$$('.st-chip',sec), crows=$$('.st-dt .cr',sec), cards=$$('.st-stat,.st-note',sec), steps=$$('.st-step',sec), ticks=$$('.st-prog i',sec),
      docHits=[$('.st-dh',sec)].concat($$('.st-dm p',sec),$$('.st-dt .cr',sec));
  // split step headlines into words so they can resolve one at a time
  $$('.st-step h2',sec).forEach(function(h){h.innerHTML=h.textContent.trim().split(/\s+/).map(function(w,i){return '<span class="w" style="--i:'+i+'">'+w+'</span>'}).join(' ')});
  var C2=function(x,a,b){return x<a?a:x>b?b:x};
  var C=function(x){return x<0?0:x>1?1:x}, S=function(p,a,b){var t=C((p-a)/(b-a));return t*t*(3-2*t)}, L=function(a,b,t){return a+(b-a)*t};
  var back=function(t){var u=t-1;return 1+2.7*u*u*u+1.7*u*u};
  var W=1,H=1,K0=1,lastP=0;
  var TX=[528,528,528,528,690,30,30]; // each step's text starts at this world x, so it sits beside what is on screen
  // desktop: centre the transcript + text pair (transcript left edge to the text column's right edge) in the viewport
  function x0(K){var tw=Math.min(200,.15*W);return Math.max(0,(W-(650*K+tw))/2-40*K)}
  function fit(){
    W=stage.clientWidth||1;H=stage.clientHeight||1;
    K0=sec.classList.contains('static')?W/1000:W>960?Math.min(.7*W/1000,.88*H/640):Math.min(W/1000,H/640);
    steps.forEach(function(s,i){s.style.left=(sec.classList.contains('static')||W<=960)?'':(i>=5?(W-1000*K0)/2+TX[i]*K0:x0(K0)+TX[i]*K0).toFixed(1)+'px'});
    place(lastP);
  }
  // desktop: the world is centred; for the final report it settles toward the bottom so the headline has the top
  function place(P){
    var p=C(P/.8);
    if(sec.classList.contains('static')){world.style.transform='scale('+K0.toFixed(4)+')';return}
    var ro=S(p,.74,.86);
    if(W>960){
      var sf=Math.min(1,.62*H/(528*K0)), K=K0*L(1,sf,ro), mid=(H-640*K)/2, low=H*.97-552*K;
      world.style.transform='translate('+L(x0(K),(W-1000*K)/2,ro).toFixed(1)+'px,'+L(L(mid,low,ro),mid,S(P,.8,.88)).toFixed(1)+'px) scale('+K.toFixed(4)+')';
    }else{ // phone: the transcript fills the width, then the world widens to the report; it sits in the space under the copy
      var u=S(p,.54,.74), Kp=L(W/540,W/1000,u);
      world.style.transform='translate('+L(W/2-260*Kp,(W-1000*Kp)/2,u).toFixed(1)+'px,'+(290+(H-290-640*Kp)/2).toFixed(1)+'px) scale('+Kp.toFixed(4)+')';
    }
  }
  fit(); window.addEventListener('resize',fit); if('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);

  var lens=[]; function measure(){lens=wires.map(function(w){return w.getTotalLength()})} measure();
  var GL='abcdefghknmprstuvxz';
  function morph(pt,en,t){ // letters change one by one, left to right; a letter in flux shows a faint stand-in glyph first
    if(t<=.12) return pt; if(t>=.92) return en;
    var n=Math.max(pt.length,en.length), out='', u=(t-.12)/.8;
    for(var k=0;k<n;k++){var s=k/n*.72, w=.22, x=(u-s)/w;
      if(x<=0) out+=pt.charAt(k)||'';
      else if(x>=1) out+=en.charAt(k)||'';
      else out+= /\s/.test(en.charAt(k)) ? en.charAt(k) : '<s>'+GL.charAt((k*7+Math.floor(u*30))%GL.length)+'</s>'}
    return out}
  var paper={vel:0,sv:0,lastP:0,lastT:0,run:false};
  function paperLoop(){ if(!paper.run) return; paper.run=false; if(Math.abs(paper.sv)>.03||Math.abs(paper.vel)>.003){ render(lastP); paper.run=true; requestAnimationFrame(paperLoop) } }
  var geo=null; // each course row's box in world space (the chips lift off these rows)
  function rowGeo(){
    geo=crows.map(function(e){var x=0,y=0,n=e; while(n&&n!==doc){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent} return {x:doc.offsetLeft+doc.clientLeft+x,y:doc.offsetTop+doc.clientTop+y,w:e.offsetWidth,h:e.offsetHeight}});
  }
  var hitTops=null;
  function hitY(){ // each document element's vertical centre in document space (offset chain, unaffected by the 3D transform)
    hitTops=docHits.map(function(e){var y=0,n=e; while(n&&n!==doc){y+=n.offsetTop;n=n.offsetParent} return y+e.offsetHeight/2});
  }
  function render(P){
    var p=C(P/.8); lastP=P; place(P);
    // document: 3D fly-in, hold, then recede as the table forms
    var a=S(p,0,.14), b=S(p,.56,.7), dim=S(p,.3,.4);
    doc.style.opacity=C(a*2.2)*(1-b);
    // flexing: scroll speed bends the sheet like a spring (rocks, skews, ripples); folds open as it arrives
    var now=performance.now(), dt=Math.max(16,now-(paper.lastT||now-16)); paper.vel=paper.vel*.6+((P-paper.lastP)/dt*1000)*.4; paper.lastP=P; paper.lastT=now;
    paper.sv+=(C2(paper.vel*30,-18,18)-paper.sv)*.16;
    var fx=paper.sv, sq=L(.66,1,S(p,0,.12));
    doc.style.transform='translate3d('+L(L(-620,0,a),-170,b)+'px,'+L(-70,0,a)+'px,'+L(L(-1000,0,a),-260,b)+'px) rotateX('+(L(10,0,a)+fx*.7)+'deg) rotateY('+L(L(62,0,a),20,b)+'deg) rotateZ('+(L(-8,0,a)+fx*.25)+'deg) skewY('+(fx*.22)+'deg) scale(1,'+sq+')';
    if(dispM){ dispM.setAttribute('scale',(.8+34*(1-a)*(1-a)+22*Math.min(1,Math.abs(fx)/12)).toFixed(2)); }
    facets.style.opacity=((1-a)*.95).toFixed(3);
    if(!paper.run&&(Math.abs(paper.sv)>.03||Math.abs(paper.vel)>.003)){paper.run=true; requestAnimationFrame(paperLoop)}
    doc.style.filter=(dispM&&!reduce?'url(#st-paper) ':'')+'brightness('+(1-.16*dim)+')';
    // scan line
    var sp=S(p,.14,.3), beam=sp*(600+90)-90;
    scan.style.opacity=(p>.14&&p<.31)?1:0; scan.style.transform='translateY('+beam+'px)';
    if(!hitTops) hitY();
    docHits.forEach(function(e,i){e.classList.toggle('hit',p>.14&&p<.46&&beam+90>=hitTops[i])});
    // extracted chips: lift off the rows (PT), translate (EN), travel into the table
    var tr=S(p,.44,.54), eqp=S(p,.68,.74), zin=S(p,.56,.68), zout=S(p,.72,.86);
    if(!geo) rowGeo();
    // translation: the Portuguese text pixelates, then each letter flips to its English counterpart, then the text sharpens
    chips.forEach(function(c,i){
      var ap=S(p,.30+.014*i,.40+.014*i), mv=S(p,.56+.012*i,.68+.012*i), g=geo[i];
      c.style.opacity=ap;
      c.style.width=L(g.w,546,mv)+'px'; c.style.height=L(g.h,44,mv)+'px'; c.style.setProperty('--rd',L(8,0,mv)+'px');
      c.style.transform='translate3d('+L(g.x,73,mv)+'px,'+L(g.y,209+44*i,mv)+'px,'+(ap*(1-mv)*34)+'px) scale('+(1+.012*ap*(1-mv))+')';
      // the course code slides left and fades; the title column grows into the space
      var cm=S(mv,0,.7);
      c.style.setProperty('--cc',L(52,0,cm)+'px'); c.style.setProperty('--cx',(-30*cm)+'px'); c.style.setProperty('--co',1-cm); c.style.setProperty('--cg',(-6*cm)+'px');
      c.style.setProperty('--c2',L(30,90,mv)+'px'); c.style.setProperty('--c3',L(34,90,mv)+'px'); c.style.setProperty('--c4',L(0,90,mv)+'px'); c.style.setProperty('--cg4',(-6*(1-mv))+'px');
      c.style.setProperty('--e2',L(0,41,mv)+'px'); c.style.setProperty('--e3',L(0,35,mv)+'px');
      c.style.setProperty('--pp',L(3,13,mv)+'px'); c.style.setProperty('--fs',L(9.5,13,mv)+'px');
      c.style.setProperty('--ba',L(0,.98,ap)); c.style.setProperty('--bo',L(.7,0,mv)*ap); c.style.setProperty('--sh',ap*(1-mv)*.3);
      var ti=C(tr*1.0-.015*i); c.classList.toggle('en',ti>.5);
      [].forEach.call(c.querySelectorAll('.st-c1,.st-c3'),function(e){
        e.innerHTML=morph(e.dataset.pt,e.dataset.en,ti);
      });
      $('.st-c4',c).style.opacity=eqp;
      c.style.borderBottom=(mv>.9&&i<5)?'1px solid var(--line)':'';
    });
    badge.style.opacity=S(p,.43,.47)*(1-S(p,.56,.6)); badge.style.transform='translateY('+(6*(1-S(p,.43,.47)))+'px)';
    tcard.style.opacity=S(p,.58,.66);
    // table zoom: in while rows land, then out to its place inside the report
    var zs=1+.12*zin*(1-zout), zt=0;
    grp.style.transform='translate('+(154*zt)+'px,'+(-18*zt)+'px) scale('+zs+')';
    // report
    var ro=S(p,.74,.86); report.style.opacity=ro; report.style.transform='scale('+L(.95,1,ro)+')'; rh.style.opacity=S(p,.8,.9);
    cards.forEach(function(e,k){var t=S(p,.78+.02*k,.88+.02*k); e.style.opacity=t; e.style.transform='translateY('+(14*(1-t))+'px)'});
    var st=S(p,.88,.96); stamp.style.opacity=C(st*3); stamp.style.transform='rotate(-8deg) scale('+L(2.1,1,back(st))+')';
    // report shrinks into the evaluation engine, then current flows out along each wire to the CRM tiles
    var sh=S(P,.8,.88);
    rep.style.transform='translate('+(60*sh)+'px,'+(32*sh)+'px) scale('+L(1,.12,sh)+')'; rep.style.opacity=1-S(sh,.82,1);
    eng.style.opacity=S(P,.79,.84); eng.style.setProperty('--g',(S(P,.86,.89)*(1-S(P,.9,.97))*.9+.18*S(P,.84,.86)).toFixed(3));
    wires.forEach(function(w,i){var a=S(P,.84+.01*i,.9+.01*i); w.style.strokeDasharray=lens[i]; w.style.strokeDashoffset=lens[i]*(1-a)});
    crms.forEach(function(e,i){e.style.opacity=S(P,.86+.01*i,.91+.01*i)});
    var d0=S(P,.87,.9)*(1-S(P,.9,.915)); dots[0].style.opacity=d0; dots[0].style.transform='translate(554px,314px) scale('+(.5+.5*S(P,.87,.9))+')';
    wires.forEach(function(w,i){
      var T=S(P,.9+.01*i,.945+.005*i), pt=w.getPointAtLength(T*lens[i]), dd=dots[i+1];
      dd.style.opacity=(T>0&&T<1)?1:0; dd.style.transform='translate('+(pt.x-6)+'px,'+(pt.y-6)+'px)';
      lits[i].style.strokeDasharray=lens[i]; lits[i].style.strokeDashoffset=lens[i]*(1-T); lits[i].style.opacity=T>0?1:0;
      crms[i].classList.toggle('ok',T>=1);
    });
    // copy (the last step waits until the report has shrunk into the engine, so the two never overlap)
    var idx=P>=.86?6:p<.14?0:p<.30?1:p<.44?2:p<.56?3:p<.72?4:5;
    steps.forEach(function(s,i){s.classList.toggle('on',i===idx)}); ticks.forEach(function(t,i){t.classList.toggle('on',i<=idx)});
  }
  if(reduce){sec.classList.add('static'); fit(); render(.79); return}
  var tick=false;
  function onScroll(){
    if(tick) return; tick=true;
    requestAnimationFrame(function(){tick=false;
      var r=sec.getBoundingClientRect(), total=sec.offsetHeight-window.innerHeight;
      render(C(-r.top/(total>0?total:1)));
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true}); window.addEventListener('resize',function(){hitTops=null;geo=null;onScroll()});
  render(0); onScroll();
})();
