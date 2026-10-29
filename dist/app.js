/* 无框架静态原型。内容来自 content.js；路由可直接收藏、前进与后退。 */
const A=window.ARCHIVE;
const main=document.querySelector('main');
const box=document.querySelector('#lightbox');
let imageObserver;
let disposePage=()=>{};
let currentWork=null,photoIndex=0,returnFocus=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photo=(key,eager=false,context='card')=>{
  const i=A.images[key],variants=i.variants;
  const sizes={card:'(max-width:700px) 88vw, (max-width:1050px) 70vw, 60vw',hero:'(max-width:700px) 88vw, 76vw',inset:'(max-width:700px) 28vw, 17vw',stage:'90vw',thumb:'86px',credit:'120px'};
  return '<img src="'+variants[1].path+'" srcset="'+variants.map(v=>v.path+' '+v.width+'w').join(', ')+'" sizes="'+sizes[context]+'" alt="'+esc(i.alt)+'" width="'+i.width+'" height="'+i.height+'" loading="'+(eager?'eager':'lazy')+'" decoding="async" '+(eager?'fetchpriority="high"':'')+' style="object-position:'+esc(i.focal||'50% 50%')+'">';
};
const eyebrow=(num,en)=>`<div class="eyebrow"><span class="red">${num}</span> &nbsp; / &nbsp; ${en}</div>`;
const demo=`<div class="demo-note">演示内容 · 影像为授权图库素材，标题与文字为原型创作文案，非所有者真实作品。</div>`;
const title=(num,en,cn,desc)=>`<div class="page-title">${eyebrow(num,en)}<h1>${cn}<em>${en}</em></h1><p>${desc}</p></div>`;
function workCard(w){
  const isDemo=w.demo!==false;
  return '<a class="work-link" href="#/works/'+w.slug+'"><div class="work-image">'+photo(w.cover)+'<div class="image-hover"><span>'+esc(w.id)+' / '+(isDemo?'图库选读':'摄影档案')+'</span><span>打开档案 ↗</span></div></div><div class="work-label"><div><h3>'+esc(w.title)+'</h3><small>'+esc(w.en)+'</small></div><span class="eyebrow">'+esc(w.id)+'<br>'+esc(w.photos.length)+' 幅 / '+(isDemo?'演示':esc(w.year))+'</span></div><p class="work-medium">'+esc(w.medium)+' <span>'+(isDemo?'非所有者作品':esc(w.year))+'</span></p></a>';
}
function home(){
  const branches=[
    {key:'photos',title:'光停过的地方',href:'works',path:'M 858 196 C 873 204 883 211 899 205'},
    {key:'poems',title:'诗的房间',href:'notes',path:'M 811 297 C 737 322 699 369 629 377 C 555 385 524 345 473 355 C 436 364 408 348 389 339'},
    {key:'traces',title:'日子走过的小路',href:'traces',path:'M 929 451 C 976 465 1025 493 1002 525 C 985 548 978 567 965 572'},
    {key:'lab',title:'还亮着的实验桌',href:'lab',path:'M 516 652 C 457 665 454 721 377 708 C 311 694 301 718 244 705'}
  ];
  const tributaries=branches.map(b=>'<g class="river-distributary branch-'+b.key+'"><path class="branch-haze" d="'+b.path+'"/><path class="tributary tributary-'+b.key+'" pathLength="100" d="'+b.path+'"/><path class="branch-spark" pathLength="100" d="'+b.path+'"/></g>').join('');
  const stars=Array.from({length:54},(_,i)=>{
    const x=(i*173.7+47)%1440, y=(i*97.3+31)%820, r=(i%7===0?1.5:i%3===0?1.05:.65), op=(.12+(i%5)*.075).toFixed(2);
    return '<circle class="scene-dust dust-'+(i%5)+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" opacity="'+op+'"/>';
  }).join('');
  const mobileStars=Array.from({length:28},(_,i)=>{
    const x=(i*67.3+13)%390, y=(i*109.1+21)%820, r=(i%6===0?1.35:i%3===0?.9:.55), op=(.13+(i%4)*.08).toFixed(2);
    return '<circle class="scene-dust dust-'+(i%5)+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" opacity="'+op+'"/>';
  }).join('');
  const nodes=branches.map(b=>'<a class="wander-node node-'+b.key+'" data-branch="'+b.key+'" href="#/'+b.href+'"><span class="node-point" aria-hidden="true"></span><h2>'+b.title+'</h2><span class="node-tail" aria-hidden="true"></span></a>').join('');
  return `<div class="shop-home"><section class="roaming-night roaming-v07b" id="rooms" aria-labelledby="roaming-title" data-paused="false" data-running="false"><h1 id="roaming-title" class="river-sr">清舟的杂货铺 · 漫游入口</h1>
    <div class="scene-art" aria-hidden="true">
      <svg class="scene-svg desktop-scene-art" viewBox="0 0 1440 820" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nightGround" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071722"/><stop offset=".46" stop-color="#102d35"/><stop offset="1" stop-color="#071923"/></linearGradient>
          <linearGradient id="riverWater" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#173b43"/><stop offset=".36" stop-color="#21494b"/><stop offset=".7" stop-color="#243f42"/><stop offset="1" stop-color="#142c35"/></linearGradient>
          <linearGradient id="riverReflection" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5d8b7c" stop-opacity=".1"/><stop offset=".46" stop-color="#d6c17d" stop-opacity=".42"/><stop offset=".72" stop-color="#f2dfaa" stop-opacity=".82"/><stop offset="1" stop-color="#a7c0a7" stop-opacity=".22"/></linearGradient>
          <linearGradient id="riverCore" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#a0b6a0"/><stop offset=".42" stop-color="#d5c17e"/><stop offset=".72" stop-color="#fff0bd"/><stop offset="1" stop-color="#b8c6ad"/></linearGradient>
          <radialGradient id="distantGlow"><stop offset="0" stop-color="#5b887c" stop-opacity=".25"/><stop offset="1" stop-color="#5b887c" stop-opacity="0"/></radialGradient>
          <filter id="riverBloom" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="8"/></filter><filter id="riverBankBlur" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="8"/></filter>
          <filter id="riverSoft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <mask id="riverMaskDesktop" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="820"><path class="river-reveal-trace" pathLength="100" d="M962 -60 C970 95 896 154 798 250 C722 338 965 352 927 453 C885 552 685 592 511 663 C405 716 312 796 255 860" stroke="white" stroke-width="250" stroke-linecap="round" fill="none"/></mask><filter id="pointBloom" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <rect width="1440" height="820" fill="url(#nightGround)"/>
        <ellipse cx="1020" cy="210" rx="520" ry="340" fill="url(#distantGlow)"/>
        <path class="terrain terrain-far" d="M0 0H610C550 68 522 123 554 176S664 260 708 293C602 336 480 348 351 365S125 405 0 455Z"/>
        <path class="terrain terrain-left" d="M0 0H438C418 72 420 117 464 171S552 245 640 278C523 326 373 351 235 365C145 374 72 390 0 414Z"/>
        <path class="terrain terrain-lower-left" d="M0 486C150 438 280 459 370 520S462 627 365 702C300 750 220 786 150 820H0Z"/>
        <path class="terrain terrain-right" d="M940 0H1440V350C1325 327 1220 309 1132 267S1004 189 940 0Z"/>
        <path class="terrain terrain-lower-right" d="M1000 310C1126 326 1195 383 1205 442S1136 515 1082 550C1025 589 1020 665 927 820H1440V330C1308 352 1175 333 1000 310Z"/>
        <g class="terrain-contours" fill="none">
          <path d="M-30 185C150 133 293 163 393 233S541 316 656 324"/><path d="M-20 209C149 162 285 190 383 254S535 331 629 342"/>
          <path d="M-50 605C127 542 260 562 327 612S366 716 246 797"/><path d="M-30 632C120 580 234 591 300 638S330 719 226 790"/>
          <path d="M1094 -20C1080 80 1124 153 1208 189S1375 236 1480 218"/><path d="M1124 -20C1111 73 1150 136 1230 172S1395 213 1480 198"/>
          <path d="M1160 610C1234 560 1350 558 1470 593"/><path d="M1140 642C1222 592 1340 591 1470 623"/>
        </g>
        <g class="river-shape river-revealed" mask="url(#riverMaskDesktop)">
          <path class="river-body" d="M 195 850 C 295 773 366 704 486 642 C 592 588 735 570 815 520 C 876 482 916 445 881 412 C 844 378 755 337 765 270 C 774 216 853 177 891 119 C 916 82 924 36 916 -45 L 1000 -45 C 1006 35 988 95 953 145 C 914 202 827 237 822 278 C 818 319 907 353 946 395 C 997 450 958 508 875 560 C 783 617 640 632 535 684 C 425 740 392 792 324 850 Z"/>
          <path class="river-body-glow" d="M 195 850 C 295 773 366 704 486 642 C 592 588 735 570 815 520 C 876 482 916 445 881 412 C 844 378 755 337 765 270 C 774 216 853 177 891 119 C 916 82 924 36 916 -45 L 1000 -45 C 1006 35 988 95 953 145 C 914 202 827 237 822 278 C 818 319 907 353 946 395 C 997 450 958 508 875 560 C 783 617 640 632 535 684 C 425 740 392 792 324 850 Z"/>
          <path class="river-bank" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-edge" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-water" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-shadowline" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-reflection" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-bloom" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-core" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-current" pathLength="100" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <g class="river-ripples" aria-hidden="true"><path d="M322 784q31 -12 53 -5"/><path d="M463 680q35 -14 60 -7"/><path d="M635 616q23 -11 55 -8"/><path d="M796 554q23 -8 47 -4"/><path d="M912 468q13 -13 30 -14"/><path d="M867 382q26 -2 41 5"/><path d="M774 274q13 -12 27 -12"/><path d="M896 138q19 -5 30 -3"/></g>
        </g>
        <g class="external-branches">${tributaries}</g>
        <g class="scene-points"><circle cx="514" cy="660" r="7"/><circle cx="514" cy="660" r="22" class="point-halo"/><circle cx="924" cy="402" r="4.5"/><circle cx="924" cy="402" r="17" class="point-halo"/><circle cx="927" cy="126" r="3.5"/><circle cx="927" cy="126" r="14" class="point-halo"/><circle class="river-glint glint-a" cx="650" cy="610" r="1.6"/><circle class="river-glint glint-b" cx="754" cy="578" r="1.2"/><circle class="river-glint glint-c" cx="896" cy="478" r="1.6"/><circle class="river-glint glint-d" cx="826" cy="326" r="1.2"/><circle class="river-glint glint-e" cx="875" cy="211" r="1.5"/><circle class="river-glint glint-f" cx="950" cy="72" r="1.1"/></g>
        <g class="scene-stars">${stars}</g>
      </svg>
      <svg class="scene-svg mobile-scene-art" viewBox="0 0 390 820" preserveAspectRatio="none">
        <defs><linearGradient id="mobileGround" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071722"/><stop offset=".55" stop-color="#102d35"/><stop offset="1" stop-color="#071923"/></linearGradient><linearGradient id="mobileWater" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#16343d"/><stop offset=".62" stop-color="#1c3b40"/><stop offset="1" stop-color="#8b9b80"/></linearGradient><mask id="riverMaskMobile" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="820"><path class="river-reveal-trace" pathLength="100" d="M270 -40 C314 189 60 218 84 281 C112 364 302 367 300 416 C294 488 70 478 92 539 C118 620 275 629 254 691 C227 759 49 781 3 860" fill="none" stroke="white" stroke-width="138" stroke-linecap="round"/></mask><filter id="mobileBloom" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <rect width="390" height="820" fill="url(#mobileGround)"/><ellipse cx="300" cy="230" rx="240" ry="260" fill="#2b5b57" opacity=".16"/>
        <path class="terrain terrain-far" d="M0 0H390V240C300 230 250 190 206 143S112 72 0 88Z"/><path class="terrain terrain-left" d="M0 0H160C139 76 180 134 230 175S280 250 230 300C155 326 72 306 0 340Z"/><path class="terrain terrain-lower-left" d="M0 465C85 424 150 449 190 500S235 602 158 671C111 713 52 772 0 820Z"/><path class="terrain terrain-right" d="M305 0H390V820H284C340 730 350 662 307 612S242 522 300 454S345 365 287 317S258 224 310 160Z"/>
        <g class="terrain-contours" fill="none"><path d="M-30 118C70 85 132 111 176 163S220 230 275 235"/><path d="M-30 139C60 112 120 137 163 184S215 247 260 254"/><path d="M-30 515C62 469 127 493 166 545S174 640 98 698"/><path d="M-30 544C53 503 110 524 145 570S151 643 86 693"/></g>
        <g class="river-revealed mobile-river-revealed" mask="url(#riverMaskMobile)">
        <path class="river-body" d="M -70 850 C -8 765 180 762 204 691 C 226 627 18 624 44 540 C 66 470 270 482 275 414 C 280 363 34 355 60 278 C 80 218 277 208 244 -40 L 296 -40 C 330 211 117 235 117 280 C 115 342 340 356 325 416 C 308 487 115 485 115 540 C 112 601 291 624 293 684 C 296 765 92 805 -70 900 Z"/><path class="river-body-glow" d="M -70 850 C -8 765 180 762 204 691 C 226 627 18 624 44 540 C 66 470 270 482 275 414 C 280 363 34 355 60 278 C 80 218 277 208 244 -40 L 296 -40 C 330 211 117 235 117 280 C 115 342 340 356 325 416 C 308 487 115 485 115 540 C 112 601 291 624 293 684 C 296 765 92 805 -70 900 Z"/><path class="river-bank" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-edge" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-water mobile-river-water" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-reflection" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-bloom" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-core" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-current" pathLength="100" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <g class="river-ripples" aria-hidden="true"><path d="M81 780q24 -8 45 -5"/><path d="M199 684q28 -9 46 -2"/><path d="M87 544q27 -9 44 -3"/><path d="M266 415q19 -7 31 0"/><path d="M79 280q25 -5 41 0"/><path d="M238 134q18 -5 29 -1"/></g>
        </g>
        <g class="external-branches"><g class="river-distributary branch-poems"><path class="branch-haze" d="M 98 280 C 87 260 67 276 54 292 C 40 308 35 297 27 294"/><path class="tributary tributary-poems" d="M 98 280 C 87 260 67 276 54 292 C 40 308 35 297 27 294"/><path class="branch-spark" pathLength="100" d="M 98 280 C 87 260 67 276 54 292 C 40 308 35 297 27 294"/></g><g class="river-distributary branch-photos"><path class="branch-haze" d="M 267 209 C 242 180 216 174 195 175"/><path class="tributary tributary-photos" d="M 267 209 C 242 180 216 174 195 175"/><path class="branch-spark" pathLength="100" d="M 267 209 C 242 180 216 174 195 175"/></g><g class="river-distributary branch-traces"><path class="branch-haze" d="M 300 412 C 277 432 239 452 209 439 C 197 433 188 438 180 440"/><path class="tributary tributary-traces" d="M 300 412 C 277 432 239 452 209 439 C 197 433 188 438 180 440"/><path class="branch-spark" pathLength="100" d="M 300 412 C 277 432 239 452 209 439 C 197 433 188 438 180 440"/></g><g class="river-distributary branch-lab"><path class="branch-haze" d="M 252 679 C 216 653 178 673 137 665 C 93 654 82 684 44 683"/><path class="tributary tributary-lab" d="M 252 679 C 216 653 178 673 137 665 C 93 654 82 684 44 683"/><path class="branch-spark" pathLength="100" d="M 252 679 C 216 653 178 673 137 665 C 93 654 82 684 44 683"/></g></g>
        <g class="scene-points"><circle class="river-glint glint-a" cx="220" cy="704" r="1.4"/><circle class="river-glint glint-b" cx="128" cy="597" r="1.1"/><circle class="river-glint glint-c" cx="290" cy="431" r="1.3"/><circle class="river-glint glint-d" cx="102" cy="302" r="1.2"/><circle class="river-glint glint-e" cx="250" cy="151" r="1.1"/></g><g class="scene-stars">${mobileStars}</g>
      </svg>
      <div class="scene-vignette"></div><div class="scene-mist mist-one"></div><div class="scene-mist mist-two"></div>
    </div>
    <button class="motion-toggle" id="toggle-roaming" type="button" aria-label="暂停首页动画" aria-pressed="false" title="暂停首页动画"><span aria-hidden="true">Ⅱ</span></button>
    <div class="roaming-network">${nodes}</div>
  </section>
  </div>`;
}
function works(){
  const selectedPoem=A.notes[0],poemLine=selectedPoem?.body[0]?.split('\n')[0]||'';
  const poemStar=selectedPoem?'<details class="poem-star"><summary aria-label="打开星点，读一句诗"><span aria-hidden="true">✧</span></summary><div class="star-poem-page"><span>一行诗 / '+esc(selectedPoem.title)+'</span><p>'+esc(poemLine)+'</p><a href="#/notes/'+esc(selectedPoem.slug)+'">读完这首诗 ↗</a></div></details>':'';
  const demoCount=A.works.filter(w=>w.demo!==false).length;
  return '<div class="stellar-room"><div class="wrap"><div class="stellar-preface"><header class="stellar-intro">'+eyebrow('02','THE NIGHT COLLECTION')+'<h1>星空暗房</h1><p>让目光慢下来，沿着光寻找影像。</p><small>'+(demoCount?'当前包含 '+demoCount+' 组授权图库选读，真实摄影作品待补充。':'影像收藏 / PHOTOGRAPHY')+'</small></header>'+poemStar+'</div><div class="stellar-stage"><svg class="stellar-threads" aria-hidden="true"></svg><div class="stellar-works">'+A.works.map((w,i)=>'<a href="#/works/'+esc(w.slug)+'" class="stellar-work star-place-'+(i%3)+'"><span class="stellar-star" aria-hidden="true"></span><div class="stellar-image">'+photo(w.cover,i===0,'card')+'</div><div class="stellar-caption"><span>'+esc(w.id)+' / '+(w.demo!==false?'图库选读':'摄影作品')+'</span><h2>'+esc(w.title)+'</h2><small>'+esc(w.en)+' ↗</small></div></a>').join('')+'</div></div><p class="stellar-end">光会留下它经过的地方。<br><span>选择一幅影像，进入暗房。</span></p></div></div>';
}
function workPage(w){
  currentWork=w;photoIndex=0;
  const k=A.works.indexOf(w),prev=A.works[(k+A.works.length-1)%A.works.length],next=A.works[(k+1)%A.works.length];
  return '<article class="darkroom exhibition"><div class="wrap"><header class="exhibition-heading"><a class="back-link" href="#/works">← 摄影集</a><div><span class="eyebrow">'+esc(w.id)+' / DARKROOM</span><h1>'+esc(w.title)+'</h1></div><details class="exhibition-note"><summary>关于这组影像'+(w.demo!==false?' / 演示选读':'')+'</summary><p>'+esc(w.intro)+'</p><p>'+esc(w.medium)+' / '+esc(w.year)+'</p><p>'+(w.demo!==false?'图库演示，非所有者作品。':'摄影记录。')+'</p></details></header><div class="gallery-frame"><button class="photo-stage" id="open-viewer" aria-label="放大浏览当前照片">'+photo(w.photos[0],true,'stage')+'<span>放大观看 ↗</span></button></div><div class="gallery-controls"><button id="prev" disabled>← 上一张</button><span id="gallery-count" aria-live="polite">01 / '+String(w.photos.length).padStart(2,'0')+'</span><button id="next">下一张 →</button></div><p class="gallery-caption" id="gallery-caption">'+esc(w.captions[0])+'</p><p class="photo-credit" id="photo-credit"></p><details class="contact-sheet"><summary>底片索引 / '+w.photos.length+' 帧</summary><div class="thumbs" aria-label="选择照片">'+w.photos.map((p,i)=>'<button data-photo="'+i+'" aria-label="第 '+(i+1)+' 张：'+esc(A.images[p].alt)+'" aria-pressed="'+(i===0)+'">'+photo(p,false,'thumb')+'</button>').join('')+'</div></details><p class="gallery-help">← → 切换 / 聚焦照片后 Enter 放大 / Esc 返回</p><div class="work-pagination"><a href="#/works/'+prev.slug+'"><small>← 上一间 / '+esc(prev.id)+'</small>'+esc(prev.title)+'</a><a href="#/works/'+next.slug+'"><small>下一间 / '+esc(next.id)+' →</small>'+esc(next.title)+'</a></div></div></article>';
}
function noteRow(n){
  const i=A.notes.indexOf(n)+1;
  return '<a class="note-row" href="#/notes/'+n.slug+'"><span class="eyebrow">'+String(i).padStart(2,'0')+'</span><div><h3>'+esc(n.title)+'</h3><p>'+esc(n.excerpt)+'</p><small>'+esc(n.category)+' / '+esc(n.demo!==false?'演示诗页':(n.date||'诗稿选页'))+'</small></div><span class="arrow" aria-hidden="true">↗</span></a>';
}
function poemVolumes(mode='series'){
  const order=mode==='genre'?['现代诗','古风与拟古','词']:['墨檐','挽岚','其他作品'];
  return order.map((name,i)=>{
    const poems=A.notes.filter(n=>(mode==='genre'?n.genre:n.category)===name);
    const note=mode==='series'&&name==='墨檐'?'已完成 · 原稿缺其一至其四':mode==='series'&&name==='挽岚'?'仍在续写':mode==='series'?'未归入上述诗集':'按照作品形式整理';
    return '<details class="poetry-volume" '+(i===0?'':'')+'><summary><span class="volume-mark">'+String(i+1).padStart(2,'0')+'</span><span class="volume-name">'+esc(name)+'</span><span class="volume-annotation">'+esc(note)+'</span><span class="volume-count">'+poems.length+' 首</span><span class="volume-icon" aria-hidden="true">＋</span></summary><div class="volume-pages">'+poems.map(noteRow).join('')+'</div></details>';
  }).join('');
}
// Physical-book reader: full original poems; no forced line splitting or clipping.
const POETRY_GROUPS={series:['墨檐','挽岚','其他作品'],genre:['现代诗','古风与拟古','词']};
let bookState={mode:'series',group:'墨檐',index:0,view:'contents'};
const bookEntries=()=>A.notes.filter(n=>(bookState.mode==='genre'?n.genre:n.category)===bookState.group);
function bookPage(n){
  const paragraphs=n.body.map(p=>'<p>'+esc(p)+'</p>').join('');
  return '<div class="book-poem-header"><span class="book-leaf-meta">'+esc(n.category)+' / '+esc(n.genre)+'</span><h2>'+esc(n.title)+'</h2><span class="book-date">'+esc(n.date||'')+'</span></div><div class="book-poem-body">'+paragraphs+'</div><a class="book-permalink" href="#/notes/'+esc(n.slug)+'">单独打开这首诗 ↗</a>';
}
function renderBook(){
  const entries=bookEntries(),cur=entries[Math.min(bookState.index,entries.length-1)];
  const groups=POETRY_GROUPS[bookState.mode];
  const strips=document.querySelector('#book-volumes'),toc=document.querySelector('#book-toc'),page=document.querySelector('#book-current'),book=document.querySelector('#reading-book');
  if(!book||!strips||!toc||!page)return;
  strips.innerHTML=groups.map((g,i)=>'<button class="book-cover '+(bookState.group===g?'is-current':'')+'" data-book-group="'+esc(g)+'" aria-pressed="'+(bookState.group===g)+'"><span class="book-cover-seal">'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(g)+'</strong><small>'+A.notes.filter(n=>(bookState.mode==='genre'?n.genre:n.category)===g).length+' 首</small></button>').join('');
  toc.innerHTML='<div class="book-page-small">CONTENTS / 目录</div><h2>'+esc(bookState.group)+'</h2><div class="book-index">'+entries.map((n,i)=>'<button class="book-index-item '+(i===bookState.index?'is-selected':'')+'" data-book-index="'+i+'" aria-current="'+(i===bookState.index?'true':'false')+'"><span>'+String(i+1).padStart(2,'0')+'</span><span>'+esc(n.title)+'</span></button>').join('')+'</div>';
  page.innerHTML=cur?bookPage(cur):'<p>这一册尚未收录作品。</p>';
  page.classList.remove('leaf-turn');void page.offsetWidth;page.classList.add('leaf-turn');
  book.classList.toggle('book-show-poem',bookState.view==='poem');
  document.querySelector('#book-page-count').textContent=entries.length?(bookState.index+1)+' / '+entries.length:'0 / 0';
  const prev=document.querySelector('#book-prev'),next=document.querySelector('#book-next');prev.disabled=bookState.index===0;next.disabled=bookState.index>=entries.length-1;
}
function notes(){
  const note=A.poetrySource?.seriesNotes?.['一、墨檐（已完成）'];
  return '<div class="wrap poetry-room poetry-room-v09"><header class="poetry-heading"><span class="poetry-overline">诗的房间</span><h1>翻开一页，读一首诗。</h1></header><section class="book-library" aria-label="可翻阅的诗集"><div class="book-toolbar"><div class="poetry-switch" role="group" aria-label="诗歌分类方式"><button type="button" data-poetry-mode="series" aria-pressed="true">按诗集</button><button type="button" data-poetry-mode="genre" aria-pressed="false">按体裁</button></div><span class="book-count">'+A.notes.length+' 首作品</span></div><div class="book-cover-row" id="book-volumes" aria-label="选择诗集"></div><div class="book-open" id="reading-book"><section class="book-sheet book-left" aria-label="诗集目录"><div id="book-toc"></div><p class="book-footnote">清舟的诗歌 · 逐页复核稿</p></section><section class="book-sheet book-right" aria-label="当前诗歌"><button class="book-back" id="book-back" type="button">← 返回目录</button><div id="book-current"></div><div class="book-page-controls"><button type="button" id="book-prev">← 上一首</button><span id="book-page-count">1 / 1</span><button type="button" id="book-next">下一首 →</button></div></section></div><div class="book-handhint">选择目录中的诗，手机上还可以左右滑动切换作品。</div>'+(note?'<details class="poetry-source-details"><summary>关于《墨檐》的缺篇说明</summary><p>'+esc(note)+'</p></details>':'')+'</section></div>';
}
function bindBook(){
  bookState={mode:'series',group:'墨檐',index:0,view:'contents'}; renderBook();
  const root=document.querySelector('.book-library'); if(!root)return()=>{};
  const click=e=>{
    const mode=e.target.closest('[data-poetry-mode]'); if(mode){bookState.mode=mode.dataset.poetryMode;bookState.group=POETRY_GROUPS[bookState.mode][0];bookState.index=0;bookState.view='contents';document.querySelectorAll('[data-poetry-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===mode)));renderBook();return;}
    const group=e.target.closest('[data-book-group]');if(group){bookState.group=group.dataset.bookGroup;bookState.index=0;bookState.view='contents';renderBook();return;}
    const item=e.target.closest('[data-book-index]');if(item){bookState.index=Number(item.dataset.bookIndex);bookState.view='poem';renderBook();if(innerWidth<=700)document.querySelector('#reading-book')?.scrollIntoView({block:'start',behavior:'instant'});return;}
    if(e.target.closest('#book-back')){bookState.view='contents';renderBook();return;}
    if(e.target.closest('#book-prev')){bookState.index=Math.max(0,bookState.index-1);bookState.view='poem';renderBook();document.querySelector('#book-prev')?.focus();return;}
    if(e.target.closest('#book-next')){bookState.index=Math.min(bookEntries().length-1,bookState.index+1);bookState.view='poem';renderBook();document.querySelector('#book-next')?.focus();}
  };
  root.addEventListener('click',click);
  const keyboard=e=>{if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)||!document.querySelector('.book-open')?.contains(e.target))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();bookState.index=Math.max(0,Math.min(bookEntries().length-1,bookState.index+(e.key==='ArrowRight'?1:-1)));bookState.view='poem';renderBook();}};
  root.addEventListener('keydown',keyboard);
  const book=document.querySelector('#reading-book');let touchStart=null;
  const start=e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};};
  const end=e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.35)return;bookState.index=Math.max(0,Math.min(bookEntries().length-1,bookState.index+(dx<0?1:-1)));bookState.view='poem';renderBook();};
  book.addEventListener('touchstart',start,{passive:true});book.addEventListener('touchend',end,{passive:true});
  return()=>{root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);book.removeEventListener('touchstart',start);book.removeEventListener('touchend',end);};
}

function article(n){
  const list=A.notes.includes(n)?A.notes:(A.legacyNotes||[]),i=list.indexOf(n),prev=list[(i+list.length-1)%list.length],next=list[(i+1)%list.length];
  return '<div class="wrap"><article class="article poetry-reading '+(n.poem?'poem':'')+'"><a class="quiet-link" href="#/notes">← 回到诗集</a><div class="reading-marker"><span>'+String(i+1).padStart(2,'0')+' / '+esc(n.category)+' · '+esc(n.genre||'未分类')+'</span><span>'+(n.demo!==false?'演示文字':'逐页复核稿')+'</span></div><h1>'+esc(n.title)+'</h1>'+(n.en?'<p class="lead">'+esc(n.en)+'</p>':'')+'<div class="body">'+n.body.map(p=>'<p>'+esc(p)+'</p>').join('')+'</div><p class="reading-colophon">'+(n.demo!==false?'此页为原型创作样例，尚非所有者真实作品。':esc((n.sourceMeta||[]).join(' / ')||'来源：诗歌电子稿逐页复核版'))+'</p><div class="article-nav"><a href="#/notes/'+prev.slug+'">← '+esc(prev.title)+'</a><a href="#/notes/'+next.slug+'">'+esc(next.title)+' →</a></div></article></div>';
}
function lab(){
  const nodes=[{x:182,y:190},{x:742,y:196},{x:246,y:360},{x:676,y:356}];
  const links=A.labs.slice(0,nodes.length).map((l,i)=>{const p=nodes[i];return '<a href="#/lab/'+esc(l.slug)+'" class="tree-link tree-node-'+i+'" transform="translate('+p.x+' '+p.y+')" aria-label="'+esc(l.title)+'：'+esc(l.status)+'"><circle class="tree-hit" r="66"/><circle class="tree-node-halo" r="19"/><circle class="tree-node-seed" r="5"/><text x="0" y="-33" text-anchor="middle">'+esc(l.title)+'</text><text x="0" y="34" text-anchor="middle" class="tree-status">'+esc(l.status)+'</text></a>';}).join('');
  return '<div class="wrap personal-lab growing-lab"><header class="room-heading">'+eyebrow('03','THE GROWING LAB')+'<h1>生长中的树</h1><p>一棵树，装得下不同方向的念头。</p></header><section class="tree-dossier" aria-labelledby="tree-label"><div class="tree-portrait"><div class="tree-top"><span>根系 / 枝干 / 新芽</span><span>IDEAS IN PROGRESS</span></div><h2 id="tree-label" class="sr-only">实验项目的树形索引</h2><svg class="idea-tree" viewBox="0 0 920 640" role="group" aria-label="选择一条树枝进入实验项目"><g class="tree-strokes"><path class="root" d="M460 541 C405 565 390 597 280 606 M460 541 C510 580 545 595 640 608 M459 540 C432 583 425 610 365 623 M462 540 C487 588 492 610 545 626"/><path class="trunk" d="M460 548 C465 475 447 432 455 370 C463 305 448 255 460 198 C465 169 466 143 460 118"/><path class="branch" d="M455 376 C380 356 360 221 182 190 M458 330 C550 310 581 199 742 196 M457 445 C377 438 330 372 246 360 M458 423 C545 426 596 365 676 356"/><path class="twig" d="M336 253 Q345 205 322 175 M350 281 Q288 285 269 263 M570 250 Q584 199 618 169 M584 272 Q631 264 651 240 M347 401 Q320 423 301 449 M579 399 Q611 421 630 440"/></g>'+links+'</svg><div class="tree-bottom"><span>三个枝芽 / 都还在生长</span><span>可点击或用键盘打开</span></div></div><aside class="tree-note"><span class="project-status">PROJECTS / EXPERIMENTS</span><h2>先留住<br>一个问题。</h2><p>这里收集项目、练习与尚未展开的想法。枝条可以彼此相连，也可以慢慢长向不同的地方。</p><p class="project-boundary">“绒绒”目前仅确认名称，真实功能与阶段待所有者补充。其余为网页实验或概念占位。</p><a href="#/lab/rongrong" class="quiet-link">翻看绒绒的档案 ↗</a></aside></section><div class="lab-list">'+A.labs.map(l=>'<article class="lab-record"><span class="eyebrow">'+esc(l.id)+'</span><div><h2><a href="#/lab/'+esc(l.slug)+'">'+esc(l.title)+' ↗</a></h2><p>'+esc(l.intro)+'</p><details><summary>展开实验记录</summary><p>'+esc(l.record)+'</p></details></div><span class="status">○ '+esc(l.status)+'</span></article>').join('')+'</div><div class="lab-light-intro"><span class="eyebrow">一件可以亲手试试的网页习作</span><h2>给注意力，找一个形状。</h2></div>'+lightInstrument()+'</div>';
}
function projectDetail(l){
  const stages=l.stages||[{label:'当前状态',text:l.status},{label:'记录',text:l.record}];
  return '<div class="wrap project-reading"><a class="quiet-link" href="#/lab">← 回到实验桌</a><header class="room-heading">'+eyebrow(l.id,'PROJECT DOSSIER')+'<h1>'+esc(l.title)+'</h1><p>'+esc(l.en)+'</p><span class="project-status">○ '+esc(l.status)+'</span></header><div class="project-reading-grid"><section><h2>一开始的念头</h2><p>'+esc(l.inspiration||l.intro)+'</p><h2>还想继续问的</h2><ul>'+(l.questions||['这个想法想留下什么？','下一次尝试，需要怎样的观察？']).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></section><section><h2>留在桌上的记录</h2><ol class="project-stages">'+stages.map(s=>'<li><span>'+esc(s.label)+'</span><p>'+esc(s.text)+'</p></li>').join('')+'</ol><p class="project-boundary">这里呈现档案与演示状态，不构成已发布产品或已完成科研成果的声明。</p></section></div>'+'</div>';
}

function about(){return `<div class="wrap">${title('05','ABOUT','关于这间小店','世界的边缘，往往藏在日常的细节里。')}<div class="about-layout"><div>${eyebrow('A PERSONAL MANIFESTO','小店的自述')}<h2>我想保留的，<br>是看向世界的方式。</h2><p>这里是一个安放注意力的小地方。用诗歌留下没说完的话，用摄影留下光，再把实验和日常的碎片，慢慢收进来。</p><p>在这里，事物可以不被立即归类。一个下午的光，可以成为一组照片；一个无法回答的问题，可以长成一篇手记；一次偶然的尝试，也可以留下自己的位置。</p><p>希望每次回到这里，都能发现：世界依然辽阔，而观察尚未结束。</p><div class="demo-note">以上为网站概念文案。所有者的真实姓名、个人简介与经历尚待填写。</div></div><aside class="about-sidebar">${eyebrow('OPEN ENDED','保持开放')}<dl><dt>关注的方向 / INTERESTS</dt><dd>诗歌与日常观察<br>影像与叙事<br>AI、交互与生活碎片</dd><dt>关于作者 / THE PERSON</dt><dd>个人介绍，待续。</dd><dt>联系 / CONTACT</dt><dd>联系方式与社交账号<br>将在所有者提供后加入。</dd><dt>当前版本 / EDITION</dt><dd>Vol. 001 / v0.9 · 本地预览<br>诗歌来自所有者稿件，影像与足迹等待真实内容</dd></dl></aside></div></div>`}

function credits(){
  const demos=A.works.filter(w=>w.demo!==false).length;
  return '<div class="wrap">'+title('COLOPHON','CREDITS','版本与来源','影像可以被借来观看，归属却应始终清楚。')+
    '<div class="article" style="padding-top:0"><div class="body"><p>影像作者、原始页面与许可逐张列在下方。标为图库选读的条目使用 Unsplash 影像，依 <a class="text-link" href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License ↗</a> 使用。照片著作权归原摄影师所有。</p><p>本版展出 '+A.works.length+' 份摄影档案，其中 '+demos+' 份为图库选读。演示选集名称、分组与配文是原型的编排，不代表原摄影师的命名和拍摄意图；同一张照片不在不同演示选集中重复使用。诗歌来自所有者提供的逐页复核稿；演示项目不代表已完成的科研成果。</p><p>中文标题优先使用 Noto Serif SC（SIL Open Font License），由 Google Fonts 加载；离线时回退系统宋体。正文使用系统字体。本站无需账户、数据库或付费接口。</p></div></div>'+
    '<div class="credits-list">'+Object.entries(A.images).map(([key,i])=>'<div class="credit-item">'+photo(key,false,'credit')+'<div><p>'+esc(i.credit)+'<br>'+(i.source?'<a href="'+esc(i.source)+'" target="_blank" rel="noopener">原始影像来源 ↗</a>':'未提供来源链接')+'<br>许可：'+esc(i.license||'待填写')+'<br>图像文件 / '+esc(i.file)+'</p></div></div>').join('')+'</div></div>';
}
function syncImage(image,im,context='stage'){
  image.width=im.width;image.height=im.height;image.alt=im.alt;
  image.onload=()=>{
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)image.animate([{opacity:.55},{opacity:1}],{duration:280,easing:'ease-out'});
  };
  image.sizes=context==='viewer'?'100vw':'90vw';
  image.srcset=im.variants.map(v=>v.path+' '+v.width+'w').join(', ');
  image.src=im.variants[1].path;
}
function setPhoto(index){
  if(!currentWork)return;
  photoIndex=Math.max(0,Math.min(index,currentWork.photos.length-1));
  const w=currentWork,im=A.images[w.photos[photoIndex]],stage=document.querySelector('#open-viewer');
  if(stage){
    syncImage(stage.querySelector('img'),im);
    document.querySelector('#gallery-count').textContent=String(photoIndex+1).padStart(2,'0')+' / '+String(w.photos.length).padStart(2,'0');
    document.querySelector('#gallery-caption').textContent=w.captions[photoIndex];
    document.querySelector('#prev').disabled=photoIndex===0;
    document.querySelector('#next').disabled=photoIndex===w.photos.length-1;
    document.querySelectorAll('[data-photo]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.photo)===photoIndex));
    document.querySelector('#photo-credit').innerHTML=(w.demo!==false?'图库影像 · ':'')+(im.source?'<a href="'+esc(im.source)+'" target="_blank" rel="noopener">'+esc(im.credit)+' ↗</a>':esc(im.credit))+' · '+esc(im.license||'许可待填写');
  }
  if(box.open)updateViewer();
}
function updateViewer(){
  if(!currentWork)return;
  const im=A.images[currentWork.photos[photoIndex]];
  syncImage(document.querySelector('#viewer-image'),im,'viewer');
  document.querySelector('#viewer-title').textContent=currentWork.title+' / '+(currentWork.demo!==false?'图库选读':'摄影档案');
  document.querySelector('#viewer-count').textContent=(photoIndex+1)+' / '+currentWork.photos.length;
  document.querySelector('#previous-image').disabled=photoIndex===0;
  document.querySelector('#next-image').disabled=photoIndex===currentWork.photos.length-1;
}
function openViewer(){if(!currentWork||box.open)return;returnFocus=document.activeElement;box.showModal();updateViewer();document.querySelector('#close-viewer').focus();}

function traces(){
  return '<section class="traces-coming-soon"><div class="wrap traces-coming-grid"><div class="traces-sky-art" aria-hidden="true"><svg viewBox="0 0 720 580" role="presentation"><defs><radialGradient id="traceGlow"><stop offset="0" stop-color="#f0d99b" stop-opacity=".95"/><stop offset=".32" stop-color="#e5c983" stop-opacity=".34"/><stop offset="1" stop-color="#e5c983" stop-opacity="0"/></radialGradient><filter id="traceBlur"><feGaussianBlur stdDeviation="7"/></filter></defs><g class="trace-grid-lines"><path d="M35 95H685M35 195H685M35 295H685M35 395H685M35 495H685M100 45V535M230 45V535M360 45V535M490 45V535M620 45V535"/></g><g class="trace-network-lines"><path d="M105 385 C170 320 210 350 260 260 S365 185 420 255 S530 330 615 190"/><path d="M160 150 C245 200 260 260 340 330 S480 430 580 390"/><path d="M260 260 C285 180 350 120 430 120 S560 170 615 190"/><path d="M340 330 C310 395 275 440 210 465"/><path d="M420 255 C455 215 480 180 520 145"/></g><g class="trace-network-nodes"><circle class="trace-node-glow" cx="105" cy="385" r="27"/><circle class="trace-node-dot" cx="105" cy="385" r="3.5"/><circle class="trace-node-glow" cx="260" cy="260" r="31"/><circle class="trace-node-dot" cx="260" cy="260" r="4"/><circle class="trace-node-glow" cx="420" cy="255" r="36"/><circle class="trace-node-dot" cx="420" cy="255" r="4.5"/><circle class="trace-node-glow" cx="615" cy="190" r="26"/><circle class="trace-node-dot" cx="615" cy="190" r="3.5"/><circle class="trace-node-glow" cx="580" cy="390" r="23"/><circle class="trace-node-dot" cx="580" cy="390" r="3"/><circle class="trace-node-glow" cx="210" cy="465" r="18"/><circle class="trace-node-dot" cx="210" cy="465" r="2.5"/><circle class="trace-node-glow" cx="160" cy="150" r="20"/><circle class="trace-node-dot" cx="160" cy="150" r="3"/></g><text x="38" y="38">TRACES / NETWORK STUDY 001</text><text x="550" y="548">NOT TO SCALE</text></svg></div><div class="traces-coming-copy"><div class="eyebrow"><span class="red">04</span> &nbsp; / &nbsp; A MAP IS GROWING</div><h1>中国足迹</h1><p class="traces-coming-lead">把走过的地方，慢慢点亮。</p><div class="traces-coming-rule"></div><p>这张地图正在整理中。</p><p class="traces-coming-note">为了确保底图授权与地点记录准确，公开预览暂不展示地理边界。等真实到访的城市确认后，再逐一点亮。</p><a class="traces-back-link" href="#/">先逛逛其他地方 <span aria-hidden="true">↗</span></a><span class="traces-coming-foot">CITIES, MEMORIES &amp; SMALL DISCOVERIES</span></div></div></section>';
}
function paintAtmosphere(layer,config){
  layer.replaceChildren();
  for(const name of ['--atmosphere-opacity','--atmosphere-position','--atmosphere-mobile-position','--backdrop-fit','--backdrop-mask','--backdrop-mask-opacity'])layer.style.removeProperty(name);
  if(!config?.image)return;
  const image=A.images[config.image],mobile=A.images[config.mobileImage];
  layer.innerHTML='<picture>'+(mobile?'<source media="(max-width:700px)" srcset="'+mobile.variants.map(v=>v.path+' '+v.width+'w').join(', ')+'">':'')+photo(config.image,false,'hero')+'</picture><span class="background-mask"></span>';
  layer.style.setProperty('--atmosphere-opacity',Math.max(0,Math.min(1,Number(config.opacity)||0)));
  layer.style.setProperty('--atmosphere-position',config.position||'50% 50%');
  layer.style.setProperty('--atmosphere-mobile-position',config.mobilePosition||config.position||'50% 50%');
  layer.style.setProperty('--backdrop-fit',config.fit==='contain'?'contain':'cover');
  layer.style.setProperty('--backdrop-mask',config.maskColor||'#f1ede4');
  layer.style.setProperty('--backdrop-mask-opacity',Math.max(0,Math.min(1,Number(config.maskOpacity)||0)));
}
function setAtmosphere(room){
  const config=A.backgrounds[room]||{};
  document.body.dataset.textScheme=config.textScheme==='dark'?'dark':'paper';
  paintAtmosphere(document.querySelector('#page-atmosphere'),config);
  const explore=document.querySelector('#explore-atmosphere');
  if(explore)paintAtmosphere(explore,A.backgrounds.explore);
}
let roamingPaused=false;
let roamingIntroComplete=false;
function createWaterSheens(area){
  // Deterministic crests sampled along the real centre-line. No timers/canvas/reflow loops.
  const NS='http://www.w3.org/2000/svg';
  area.querySelectorAll('.river-revealed').forEach((river,which)=>{
    const current=river.querySelector('.river-current'),ref=river.querySelector('.river-ripples');if(!current||!ref||river.querySelector('.water-sheens'))return;
    const n=which===0?76:43,len=current.getTotalLength(),g=document.createElementNS(NS,'g');g.setAttribute('class','water-sheens');
    for(let i=0;i<n;i++){
      const t=((i*.6180339887+.033)%1),p=current.getPointAtLength(t*len),p2=current.getPointAtLength(Math.min(len,t*len+1.5));
      const angle=Math.atan2(p2.y-p.y,p2.x-p.x)*180/Math.PI;
      const offset=(Math.sin(i*14.231)*.5+.5)*(which===0?45:24)-(which===0?22:12);
      const w=(which===0?12:7)+(i%6)*(which===0?4:2.3),amp=1.5+(i%3)*.55;
      const path=document.createElementNS(NS,'path');path.setAttribute('d',`M ${-w/2} 0 Q ${-w/5} ${-amp} 0 0 T ${w/2} 0`);path.setAttribute('transform',`translate(${(p.x+offset*(-Math.sin(angle*Math.PI/180))).toFixed(1)} ${(p.y+offset*Math.cos(angle*Math.PI/180)).toFixed(1)}) rotate(${angle.toFixed(1)})`);path.style.setProperty('--delay',((i*2.83)%9*-1)+'s');path.style.setProperty('--duration',(4.2+(i%7)*.8)+'s');g.appendChild(path);
    }
    ref.after(g);
  });
}
function bindRoaming(){
  const area=document.querySelector('#rooms'),button=document.querySelector('#toggle-roaming');
  createWaterSheens(area);
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,disposed=false;
  let introDone=roamingIntroComplete||preference.matches;
  area.dataset.intro=introDone?'complete':'pending';
  const sync=()=>{
    const paused=roamingPaused||preference.matches;
    area.dataset.paused=String(paused);
    area.dataset.running=String(visible&&!document.hidden&&!paused);
    const label=preference.matches?'已按照系统设置减少动画':roamingPaused?'继续首页动画':'暂停首页动画';
    button.setAttribute('aria-pressed',String(paused));button.disabled=preference.matches;
    button.textContent=paused?'▷':'Ⅱ';button.setAttribute('aria-label',label);button.title=label;
    if(preference.matches){introDone=true;area.dataset.intro='complete';}
    if(visible&&!document.hidden&&!introDone&&area.dataset.intro==='pending') area.dataset.intro='playing';
  };
  const onComplete=e=>{
    if(e.animationName!=='river-reveal-v08'||disposed)return;
    roamingIntroComplete=true;introDone=true;area.dataset.intro='complete';
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05});
  observer.observe(area);
  const onToggle=()=>{roamingPaused=!roamingPaused;sync();};
  button.addEventListener('click',onToggle);area.addEventListener('animationend',onComplete);
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
  return ()=>{disposed=true;observer.disconnect();button.removeEventListener('click',onToggle);area.removeEventListener('animationend',onComplete);preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
}

function render(){
  const hash=location.hash;
  const fromHome=document.body.dataset.room==='home';
  if(hash&&!hash.startsWith('#/')&&main.children.length)return;
  disposePage();disposePage=()=>{};if(box.open)box.close();currentWork=null;
  const [page,slug]=((hash.startsWith('#/')?hash.slice(2):'')||'').split('/');
  let html,label='私人世界',room='home';
  if(!page)html=home();
  else if(page==='works'){
    room='photography';label='我的摄影集';
    if(slug){const w=A.works.find(x=>x.slug===slug);if(w){html=workPage(w);label=w.title;}}
    else html=works();
  }else if(page==='notes'){
    room='poems';label='我的诗集';
    if(slug){const n=A.notes.find(x=>x.slug===slug)||(A.legacyNotes||[]).find(x=>x.slug===slug);if(n){html=article(n);label=n.title;}}
    else html=notes();
  }else if(page==='lab'){
    room='lab';label='我的 AI 实验室';
    if(slug){const l=A.labs.find(x=>x.slug===slug);if(l){html=projectDetail(l);label=l.title;}}
    else html=lab();
  }else if(page==='traces'){
    room='traces';label='中国足迹';html=traces();
  }else if(page==='about'){room='about';html=about();label='关于';}
  else if(page==='credits'){room='about';html=credits();label='版本与来源';}
  if(!html){room='about';html='<div class="wrap">'+title('404','NOT FOUND','这条路，尚未写下。','可以回到入口，重新选一个方向。')+'<a class="quiet-link" href="#/">回到入口 →</a></div>';label='未找到档案';}
  document.body.dataset.room=room;
  document.body.classList.toggle('in-darkroom',room==='photography');
  document.body.classList.toggle('in-geography',room==='traces');
  document.querySelector('meta[name=theme-color]').content=(room==='home'||room==='photography'||room==='traces')?'#0b1928':'#f1ede4';
  main.innerHTML=html;setAtmosphere(room);
  if(fromHome&&room!=='home'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)main.animate([{opacity:.65},{opacity:1}],{duration:240,easing:'ease-out'});
  document.title=label+' · 清舟的杂货铺 / Qingzhou’s Curiosity Shop';
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===(page||'index'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  window.scrollTo({top:0,left:0,behavior:'instant'});if(currentWork)setPhoto(0);bind();revealImages();
}
function bindConstellation(){
  const stage=document.querySelector('.stellar-stage'),svg=stage.querySelector('.stellar-threads');
  const update=()=>{const bounds=stage.getBoundingClientRect();const points=[...stage.querySelectorAll('.stellar-star')].map(s=>{const r=s.getBoundingClientRect();return {x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top};});svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);svg.innerHTML=points.slice(1).map((p,i)=>{const a=points[i],midX=(a.x+p.x)/2,midY=(a.y+p.y)/2-30;return '<path d="M'+a.x+' '+a.y+' Q'+midX+' '+midY+' '+p.x+' '+p.y+'"/>';}).join('');};
  const observer=new ResizeObserver(update);observer.observe(stage);update();return ()=>observer.disconnect();
}
function bind(){
  document.querySelector('#prev')?.addEventListener('click',()=>setPhoto(photoIndex-1));
  document.querySelector('#next')?.addEventListener('click',()=>setPhoto(photoIndex+1));
  document.querySelector('#open-viewer')?.addEventListener('click',openViewer);
  document.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>setPhoto(Number(b.dataset.photo))));
  document.querySelectorAll('[data-poetry-mode]').forEach(button=>button.addEventListener('click',()=>{
    const mode=button.dataset.poetryMode;
    document.querySelectorAll('[data-poetry-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const volumes=document.querySelector('#poetry-volumes');if(volumes)volumes.innerHTML=poemVolumes(mode);
  }));
  if(document.querySelector('.book-library')){const previousDispose=disposePage,stop=bindBook();disposePage=()=>{previousDispose();stop();};}
  if(document.querySelector('.roaming-night'))disposePage=bindRoaming();
  if(document.querySelector('.idea-tree')){const previousDispose=disposePage,tree=document.querySelector('.idea-tree');const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){tree.classList.add('tree-in-view');obs.disconnect();}},{threshold:.15});obs.observe(tree);disposePage=()=>{previousDispose();obs.disconnect();};}
  if(document.querySelector('.stellar-stage')){const previousDispose=disposePage,disposeConstellation=bindConstellation();disposePage=()=>{previousDispose();disposeConstellation();};}
}
// One persistent audio element lives outside the route-swapped <main>.
function initSoundDock(){
  const dock=document.querySelector('#music-dock'),audio=document.querySelector('#dock-audio'),toggle=document.querySelector('#dock-toggle'),panel=document.querySelector('#dock-panel'),play=document.querySelector('#dock-play'),progress=document.querySelector('#dock-progress'),elapsed=document.querySelector('#dock-elapsed'),duration=document.querySelector('#dock-duration');
  if(!dock||!audio)return;
  const fmt=t=>Number.isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
  const update=()=>{elapsed.textContent=fmt(audio.currentTime);if(Number.isFinite(audio.duration))duration.textContent=fmt(audio.duration);progress.value=audio.duration>0?String(Math.round(audio.currentTime/audio.duration*1000)):'0';progress.style.setProperty('--fill',(Number(progress.value)/10)+'%');play.textContent=audio.paused?'▶':'Ⅱ';play.setAttribute('aria-label',(audio.paused?'播放':'暂停')+'《有光的地方》');dock.classList.toggle('is-playing',!audio.paused);};
  const open=v=>{panel.hidden=!v;toggle.setAttribute('aria-expanded',String(v));toggle.setAttribute('aria-label',v?'收起音乐播放器':'展开音乐播放器');if(v)play.focus();else toggle.focus();};
  toggle.addEventListener('click',()=>open(panel.hidden));
  play.addEventListener('click',async()=>{if(audio.paused){try{await audio.play();}catch(err){play.setAttribute('aria-label','播放未成功，请检查浏览器音频设置');}}else audio.pause();update();});
  progress.addEventListener('input',()=>{if(audio.duration>0&&Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(progress.value)/1000;update();});
  audio.addEventListener('timeupdate',update);audio.addEventListener('loadedmetadata',update);audio.addEventListener('play',update);audio.addEventListener('pause',update);audio.addEventListener('ended',update);audio.addEventListener('error',()=>{play.disabled=true;play.textContent='!';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)open(false);});
  update();
}
initSoundDock();
document.querySelector('#close-viewer').addEventListener('click',()=>box.close());box.addEventListener('close',()=>returnFocus?.focus());document.querySelector('#previous-image').addEventListener('click',()=>setPhoto(photoIndex-1));document.querySelector('#next-image').addEventListener('click',()=>setPhoto(photoIndex+1));document.addEventListener('keydown',e=>{if(!currentWork||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();setPhoto(photoIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();setPhoto(photoIndex-1);}});
// 页内翻阅不写入页面路由，避免后退时留下其他页面的正文。
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||!a.getAttribute('href')?.startsWith('#')||a.getAttribute('href').startsWith('#/'))return;const target=document.querySelector(a.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView();if(target.id==='main')target.focus({preventScroll:true});}});
window.addEventListener('hashchange',()=>{render();if(location.hash.startsWith('#/'))main.focus({preventScroll:true});});render();

function revealImages(){
  imageObserver?.disconnect();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
    imageObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');imageObserver.unobserve(e.target);}}),{threshold:.08});
    document.querySelectorAll('.work-image').forEach(img=>{img.classList.add('scroll-image');imageObserver.observe(img);});
  }
  const stage=document.querySelector('#open-viewer');
  if(stage){let start,verticalStart,swiped=false;stage.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false;}},true);stage.addEventListener('touchstart',e=>{swiped=false;start=e.touches[0].clientX;verticalStart=e.touches[0].clientY;},{passive:true});stage.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-start;if(Math.abs(d)>60&&Math.abs(d)>Math.abs(e.changedTouches[0].clientY-verticalStart)*1.5){swiped=true;setPhoto(photoIndex+(d<0?1:-1));}},{passive:true});}
}




