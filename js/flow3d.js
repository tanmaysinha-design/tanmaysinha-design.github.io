/* Scroll-driven 3D workflow (experiment): marksheet > highlighted score > equivalence engine > PDF report.
   Each object has keyframes [progress, tx, ty, tz, rx, ry, rz, scale, opacity]; progress is the scroll position inside the pinned section. */
(function(){
  var sec=document.getElementById('flow'); if(!sec) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(q,c){return (c||document).querySelector(q)}, $$=function(q,c){return Array.prototype.slice.call((c||document).querySelectorAll(q))};
  var fit=$('.f3d-fit',sec), world=$('.f3d-world',sec), scene=$('.f3d-scene',sec), pin=$('.f3d-pin',sec);
  var steps=$$('.f3d-step',sec), dots=$$('.f3d-rail li',sec), railEl=$('.f3d-rail',sec), rows=$$('.x3-d-tbl .x3-rw:not(.x3-faint)',sec);
  var gpaEl=$('[data-v=gpa]',sec), genEl=$('[data-v=gen]',sec);

  // [p, tx, ty, tz, rx, ry, rz, s, o]
  var K={
    doc:[[0,0,10,-260,10,-46,0,1,1],[.1,0,0,-80,7,-24,0,1,1],[.24,0,-4,0,0,0,0,1.06,1],[.36,0,-4,0,0,0,0,1.06,1],[.47,-150,-6,-250,5,34,0,.86,.6],[.58,-250,0,-430,0,52,0,.8,0]],
    chip:[[.3,0,152,4,0,0,0,.9,0],[.35,0,150,50,0,0,0,1,1],[.42,0,40,170,0,0,0,1.5,1],[.5,70,-70,110,0,0,0,1.15,1],[.58,90,16,40,0,0,0,.45,0]],
    engine:[[.4,90,150,-260,0,0,0,.6,0],[.5,90,40,0,0,0,0,1,1],[.78,90,40,0,0,0,0,1,1],[.88,200,60,-340,0,0,0,.8,0]],
    res:[[.6,90,10,10,0,0,0,.3,0],[.68,90,-140,70,0,0,0,1,1],[.79,0,-6,150,0,-6,0,1.12,1],[.86,0,-6,190,0,-14,0,1.1,0]],
    pdf:[[.79,0,0,-240,0,48,0,.5,0],[.88,0,0,10,0,-22,0,1,1],[1,0,0,60,0,10,0,1.02,1]]
  };
  // Home-page story: 01 extraction, 02 GPA recalculation, 03 source mapping (result traced back to the marksheet), 04 report.
  var story=sec.hasAttribute('data-story'), bounds=story?[.36,.7,.84]:[.22,.46,.78];
  if(story){
    K.doc=K.doc.concat([[.64,-300,0,-320,0,52,0,.8,0],[.72,-185,10,-30,0,24,0,.78,1],[.84,-185,10,-30,0,24,0,.78,1],[.9,-270,0,-220,0,44,0,.7,0]]);
    K.engine=[[.4,90,150,-260,0,0,0,.6,0],[.5,90,40,0,0,0,0,1,1],[.62,90,40,0,0,0,0,1,1],[.72,200,60,-340,0,0,0,.8,0]];
    K.res=[[.6,90,10,10,0,0,0,.3,0],[.68,90,-140,70,0,0,0,1,1],[.76,118,-24,90,0,-10,0,1,1],[.84,118,-24,90,0,-10,0,1,1],[.9,140,-24,60,0,-14,0,.95,0]];
    K.pdf=[[.86,0,0,-240,0,48,0,.5,0],[.93,0,0,10,0,-22,0,1,1],[1,0,0,60,0,10,0,1.02,1]];
  }
  var BEAM={x:-106,y:124,z:30,tx:20,ty:-6}; // start on the marksheet score, end at the result card
  var CAM=[[0,-8,7,0],[.3,5,3,-10],[.6,-4,6,0],[1,-9,-1,-14]]; // p, rotY, rotX, translateY

  var ease=function(t){return t*t*(3-2*t)}, clamp=function(v,a,b){return Math.min(Math.max(v,a),b)};
  var seg=function(p,a,b){return ease(clamp((p-a)/(b-a),0,1))};
  function sample(frames,p){
    if(p<=frames[0][0]) return frames[0].slice(1);
    for(var i=1;i<frames.length;i++){
      if(p<=frames[i][0]){
        var a=frames[i-1], b=frames[i], t=ease((p-a[0])/(b[0]-a[0])), out=[];
        for(var j=1;j<9;j++) out.push(a[j]+(b[j]-a[j])*t);
        return out;
      }
    }
    return frames[frames.length-1].slice(1);
  }
  function cam(p){
    for(var i=1;i<CAM.length;i++) if(p<=CAM[i][0]){var a=CAM[i-1],b=CAM[i],t=ease((p-a[0])/(b[0]-a[0]));return [1,2,3].map(function(j){return a[j]+(b[j]-a[j])*t})}
    return CAM[CAM.length-1].slice(1);
  }

  var objs={}; $$('[data-o]',sec).forEach(function(e){objs[e.dataset.o]=e});
  var cur=0, target=0, lastStep=-1;

  function render(p){
    Object.keys(K).forEach(function(n){
      var s=sample(K[n],p), e=objs[n]; if(!e) return;
      e.style.transform='translate3d('+s[0]+'px,'+s[1]+'px,'+s[2]+'px) rotateX('+s[3]+'deg) rotateY('+s[4]+'deg) rotateZ('+s[5]+'deg) scale('+s[6]+')';
      e.style.opacity=Math.max(0,Math.min(1,s[7]));
    });
    var c=cam(p); world.style.transform='translateY('+c[2]+'px) rotateX('+c[1]+'deg) rotateY('+c[0]+'deg)';
    // scene variables
    var scan=seg(p,.11,.27), hl=Math.max(seg(p,.28,.34)*(1-seg(p,.44,.5)), story?seg(p,.68,.74)*(1-seg(p,.84,.9)):0), run=seg(p,.5,.62)*(1-(story?seg(p,.62,.72):seg(p,.8,.86)));
    var set=function(k,v){fit.style.setProperty(k,v)};
    set('--scan',scan.toFixed(3)); set('--scano',(p>.1&&p<.3?1:0)); set('--hl',hl.toFixed(3));
    set('--run',run.toFixed(3)); set('--spin',(p*1500).toFixed(1));
    var g0=story?.86:.79; set('--fan',seg(p,g0+.11,1).toFixed(3)); set('--gen',seg(p,g0+.01,g0+.11).toFixed(3)); set('--stamp',seg(p,.94,.99).toFixed(3));
    if(objs.beam){var bt=story?seg(p,.74,.8)*(1-seg(p,.84,.88)):0, dx=BEAM.tx-BEAM.x, dy=BEAM.ty-BEAM.y, L=Math.sqrt(dx*dx+dy*dy), a=Math.atan2(dy,dx)*180/Math.PI;
      objs.beam.style.transform='translate3d('+BEAM.x+'px,'+BEAM.y+'px,'+BEAM.z+'px) rotateZ('+a+'deg) scaleX('+(L*bt).toFixed(1)+')'; objs.beam.style.opacity=bt>0?1:0}
    rows.forEach(function(r,i){r.classList.toggle('on',scan>(i+.5)/rows.length&&p<.34)});
    if(gpaEl) gpaEl.textContent=(3.71*seg(p,.66,.76)).toFixed(2);
    if(genEl) genEl.textContent=p<g0+.11?'Generating report…':'Report ready';
    // text steps + rail
    var si=p<bounds[0]?0:p<bounds[1]?1:p<bounds[2]?2:3;
    if(si!==lastStep){lastStep=si; steps.forEach(function(s,i){s.classList.toggle('on',i===si)}); dots.forEach(function(d,i){d.classList.toggle('on',i<=si)})}
    if(railEl) railEl.style.setProperty('--rail',(si/3).toFixed(3));
  }

  function progress(){
    var r=sec.getBoundingClientRect(), nav=parseFloat(getComputedStyle(pin).top)||0, total=sec.offsetHeight-pin.clientHeight;
    return clamp((nav-r.top)/total,0,1);
  }
  function size(){
    var w=scene.clientWidth, h=scene.clientHeight;
    fit.style.setProperty('--k',Math.min(w/640,h/640,1.4)*1.12);
  }
  function loop(){
    target=progress();
    cur=reduce?target:cur+(target-cur)*.14;
    if(Math.abs(target-cur)<.0004) cur=target;
    render(cur);
    requestAnimationFrame(loop);
  }
  size(); window.addEventListener('resize',size);
  if('ResizeObserver' in window) new ResizeObserver(size).observe(scene);
  cur=progress(); render(cur); requestAnimationFrame(loop);
})();
