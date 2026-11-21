(function(){
  var doc=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(pointer:fine)').matches, $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var hasGsap=!!window.gsap&&!!window.ScrollTrigger, lenis=null, lang=doc.lang||'en';
  if(hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  if(window.Lenis&&hasGsap&&!reduced){
    lenis=new Lenis({lerp:.09,wheelMultiplier:.95});
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000)});
    gsap.ticker.lagSmoothing(0);
  }
  function goTo(t){ if(lenis) lenis.scrollTo(t,{offset:-64,duration:1.4}); else t.scrollIntoView({behavior:'smooth'}); }
  $$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){
    var id=a.getAttribute('href'); if(id.length<2) return; var t=$(id); if(!t) return;
    e.preventDefault(); goTo(t); history.replaceState(null,'',id);
  });});

  /* header, progress, active link */
  var header=$('header'), prog=$('.progress'), last=0, secs=$$('section[id]'), links=$$('nav.links a[href^="#"]');
  function onScroll(){
    var y=window.scrollY, h=doc.scrollHeight-innerHeight;
    header.classList.toggle('scrolled',y>40);
    header.classList.toggle('hide',y>last&&y>500&&!$('nav.links.open'));
    last=y;
    if(prog) prog.style.width=(h>0?y/h*100:0)+'%';
    var cur=''; secs.forEach(function(s){ if(y+innerHeight*.4>=s.offsetTop) cur=s.id; });
    links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+cur)});
  }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* mobile menu */
  var burger=$('.burger'), nav=$('nav.links');
  if(burger&&nav){
    var tog=function(o){nav.classList.toggle('open',o);burger.classList.toggle('open',o);burger.setAttribute('aria-expanded',o);
      if(lenis){o?lenis.stop():lenis.start()}else document.body.style.overflow=o?'hidden':'';};
    burger.addEventListener('click',function(){tog(!nav.classList.contains('open'))});
    $$('a',nav).forEach(function(a){a.addEventListener('click',function(){tog(false)})});
  }

  /* reveal */
  var rv=$$('[data-reveal]');
  if(reduced||!('IntersectionObserver' in window)){rv.forEach(function(e){e.classList.add('in')})}
  else{
    var io=new IntersectionObserver(function(en){en.forEach(function(x){
      if(x.isIntersecting){var el=x.target,i=[].indexOf.call(el.parentNode.children,el);
        el.style.transitionDelay=Math.min(i,6)*70+'ms';el.classList.add('in');io.unobserve(el);}
    })},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    rv.forEach(function(e){io.observe(e)});
  }

  /* hero network canvas */
  function network(){
    var c=$('#net'); if(!c) return;
    var x=c.getContext('2d'),W,H,nodes,arcs,pk,mouse={x:-999,y:-999},run=true,t=0,raf;
    var IT=[34,176,125],TR=[238,75,64];
    var rg=function(a,al){return 'rgba('+a[0]+','+a[1]+','+a[2]+','+al+')'};
    var gauss=function(){return (Math.random()+Math.random()+Math.random()-1.5)/1.5};
    function build(){
      var r=c.getBoundingClientRect(),D=Math.min(devicePixelRatio||1,2);
      W=r.width;H=r.height;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0);
      var mob=W<700,n=mob?34:70,sp=Math.min(W,H)*(mob?.2:.25);
      var cs=mob?[{x:.3,y:.27,c:IT},{x:.72,y:.5,c:TR}]:[{x:.26,y:.46,c:IT},{x:.76,y:.4,c:TR}];
      nodes=[];
      cs.forEach(function(cl,k){for(var i=0;i<n;i++){
        nodes.push({bx:i?cl.x*W+gauss()*sp*1.7:cl.x*W,by:i?cl.y*H+gauss()*sp*1.3:cl.y*H,ph:Math.random()*6.28,sp:.2+Math.random()*.5,r:i?1+Math.random()*1.7:5,c:cl.c,k:k,x:0,y:0,hub:!i});}});
      var n0=n; arcs=[{a:nodes[0],b:nodes[n0],lift:.2}];
      for(var j=0;j<5;j++) arcs.push({a:nodes[1+(Math.random()*(n0-1)|0)],b:nodes[n0+1+(Math.random()*(n0-1)|0)],lift:.1+Math.random()*.18});
      pk=[];for(j=0;j<9;j++) pk.push({arc:j%arcs.length,u:Math.random(),s:.0022+Math.random()*.0028});
    }
    function pt(a,b,l,u){var mx=(a.x+b.x)/2,my=Math.min(a.y,b.y)-H*l;
      return {x:(1-u)*(1-u)*a.x+2*(1-u)*u*mx+u*u*b.x,y:(1-u)*(1-u)*a.y+2*(1-u)*u*my+u*u*b.y,mx:mx,my:my}}
    function frame(){
      if(!run) return; t+=.016; x.clearRect(0,0,W,H);
      nodes.forEach(function(n){
        n.x=n.bx+Math.cos(t*n.sp+n.ph)*10;n.y=n.by+Math.sin(t*n.sp*1.2+n.ph)*10;
        var dx=n.x-mouse.x,dy=n.y-mouse.y,d=Math.hypot(dx,dy);
        if(d<150&&d>0){var f=(150-d)/150*20;n.x+=dx/d*f;n.y+=dy/d*f;}
      });
      var L=W<700?72:108,i,j,a,b,d;
      for(i=0;i<nodes.length;i++){a=nodes[i];
        for(j=i+1;j<nodes.length;j++){b=nodes[j];if(a.k!==b.k)continue;
          d=Math.hypot(a.x-b.x,a.y-b.y);
          if(d<L){x.strokeStyle=rg(a.c,(1-d/L)*.38);x.lineWidth=1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();}}
        d=Math.hypot(a.x-mouse.x,a.y-mouse.y);
        if(d<140){x.strokeStyle='rgba(255,255,255,'+(1-d/140)*.55+')';x.beginPath();x.moveTo(a.x,a.y);x.lineTo(mouse.x,mouse.y);x.stroke();}
      }
      arcs.forEach(function(r){var p=pt(r.a,r.b,r.lift,.5),g=x.createLinearGradient(r.a.x,0,r.b.x,0);
        g.addColorStop(0,rg(IT,.5));g.addColorStop(.5,'rgba(255,255,255,.45)');g.addColorStop(1,rg(TR,.5));
        x.strokeStyle=g;x.lineWidth=1.2;x.beginPath();x.moveTo(r.a.x,r.a.y);x.quadraticCurveTo(p.mx,p.my,r.b.x,r.b.y);x.stroke();});
      nodes.forEach(function(n){x.fillStyle=rg(n.c,n.hub?1:.85);x.beginPath();x.arc(n.x,n.y,n.r,0,6.283);x.fill();
        if(n.hub){x.strokeStyle=rg(n.c,.5+.3*Math.sin(t*2));x.lineWidth=1.5;x.beginPath();x.arc(n.x,n.y,12+4*Math.sin(t*2),0,6.283);x.stroke();}});
      pk.forEach(function(p){var r=arcs[p.arc];p.u+=p.s;if(p.u>1)p.u=0;
        for(var k=0;k<6;k++){var u=Math.max(0,p.u-k*.012),q=pt(r.a,r.b,r.lift,u);
          x.fillStyle='rgba(255,255,255,'+(.9-k*.15)+')';x.beginPath();x.arc(q.x,q.y,2.4-k*.28,0,6.283);x.fill();}});
      if(!reduced) raf=requestAnimationFrame(frame);
    }
    build();frame();
    var hero=c.parentNode;
    hero.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
    hero.addEventListener('pointerleave',function(){mouse.x=mouse.y=-999});
    var rs;addEventListener('resize',function(){clearTimeout(rs);rs=setTimeout(function(){build();if(reduced)frame()},150)});
    if('IntersectionObserver' in window&&!reduced) new IntersectionObserver(function(en){
      var v=en[0].isIntersecting;if(v&&!run){run=true;frame()}else if(!v){run=false;cancelAnimationFrame(raf)}}).observe(hero);
  }
  network();

  /* hero headline: split words */
  var h1=$('.hero h1'),words=[];
  if(h1&&hasGsap&&!reduced){
    h1.setAttribute('aria-label',h1.textContent.trim());
    $$('span',h1).forEach(function(s){
      s.setAttribute('aria-hidden','true');
      s.innerHTML=s.textContent.trim().split(/\s+/).map(function(w){return '<span class="w"><i>'+w+'</i></span>'}).join(' ');
    });
    words=$$('.w>i',h1);gsap.set(words,{yPercent:115});
    gsap.set(['.eyebrow','.lead','.ctas','.scroll-hint'],{autoAlpha:0,y:24});
  }
  function intro(){
    if(!hasGsap||reduced) return;
    var tl=gsap.timeline({defaults:{ease:'power4.out'}});
    tl.to('.eyebrow',{autoAlpha:1,y:0,duration:.9})
      .to(words,{yPercent:0,duration:1.2,stagger:.055},'-=.6')
      .to(['.lead','.ctas','.scroll-hint'],{autoAlpha:1,y:0,duration:1,stagger:.12},'-=.7');
    gsap.to('#net',{yPercent:14,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero .wrap',{yPercent:-12,autoAlpha:.2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom 20%',scrub:true}});
  }
  var ld=$('.loader');
  if(doc.classList.contains('js-loading')){
    try{sessionStorage.setItem('itrea-seen','1')}catch(e){}
    setTimeout(function(){doc.classList.remove('js-loading');intro()},1250);
  } else intro();

  /* scroll-driven sections */
  if(hasGsap&&!reduced){
    var al=$('.approach-line'),steps=$$('.step');
    if(al) ScrollTrigger.create({trigger:al,start:'top 78%',end:'bottom 60%',scrub:true,onUpdate:function(s){
      al.style.setProperty('--p',s.progress);
      steps.forEach(function(st,i){st.classList.toggle('on',s.progress>=i/steps.length+.04)});
    }});
    var mm=gsap.matchMedia();
    mm.add('(min-width:801px)',function(){
      var sec=$('.bridge-section'); if(!sec) return;
      var wrap=$('.connector-wrap'),p=document.createElement('span');p.className='pkt';wrap.appendChild(p);
      gsap.fromTo(p,{left:'0%'},{left:'100%',duration:2.4,ease:'power1.inOut',repeat:-1,yoyo:true});
      var tl=gsap.timeline({scrollTrigger:{trigger:sec,start:'top top',end:'+=120%',pin:true,scrub:.7}});
      tl.from('.market-panel.left',{xPercent:-35,autoAlpha:0,duration:1})
        .from('.market-panel.right',{xPercent:35,autoAlpha:0,duration:1},'<')
        .from('.connector-line',{scaleX:0,duration:.9},'-=.15')
        .from('.it-labels span',{y:34,autoAlpha:0,stagger:.12,duration:.5},'-=.1')
        .from('.shared-scope-label',{autoAlpha:0,duration:.4},'<');
    });
  }

  /* spotlight + tilt + cursor */
  $$('.svc-row,.inv-panel').forEach(function(el){
    el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();
      el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
      if(fine&&el.classList.contains('inv-panel')&&!reduced){
        var px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
        el.style.transform='rotateY('+px*9+'deg) rotateX('+(-py*9)+'deg) translateZ(0)';}});
    el.addEventListener('pointerleave',function(){el.style.transform=''});
  });
  if(fine&&!reduced){
    var cur=document.createElement('div');cur.className='cursor';document.body.appendChild(cur);doc.classList.add('has-cursor');
    var mx=-50,my=-50,cx=-50,cy=-50;
    addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY});
    (function loop(){cx+=(mx-cx)*.2;cy+=(my-cy)*.2;cur.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(loop)})();
    document.addEventListener('pointerover',function(e){cur.classList.toggle('big',!!e.target.closest('.link-cta,.inv-panel,.svc-row'))});
    $$('.link-cta').forEach(function(b){
      b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();
        b.style.transform='translate('+(e.clientX-r.left-r.width/2)*.2+'px,'+(e.clientY-r.top-r.height/2)*.3+'px)'});
      b.addEventListener('mouseleave',function(){b.style.transform=''});
    });
  }

  /* contact form: send without leaving the page */
  var f=$('form[action*="formsubmit"]');
  if(f){
    var M={en:['Thank you. Your request has been sent. We will reply shortly.','Could not send. Please email us directly.','Sending…'],
      it:['Grazie. La richiesta è stata inviata. Risponderemo a breve.','Invio non riuscito. Scrivici direttamente via email.','Invio in corso…'],
      tr:['Teşekkürler. Talebiniz iletildi. Kısa sürede dönüş yapacağız.','Gönderilemedi. Lütfen doğrudan e-posta gönderin.','Gönderiliyor…']}[lang]||[];
    var msg=document.createElement('div');msg.className='form-msg';msg.setAttribute('role','status');f.insertBefore(msg,f.querySelector('button'));
    f.addEventListener('submit',function(e){
      e.preventDefault();var b=f.querySelector('button'),o=b.textContent;b.disabled=true;b.textContent=M[2];msg.className='form-msg';
      fetch(f.action.replace('formsubmit.co/','formsubmit.co/ajax/'),{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}})
        .then(function(r){if(!r.ok)throw 0;return r.json()})
        .then(function(){msg.textContent=M[0];msg.className='form-msg ok';f.reset()})
        .catch(function(){msg.textContent=M[1];msg.className='form-msg err'})
        .then(function(){b.disabled=false;b.textContent=o});
    });
  }

  /* language switch keeps section; fade between pages */
  $$('.langs a').forEach(function(a){a.addEventListener('click',function(e){
    var base=a.getAttribute('href').split('#')[0],url=base+(location.hash||'');
    if(a.classList.contains('active')){e.preventDefault();return}
    e.preventDefault();document.body.classList.add('leaving');setTimeout(function(){location.href=url},330);
  })});
  addEventListener('pageshow',function(){document.body.classList.remove('leaving')});
})();
