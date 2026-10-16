(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse={x:-9999,y:-9999};
  addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.t=(mouse.t||0)+1},{passive:true});
  var INK=[11,27,45],WHITE=[255,255,255],INDIGO=[63,81,181],INDIGO_LT=[160,172,240];
  var presets={
    hero:     {rgb:INK,hi:INDIGO,base:.30,gap:8,r:.62,mask:function(u,v){var edge=.3+.7*Math.min(1,Math.abs(u-.5)*2.2);return edge*Math.max(0,1-v*1.05)}},
    'dark-tr':{rgb:WHITE,hi:INDIGO_LT,base:.26,gap:8,r:.6,mask:function(u,v){return Math.max(0,1-Math.hypot((1-u)*1.1,v*1.6)*.9)}},
    'dark-bl':{rgb:WHITE,hi:INDIGO_LT,base:.25,gap:8,r:.6,mask:function(u,v){return Math.max(0,1-Math.hypot(u*1.1,(1-v)*1.6)*.95)}},
    band:     {rgb:WHITE,hi:INDIGO_LT,base:.30,gap:8,r:.62,mask:function(u,v){return Math.max(0,1-Math.abs(v-.5)*1.5)*(.5+.5*(1-u))}}
  };
  /* tuning */
  var BRUSH=40,        /* head: big round brush at the cursor (px radius) */
      TRAIL=14,        /* thin trail left behind the head (px radius) */
      DECAY=.75,       /* heat falloff per frame: fades in about 0.3s */
      PUSH=2.2,        /* radial push strength */
      DRAG=.3,         /* how much pointer velocity drags dots */
      K_SPRING=.14,    /* position spring stiffness */
      K_DAMP=.7,       /* velocity kept per frame (higher = bouncier, 1 = never settles) */
      S_SPRING=.22,S_DAMP=.78; /* size pop spring */
  function Field(cv){
    var o=presets[cv.dataset.field],ctx=cv.getContext('2d'),g=o.gap;
    var w=0,h=0,dpr=1,cols=0,rows=0,N=0,sxA,cyA,ph,heat,maskA,ox,oy,vx,vy,sc,sv,vis=false,raf=0,last=0,prev=null,seen=0;
    function size(){
      var r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;
      cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      cols=Math.ceil(w/g)+2;rows=Math.ceil(h/g)+1;N=cols*rows;
      sxA=new Float32Array(cols);cyA=new Float32Array(rows);ph=new Float32Array(N);heat=new Float32Array(N);maskA=new Float32Array(N);ox=new Float32Array(N);oy=new Float32Array(N);vx=new Float32Array(N);vy=new Float32Array(N);sc=new Float32Array(N);sv=new Float32Array(N);
      for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){var x=i*g+((j&1)?g/2:0),y=j*g;maskA[j*cols+i]=o.mask(Math.min(x/w,1),Math.min(y/h,1));ph[j*cols+i]=(i*12.9898+j*78.233)%6.2832}
      draw(performance.now(),false);
    }
    /* disturb dots around (px,py); (dvx,dvy) = pointer movement for this step */
    function stamp(px,py,dvx,dvy,R){
      var j0=Math.max(0,Math.floor((py-R)/g)),j1=Math.min(rows-1,Math.ceil((py+R)/g));
      var i0=Math.max(0,Math.floor((px-R-g)/g)),i1=Math.min(cols-1,Math.ceil((px+R)/g));
      for(var j=j0;j<=j1;j++){for(var i=i0;i<=i1;i++){
        var idx=j*cols+i,x=i*g+((j&1)?g/2:0)+ox[idx],y=j*g+oy[idx],dx=x-px,dy=y-py,d=Math.sqrt(dx*dx+dy*dy);
        if(d<R){
          var t=d/R,k;                                   /* round disc: flat core, short soft rim */
          if(t<.6)k=1;else{var u=(t-.6)/.4;k=1-u*u*(3-2*u)}
          if(k>heat[idx])heat[idx]=k;
          var inv=d>.001?1/d:0;
          vx[idx]+=dx*inv*k*PUSH*.35+dvx*k*DRAG;
          vy[idx]+=dy*inv*k*PUSH*.35+dvy*k*DRAG;
          var sp=Math.sqrt(vx[idx]*vx[idx]+vy[idx]*vy[idx]);if(sp>7){vx[idx]*=7/sp;vy[idx]*=7/sp}
        }
      }}
    }
    function pointer(){
      if(reduce||mouse.t===seen)return;               /* only real pointer events, never page scroll */
      seen=mouse.t;
      var rc=cv.getBoundingClientRect(),mx=mouse.x,my=mouse.y;
      if(mx<rc.left-BRUSH||my<rc.top-BRUSH||mx>rc.right+BRUSH||my>rc.bottom+BRUSH){prev=null;return}
      if(prev){var dx=mx-prev.x,dy=my-prev.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<500){var n=Math.max(1,Math.ceil(dist/(g*.8)));for(var s=1;s<=n;s++)stamp(prev.x+dx*s/n-rc.left,prev.y+dy*s/n-rc.top,dx/n,dy/n,s===n?BRUSH:TRAIL)}else stamp(mx-rc.left,my-rc.top,0,0,BRUSH)}
      else stamp(mx-rc.left,my-rc.top,0,0,BRUSH);
      prev={x:mx,y:my};
    }
    function draw(t,live){
      ctx.clearRect(0,0,w,h);
      var L=w+h,sweep=((t*.06)%(L+400))-200,c=o.rgb,hot=[];
      ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';
      for(var ci=0;ci<cols;ci++)sxA[ci]=Math.sin(ci*g*.011+t*.0007);
      for(var cj=0;cj<rows;cj++)cyA[cj]=Math.cos(cj*g*.013-t*.0005);
      for(var j=0;j<rows;j++){for(var i=0;i<cols;i++){
        var idx=j*cols+i,m=maskA[idx];
        var act=heat[idx]>.02||sc[idx]>.03||sc[idx]<-.03||Math.abs(ox[idx])>.06||Math.abs(oy[idx])>.06||Math.abs(vx[idx])>.05||Math.abs(vy[idx])>.05;
        if(m<=.01&&!act)continue;
        var x=i*g+((j&1)?g/2:0),y=j*g;
        var wave=.5+.5*sxA[i]*cyA[j];
        var tw=.5+.5*Math.sin(ph[idx]+t*.0011);
        var dd=(x+y*.7)-sweep,bd=(dd>330||dd<-330)?0:Math.exp(-dd*dd/24200);
        var a=o.base*m*(.3+.48*wave+.22*tw)+bd*.3*m;
        if(act){hot.push(idx,x,y,a);continue}
        if(heat[idx]||sc[idx]||sv[idx]||ox[idx]||oy[idx]||vx[idx]||vy[idx]){heat[idx]=sc[idx]=sv[idx]=ox[idx]=oy[idx]=vx[idx]=vy[idx]=0}
        if(a<.02)continue;
        var r=o.r*(1+bd*.5);
        ctx.globalAlpha=a>1?1:a;ctx.fillRect(x-r,y-r,r*2,r*2);
      }}
      for(var q=0;q<hot.length;q+=4){
        var id=hot[q],x2=hot[q+1],y2=hot[q+2],a2=hot[q+3];
        if(live){ /* springs: positions overshoot and settle; size pops then eases */
          vx[id]-=ox[id]*K_SPRING;vy[id]-=oy[id]*K_SPRING;vx[id]*=K_DAMP;vy[id]*=K_DAMP;ox[id]+=vx[id];oy[id]+=vy[id];
          sv[id]+=(heat[id]-sc[id])*S_SPRING;sv[id]*=S_DAMP;sc[id]+=sv[id];heat[id]*=DECAY;
        }
        var hk=Math.max(0,(heat[id]-.2)/.8),sk=Math.max(0,(Math.abs(sc[id])-.2)/.8),k=Math.min(1,Math.max(hk,sk)),sz=Math.max(0,(sc[id]-.15)/.85);   /* thresholds make the lit area shrink toward the core as it fades: tapered tail */
        var col=[c[0]+(o.hi[0]-c[0])*k,c[1]+(o.hi[1]-c[1])*k,c[2]+(o.hi[2]-c[2])*k];
        ctx.fillStyle='rgb('+(col[0]|0)+','+(col[1]|0)+','+(col[2]|0)+')';
        var rr=o.r*(1+sz*1.7);
        ctx.globalAlpha=Math.min(1,a2*(1-k)+k*.95);
        ctx.fillRect(x2+ox[id]-rr,y2+oy[id]-rr,rr*2,rr*2);
      }
      ctx.globalAlpha=1;
    }
    function loop(t){raf=requestAnimationFrame(loop);if(t-last<22)return;last=t;pointer();draw(t,true)}
    new ResizeObserver(size).observe(cv);size();
    if(reduce){cv.classList.add('ready');return}
    new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!vis){vis=true;cv.classList.add('ready');raf=requestAnimationFrame(loop)}
      else if(!e.isIntersecting&&vis){vis=false;cancelAnimationFrame(raf);prev=null}
    })},{rootMargin:'100px'}).observe(cv);
  }
  Array.prototype.forEach.call(document.querySelectorAll('canvas.dots'),Field);
})();
