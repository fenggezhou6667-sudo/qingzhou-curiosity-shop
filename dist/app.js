/* 无框架静态原型。内容来自 content.js；路由可直接收藏、前进与后退。 */
const A=window.ARCHIVE;
const main=document.querySelector('main');
const box=document.querySelector('#lightbox');
let imageObserver;
let disposePage=()=>{};
let currentWork=null,photoIndex=0,returnFocus=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// --- 留言簿与诗笺批注本地持久化存储 ---
const DEFAULT_GUESTBOOK=[
  {id:'gb-1',name:'江客',place:'杭州',seal:'舟',date:'2026.11.05',text:'在光河的转角读到了《破阵子》，很有骨力与共鸣。愿小店长明。'},
  {id:'gb-2',name:'拾光人',place:'广州',seal:'星',date:'2026.11.04',text:'星空暗房里的恒星系很美，像是一座悬在深空里的琉璃音乐盒。'},
  {id:'gb-3',name:'云岫',place:'南京',seal:'松',date:'2026.11.03',text:'从玉林的山河到上海的墨檐，诗句读来有一股安静的力量。'},
  {id:'gb-4',name:'夜渡者',place:'成都',seal:'猫',date:'2026.11.01',text:'很喜欢这间杂货铺的夜色，没有吵闹的卡片，只有河流与星光。'},
  {id:'gb-5',name:'晚风',place:'苏州',seal:'叶',date:'2026.10.28',text:'停驻良久，给诗集落了一枚朱砂印。'},
  {id:'gb-6',name:'过路客',place:'北京',seal:'舟',date:'2026.10.26',text:'世界的边缘，往往藏在日常的细节里。很高兴与这间店相遇。'}
];
function getGuestbookNotes(){
  try{
    const stored=JSON.parse(localStorage.getItem('qz_guestbook_notes')||'[]');
    return [...stored,...DEFAULT_GUESTBOOK];
  }catch{return DEFAULT_GUESTBOOK;}
}
function addGuestbookNote(item){
  try{
    const stored=JSON.parse(localStorage.getItem('qz_guestbook_notes')||'[]');
    stored.unshift(item);
    localStorage.setItem('qz_guestbook_notes',JSON.stringify(stored));
  }catch{}
}
function getPoemSealCount(slug){
  try{
    const counts=JSON.parse(localStorage.getItem('qz_poem_seal_counts')||'{}');
    const seeds={'poem-001':68,'poem-005':112,'poem-008':89,'poem-026':156,'poem-029':74,'poem-030':128};
    return (counts[slug]||0)+(seeds[slug]||38);
  }catch{return 38;}
}
function recordPoemSeal(slug){
  try{
    const counts=JSON.parse(localStorage.getItem('qz_poem_seal_counts')||'{}');
    counts[slug]=(counts[slug]||0)+1;
    localStorage.setItem('qz_poem_seal_counts',JSON.stringify(counts));
    return getPoemSealCount(slug);
  }catch{return 39;}
}
function getPoemAnnotations(slug){
  try{
    const list=JSON.parse(localStorage.getItem('qz_poem_annos_'+slug)||'[]');
    const defaults={
      'poem-026':[
        {name:'学海舟客',place:'上海',text:'「笔赋三秋叶落，纸倾学海云疆」，读来豪迈沉雄，深有同感。',date:'2026.11.02'},
        {name:'晚渡',place:'杭州',text:'词牌写得很有骨力，尤其下阙书客燃灯。',date:'2026.10.29'}
      ],
      'poem-030':[
        {name:'秦岳行者',place:'西安',text:'夜登华山，星斗满天，唯有铁索作答。好诗！',date:'2026.11.01'}
      ]
    };
    return [...list,...(defaults[slug]||[])];
  }catch{return [];}
}
function addPoemAnnotation(slug,item){
  try{
    const list=JSON.parse(localStorage.getItem('qz_poem_annos_'+slug)||'[]');
    list.unshift(item);
    localStorage.setItem('qz_poem_annos_'+slug,JSON.stringify(list));
  }catch{}
}

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
    {key:'photos',title:'光停过的地方',href:'works',
      path:'M 930 124 C 1000 77 1070 74 1156 82 S 1340 93 1490 68',
      ribbon:'M 912 121 C 982 69 1060 54 1158 66 S 1343 79 1490 50 L 1490 88 C 1337 111 1243 105 1153 98 S 1013 101 940 146 Z'},
    {key:'poems',title:'诗的房间',href:'notes',
      path:'M 814 286 C 764 300 727 322 676 323 C 616 325 565 297 510 300 C 390 305 260 278 -60 267',
      ribbon:'M 827 291 C 773 305 732 329 676 338 C 615 338 566 315 510 315 C 370 320 232 294 -60 287 L -60 247 C 231 255 373 290 510 281 C 568 277 620 309 677 306 C 728 306 770 281 821 267 Z'},
    {key:'traces',title:'日子走过的小路',href:'traces',
      path:'M 928 403 C 982 439 1020 492 1080 519 C 1180 563 1317 559 1500 531',
      ribbon:'M 916 392 C 979 424 1025 477 1089 502 C 1180 538 1321 540 1500 513 L 1500 551 C 1321 579 1175 579 1072 536 C 1012 509 964 458 922 432 Z'},
    {key:'lab',title:'还亮着的实验桌',href:'lab',
      path:'M 514 660 C 475 645 441 632 403 642 C 330 665 260 710 170 708 S 20 730 -60 764',
      ribbon:'M 505 680 C 453 649 414 651 369 672 C 304 700 241 730 169 725 S 21 750 -60 786 L -60 747 C 24 708 93 685 171 690 S 321 650 405 625 C 447 612 485 623 525 640 Z'}
  ];
  const desktopMainShape='M 170 850 C 280 770 357 694 479 633 C 588 579 730 563 808 513 C 866 476 905 443 876 416 C 836 380 749 338 760 270 C 769 213 858 171 905 112 C 935 74 945 23 939 -45 L 979 -45 C 984 29 970 88 940 140 C 902 201 831 239 828 278 C 824 315 912 348 952 391 C 1008 449 966 516 882 568 C 790 627 648 641 544 694 C 434 752 405 804 350 850 Z';
  const desktopNetwork=desktopMainShape+' '+branches.map(b=>b.ribbon).join(' ');
  const desktopWaterShapes='<path d="'+desktopMainShape+'"/>'+branches.map(b=>'<path d="'+b.ribbon+'"/>').join('');
  const desktopMaskShapes=branches.map(b=>'<path fill="url(#desktopFade-'+b.key+')" d="'+b.ribbon+'"/>').join('')+'<path fill="white" d="'+desktopMainShape+'"/>';
  const desktopBranchReveal=branches.map(b=>'<path class="river-reveal-trace branch-reveal branch-reveal-'+b.key+'" pathLength="100" d="'+b.path+'" stroke="white" stroke-width="64" stroke-linecap="round" fill="none"/>').join('');
  const tributaries=branches.map(b=>'<g class="river-distributary branch-'+b.key+'"><path class="branch-haze" fill="none" d="'+b.path+'"/><path class="tributary tributary-'+b.key+'" fill="none" pathLength="100" d="'+b.path+'"/><path class="branch-waterline" fill="none" d="'+b.path+'"/><path class="branch-current" fill="none" pathLength="1000" d="'+b.path+'"/><path class="branch-spark" fill="none" pathLength="100" d="'+b.path+'"/></g>').join('');
  const mobileBranches=[
    {key:'photos',path:'M 262 145 C 311 134 371 167 448 172 S 591 181 720 175',ribbon:'M 247 124 C 311 116 368 152 449 155 S 600 161 720 159 L 720 191 C 601 195 520 195 446 190 S 310 151 281 160 C 268 163 255 169 244 176 Z'},
    {key:'poems',path:'M 106 280 C 59 267 21 240 -40 236 S -200 220 -350 232',ribbon:'M 113 263 C 66 250 25 224 -39 219 S -210 205 -350 213 L -350 249 C -200 240 -110 251 -40 253 S 57 282 100 298 Z'},
    {key:'traces',path:'M 292 416 C 335 428 367 463 434 474 S 594 482 720 468',ribbon:'M 280 396 C 335 404 371 445 437 457 S 602 464 720 451 L 720 487 C 595 501 499 504 430 491 S 332 447 301 444 C 290 443 280 446 269 451 Z'},
    {key:'lab',path:'M 90 540 C 46 541 7 577 -51 602 S -221 624 -350 613',ribbon:'M 102 520 C 45 520 3 562 -55 584 S -223 606 -350 595 L -350 631 C -217 642 -112 647 -47 620 S 45 563 78 562 C 88 561 96 562 107 565 Z'}
  ];
  const mobileMainShape='M -300 925 C -8 765 173 760 197 691 C 218 629 12 624 38 540 C 58 467 261 479 264 414 C 270 363 29 355 52 278 C 75 218 275 209 256 -40 L 284 -40 C 320 210 126 237 124 280 C 122 340 351 353 336 416 C 318 491 123 489 123 540 C 120 600 298 623 301 684 C 305 770 98 810 -300 985 Z';
  const mobileNetwork=mobileMainShape+' '+mobileBranches.map(b=>b.ribbon).join(' ');
  const mobileWaterShapes='<path d="'+mobileMainShape+'"/>'+mobileBranches.map(b=>'<path d="'+b.ribbon+'"/>').join('');
  const mobileWaterMaskShapes=mobileBranches.map(b=>'<path fill="url(#branchFade-'+b.key+')" d="'+b.ribbon+'"/>').join('')+'<path fill="white" d="'+mobileMainShape+'"/>';
  const mobileBranchReveal=mobileBranches.map(b=>'<path class="river-reveal-trace branch-reveal mobile-reveal-'+b.key+'" pathLength="100" d="'+b.path+'" stroke="white" stroke-width="50" stroke-linecap="round" fill="none"/>').join('');
  const mobileTributaries=mobileBranches.map(b=>'<g class="river-distributary branch-'+b.key+'"><path class="branch-haze" fill="none" d="'+b.path+'"/><path class="tributary tributary-'+b.key+'" fill="none" pathLength="100" d="'+b.path+'"/><path class="branch-waterline" fill="none" d="'+b.path+'"/><path class="branch-current" fill="none" pathLength="1000" d="'+b.path+'"/><path class="branch-spark" fill="none" pathLength="100" d="'+b.path+'"/></g>').join('');
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
        <defs><clipPath id="riverClipDesktop">${desktopWaterShapes}</clipPath>
          ${branches.map(b=>`<linearGradient id="desktopFade-${b.key}" gradientUnits="userSpaceOnUse" x1="${b.key==='photos'||b.key==='traces'?920:780}" y1="0" x2="${b.key==='photos'||b.key==='traces'?1440:0}" y2="0"><stop offset="0" stop-color="#b6b6b6"/><stop offset=".5" stop-color="#4d4d4d"/><stop offset="1" stop-color="#050505"/></linearGradient>`).join('')}
          <filter id="desktopBankSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
          <mask id="desktopWaterMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="820"><g filter="url(#desktopBankSoft)">${desktopMaskShapes}</g></mask>
          <filter id="desktopWaterTexture" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".014 .12" numOctaves="2" seed="12"/><feColorMatrix type="matrix" values="0 0 0 0 .8  0 0 0 0 .77  0 0 0 0 .57  0 0 0 .22 0"/></filter>
          <linearGradient id="nightGround" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071722"/><stop offset=".46" stop-color="#102d35"/><stop offset="1" stop-color="#071923"/></linearGradient>
          <linearGradient id="riverWater" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#173b43"/><stop offset=".36" stop-color="#21494b"/><stop offset=".7" stop-color="#243f42"/><stop offset="1" stop-color="#142c35"/></linearGradient>
          <linearGradient id="riverReflection" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5d8b7c" stop-opacity=".1"/><stop offset=".46" stop-color="#d6c17d" stop-opacity=".42"/><stop offset=".72" stop-color="#f2dfaa" stop-opacity=".82"/><stop offset="1" stop-color="#a7c0a7" stop-opacity=".22"/></linearGradient>
          <linearGradient id="riverCore" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#a0b6a0"/><stop offset=".42" stop-color="#d5c17e"/><stop offset=".72" stop-color="#fff0bd"/><stop offset="1" stop-color="#b8c6ad"/></linearGradient><linearGradient id="branchWaterDesktop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#426c68"/><stop offset=".48" stop-color="#8e9b78"/><stop offset=".72" stop-color="#d2b978"/><stop offset="1" stop-color="#547a72"/></linearGradient>
          <radialGradient id="distantGlow"><stop offset="0" stop-color="#5b887c" stop-opacity=".25"/><stop offset="1" stop-color="#5b887c" stop-opacity="0"/></radialGradient>
          <filter id="riverBloom" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="8"/></filter><filter id="riverBankBlur" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="8"/></filter>
          <filter id="riverSoft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <mask id="riverMaskDesktop" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="820"><path class="river-reveal-trace river-main-trace" pathLength="100" d="M962 -60 C970 95 896 154 798 250 C722 338 965 352 927 453 C885 552 685 592 511 663 C405 716 312 796 255 860" stroke="white" stroke-width="250" stroke-linecap="round" fill="none"/>${desktopBranchReveal}</mask><filter id="pointBloom" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
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
          <g mask="url(#desktopWaterMask)"><rect class="river-body" x="0" y="-45" width="1440" height="895" style="fill:url(#riverWater) #21494b"/><rect class="river-body-glow" x="0" y="-45" width="1440" height="895" style="fill:url(#riverReflection) #244448"/><rect width="1440" height="820" filter="url(#desktopWaterTexture)" opacity=".42"/></g>
          <g clip-path="url(#riverClipDesktop)">
          <path class="river-bank" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-edge" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-water" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-shadowline" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-reflection" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-bloom" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-core" fill="none" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <path class="river-current" fill="none" pathLength="100" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/><path class="river-flowline flowline-wide" fill="none" pathLength="1000" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/><path class="river-flowline flowline-mid" fill="none" pathLength="1000" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/><path class="river-flowline flowline-fine" fill="none" pathLength="1000" d="M 270 850 C 365 760 424 703 515 660 C 625 608 758 593 845 541 C 920 496 966 449 925 402 C 887 358 792 333 800 273 C 807 220 886 184 927 126 C 956 84 963 38 961 -45"/>
          <g class="river-ripples" fill="none" aria-hidden="true"><path d="M322 784q31 -12 53 -5"/><path d="M463 680q35 -14 60 -7"/><path d="M635 616q23 -11 55 -8"/><path d="M796 554q23 -8 47 -4"/><path d="M912 468q13 -13 30 -14"/><path d="M867 382q26 -2 41 5"/><path d="M774 274q13 -12 27 -12"/><path d="M896 138q19 -5 30 -3"/></g>
          </g>
          <g class="external-branches" clip-path="url(#riverClipDesktop)">${tributaries}</g>
          <g class="river-drifting-verses" aria-hidden="true">
            <text class="river-drift-text drift-a" x="840" y="240">胸藏星斗回光</text>
            <text class="river-drift-text drift-b" x="620" y="585">一叶扁舟入暮云</text>
          </g>
        </g>
        <g class="scene-points"><circle cx="514" cy="660" r="7"/><circle cx="514" cy="660" r="22" class="point-halo"/><circle cx="924" cy="402" r="4.5"/><circle cx="924" cy="402" r="17" class="point-halo"/><circle cx="927" cy="126" r="3.5"/><circle cx="927" cy="126" r="14" class="point-halo"/><circle class="river-glint glint-a" cx="650" cy="610" r="1.6"/><circle class="river-glint glint-b" cx="754" cy="578" r="1.2"/><circle class="river-glint glint-c" cx="896" cy="478" r="1.6"/><circle class="river-glint glint-d" cx="826" cy="326" r="1.2"/><circle class="river-glint glint-e" cx="875" cy="211" r="1.5"/><circle class="river-glint glint-f" cx="950" cy="72" r="1.1"/></g>
        <g class="scene-stars">${stars}</g>
      </svg>
      <svg class="scene-svg mobile-scene-art tablet-scene-art" viewBox="0 0 390 820" preserveAspectRatio="none">
        <defs><clipPath id="riverClipMobile">${mobileWaterShapes}</clipPath>
        ${mobileBranches.map(b=>`<linearGradient id="branchFade-${b.key}" gradientUnits="userSpaceOnUse" x1="${b.key==='photos'||b.key==='traces'?260:100}" y1="0" x2="${b.key==='photos'||b.key==='traces'?700:-330}" y2="0"><stop offset="0" stop-color="#b6b6b6"/><stop offset=".55" stop-color="#626262"/><stop offset="1" stop-color="#0c0c0c"/></linearGradient>`).join('')}
        <filter id="mobileBankSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter><mask id="mobileWaterMask" maskUnits="userSpaceOnUse" x="-300" y="0" width="990" height="820"><g>${mobileWaterMaskShapes}</g></mask><linearGradient id="mobileGround" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071722"/><stop offset=".55" stop-color="#102d35"/><stop offset="1" stop-color="#071923"/></linearGradient><linearGradient id="mobileWater" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#16343d"/><stop offset=".62" stop-color="#1c3b40"/><stop offset="1" stop-color="#8b9b80"/></linearGradient><linearGradient id="branchWaterMobile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#355e60"/><stop offset=".55" stop-color="#87977b"/><stop offset=".78" stop-color="#c5ae75"/><stop offset="1" stop-color="#476c68"/></linearGradient><mask id="riverMaskMobile" maskUnits="userSpaceOnUse" x="-300" y="0" width="990" height="820"><path class="river-reveal-trace river-main-trace mobile-main-trace" pathLength="100" d="M270 -40 C314 189 60 218 84 281 C112 364 302 367 300 416 C294 488 70 478 92 539 C118 620 275 629 254 691 C227 759 49 781 3 860" fill="none" stroke="white" stroke-width="138" stroke-linecap="round"/>${mobileBranchReveal}</mask><filter id="mobileBloom" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <defs><filter id="mobileWaterTexture" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".025 .12" numOctaves="2" seed="12"/><feColorMatrix type="matrix" values="0 0 0 0 .8  0 0 0 0 .77  0 0 0 0 .57  0 0 0 .22 0"/></filter></defs>
        <rect x="-300" width="990" height="820" fill="url(#mobileGround)"/><ellipse cx="300" cy="230" rx="240" ry="260" fill="#2b5b57" opacity=".16"/>
        <path class="terrain terrain-far" d="M-300 0H690V240C500 252 300 230 206 143S112 72 -300 88Z"/><path class="terrain terrain-left" d="M-300 0H160C139 76 180 134 230 175S280 250 230 300C155 326 72 306 -300 340Z"/><path class="terrain terrain-lower-left" d="M-300 465C85 424 150 449 190 500S235 602 158 671C111 713 52 772 -300 820Z"/><path class="terrain terrain-right" d="M305 0H690V820H284C340 730 350 662 307 612S242 522 300 454S345 365 287 317S258 224 310 160Z"/>
        <g class="terrain-contours" fill="none"><path d="M-30 118C70 85 132 111 176 163S220 230 275 235"/><path d="M-30 139C60 112 120 137 163 184S215 247 260 254"/><path d="M-30 515C62 469 127 493 166 545S174 640 98 698"/><path d="M-30 544C53 503 110 524 145 570S151 643 86 693"/></g>
        <g class="river-revealed mobile-river-revealed" mask="url(#riverMaskMobile)">
        <g mask="url(#mobileWaterMask)"><rect class="river-body" x="-300" width="990" height="820" style="fill:url(#mobileWater) #1c3b40"/><rect class="river-body-glow" x="-300" width="990" height="820" style="fill:#9bb9a4"/></g><g clip-path="url(#riverClipMobile)"><path class="river-bank" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-edge" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-water mobile-river-water" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-reflection" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-bloom" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-core" fill="none" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <path class="river-current" fill="none" pathLength="100" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/><path class="river-flowline flowline-wide" fill="none" pathLength="1000" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/><path class="river-flowline flowline-mid" fill="none" pathLength="1000" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/><path class="river-flowline flowline-fine" fill="none" pathLength="1000" d="M-40 850C30 766 232 756 250 680S70 612 91 540S322 480 300 410S70 350 96 280S300 210 267 -40"/>
        <g class="river-ripples" fill="none" aria-hidden="true"><path d="M81 780q24 -8 45 -5"/><path d="M199 684q28 -9 46 -2"/><path d="M87 544q27 -9 44 -3"/><path d="M266 415q19 -7 31 0"/><path d="M79 280q25 -5 41 0"/><path d="M238 134q18 -5 29 -1"/></g></g>
        <g class="external-branches" clip-path="url(#riverClipMobile)">${mobileTributaries}</g>
        </g>
        <g class="scene-points"><circle class="river-glint glint-a" cx="220" cy="704" r="1.4"/><circle class="river-glint glint-b" cx="128" cy="597" r="1.1"/><circle class="river-glint glint-c" cx="290" cy="431" r="1.3"/><circle class="river-glint glint-d" cx="102" cy="302" r="1.2"/><circle class="river-glint glint-e" cx="250" cy="151" r="1.1"/></g><g class="scene-stars">${mobileStars}</g>
      </svg>
      <div class="scene-vignette"></div><div class="scene-mist mist-one"></div><div class="scene-mist mist-two"></div>
    </div>
    <button class="motion-toggle" id="toggle-roaming" type="button" aria-label="暂停首页动画" aria-pressed="false" title="暂停首页动画"><span aria-hidden="true">Ⅱ</span></button>
    <div class="roaming-network">${nodes}</div>
  </section>
  </div>`;
}
function starfieldMarkup(kind='collection',count=190){
  const width=1440,height=kind==='darkroom'?1320:1780;
  const stars=Array.from({length:count},(_,i)=>{
    const x=(i*271.31+i*i*.173+47)%width;
    const y=(i*173.77+i*i*.071+31)%height;
    const bright=i%19===0||i%31===7;
    const r=bright?1.45+(i%3)*.35:(i%5===0?.9+(i%3)*.12:.35+(i%4)*.13);
    const tone=i%11===0?'warm':i%7===0?'blue':'white';
    const opacity=bright?.58+(i%4)*.09:.19+(i%6)*.065;
    const duration=(3.8+(i%9)*.71).toFixed(2);
    const delay=(-((i*1.37)%12)).toFixed(2);
    return '<circle class="sky-star '+(bright?'is-bright ':'')+'tone-'+tone+' '+(i%3===0?'twinkle':'')+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r.toFixed(2)+'" style="--star-opacity:'+opacity.toFixed(2)+';--star-peak:'+Math.min(1,opacity+.28).toFixed(2)+';--twinkle-duration:'+duration+'s;--twinkle-delay:'+delay+'s"/>';
  }).join('');
  const constellations=[
    'M 122 220 L 164 186 L 207 201 L 239 162',
    'M 1050 310 L 1093 279 L 1145 300 L 1184 259',
    'M 742 880 L 780 850 L 821 866 L 850 824',
    'M 300 1300 L 339 1273 L 378 1291 L 410 1252'
  ].map((d,i)=>'<path class="sky-constellation constellation-'+i+'" d="'+d+'"/>').join('');
  const crosses=[
    '<g class="sky-cross cross-a" transform="translate(239 162)"><path d="M-5 0H5M0-5V5"/></g>',
    '<g class="sky-cross cross-b" transform="translate(1184 259)"><path d="M-4 0H4M0-4V4"/></g>',
    '<g class="sky-cross cross-c" transform="translate(850 824)"><path d="M-5 0H5M0-5V5"/></g>'
  ].join('');
  return '<div class="stellar-sky stellar-sky-'+kind+'" aria-hidden="true"><svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none"><defs><radialGradient id="sky-nebula-'+kind+'"><stop offset="0" stop-color="#b7a16a" stop-opacity=".15"/><stop offset=".5" stop-color="#527d89" stop-opacity=".08"/><stop offset="1" stop-color="#0b1928" stop-opacity="0"/></radialGradient></defs><ellipse class="sky-nebula" cx="'+(kind==='darkroom'?740:850)+'" cy="'+(kind==='darkroom'?440:520)+'" rx="530" ry="370" fill="url(#sky-nebula-'+kind+')"/>'+constellations+stars+crosses+'</svg></div>';
}
function works(){
  const first=A.works[0];
  const themes=A.works.map((w,i)=>'<button type="button" class="cosmos-theme'+(i===0?' is-active':'')+'" data-theme="'+i+'" aria-pressed="'+(i===0)+'">'+esc(w.title)+'</button>').join('');
  return '<div class="cosmos-room"><div class="cosmos-heading wrap"><div><p>一片银河，几段记忆</p><h1>星空暗房</h1><span>每一座恒星系，都安放着一组可以靠近的影像。</span></div><small>3D 琉璃星盘与银河 · 悬浮探看 · 点击深入</small></div><section class="cosmos" aria-label="摄影星系"><div class="cosmos-themes" aria-label="选择相册星团">'+themes+'<button type="button" class="cosmos-theme cosmos-reset-btn" data-zoom="reset">↺ 银河全景</button></div><div class="cosmos-layout"><div class="cosmos-scene"><canvas class="cosmos-canvas" tabindex="0" aria-label="三维星系，拖动旋转；滚轮缩放；悬停查看恒星系，点击进入完整相册"></canvas><p class="cosmos-instructions"><span class="cosmos-hint-desktop">拖拽旋转星河 · 悬浮探看恒星系 · 点击星系展开影像 · ↺ 重置全景</span><span class="cosmos-hint-touch">单指旋转 · 双指缩放 · 轻触恒星系探看 · ↺ 返回全景</span></p><div class="cosmos-zoom"><button type="button" data-zoom="in" aria-label="放大星系">＋</button><button type="button" data-zoom="out" aria-label="缩小星系">−</button><button type="button" data-zoom="reset" aria-label="重置视角">↺</button></div><div id="cosmos-hover-card" class="cosmos-hover-card" aria-live="polite"><a class="cosmos-hover-link" href="#/works/'+esc(first.slug)+'"><div class="cosmos-hover-top"><div class="cosmos-hover-thumb"><img src="'+esc(A.images[first.photos[0]].variants[1].path)+'" alt=""></div><div class="cosmos-hover-meta"><span class="cosmos-hover-kicker">STELLAR SYSTEM 01</span><h2>'+esc(first.title)+'</h2></div></div><p class="cosmos-hover-desc">'+esc(first.intro)+'</p><div class="cosmos-hover-foot"><span>点击进入这组影像 ↗</span><small>'+first.photos.length+' 幅摄影</small></div></a></div><p class="cosmos-fallback" hidden>当前设备无法显示三维星系，可以使用上方按钮浏览影像。</p></div></div></section><p class="cosmos-end wrap">光会留下它经过的地方。</p></div>';
}
function bindCosmos(){
  const root=document.querySelector('.cosmos');
  const card=root.querySelector('#cosmos-hover-card');
  let currentTheme=0,disposed=false,stop=()=>{};
  const updateCard=idx=>{
    if(idx<0||idx>=A.works.length){
      card?.classList.remove('is-visible');
      return;
    }
    currentTheme=idx;
    const w=A.works[idx],im=A.images[w.photos[0]];
    if(card){
      card.querySelector('.cosmos-hover-link').href='#/works/'+w.slug;
      const img=card.querySelector('.cosmos-hover-thumb img');
      if(img){img.src=im.variants[1].path;img.alt=esc(im.alt);}
      card.querySelector('.cosmos-hover-kicker').textContent='STELLAR SYSTEM 0'+(idx+1);
      card.querySelector('.cosmos-hover-meta h2').textContent=w.title;
      card.querySelector('.cosmos-hover-desc').textContent=w.intro;
      card.querySelector('.cosmos-hover-foot small').textContent=w.photos.length+' 幅摄影';
      card.classList.add('is-visible');
    }
    root.querySelectorAll('[data-theme]').forEach((el,i)=>el.classList.toggle('is-active',i===idx));
  };
  root.addEventListener('cosmos-hover',e=>updateCard(e.detail.index));
  root.addEventListener('click',e=>{
    const tab=e.target.closest('[data-theme]');
    if(tab){
      const idx=Number(tab.dataset.theme);
      root.dispatchEvent(new CustomEvent('cosmos-focus',{detail:{index:idx,openGallery:false}}));
    }
  });
  import('./galaxy3d.js').then(m=>{if(!disposed)stop=m.mountGalaxy(root,A);}).catch(error=>{console.error('星系加载失败',error);root.querySelector('.cosmos-fallback').hidden=false;});
  return ()=>{disposed=true;stop();};
}
function workPage(w){
  currentWork=w;photoIndex=0;
  const k=A.works.indexOf(w),prev=A.works[(k+A.works.length-1)%A.works.length],next=A.works[(k+1)%A.works.length];
  return '<article class="darkroom exhibition">'+starfieldMarkup('darkroom',165)+'<div class="wrap"><header class="exhibition-heading"><a class="back-link" href="#/works">← 摄影集</a><div><span class="eyebrow">'+esc(w.id)+' / DARKROOM</span><h1>'+esc(w.title)+'</h1></div><details class="exhibition-note"><summary>关于这组影像'+(w.demo!==false?' / 演示选读':'')+'</summary><p>'+esc(w.intro)+'</p><p>'+esc(w.medium)+' / '+esc(w.year)+'</p><p>'+(w.demo!==false?'图库演示，非所有者作品。':'摄影记录。')+'</p></details></header><div class="gallery-frame"><button class="photo-stage" id="open-viewer" aria-label="放大浏览当前照片">'+photo(w.photos[0],true,'stage')+'<span>放大观看 ↗</span></button></div><div class="gallery-controls"><button id="prev" disabled>← 上一张</button><span id="gallery-count" aria-live="polite">01 / '+String(w.photos.length).padStart(2,'0')+'</span><button id="next">下一张 →</button></div><p class="gallery-caption" id="gallery-caption">'+esc(w.captions[0])+'</p><p class="photo-credit" id="photo-credit"></p><details class="contact-sheet"><summary>底片索引 / '+w.photos.length+' 帧</summary><div class="thumbs" aria-label="选择照片">'+w.photos.map((p,i)=>'<button data-photo="'+i+'" aria-label="第 '+(i+1)+' 张：'+esc(A.images[p].alt)+'" aria-pressed="'+(i===0)+'">'+photo(p,false,'thumb')+'</button>').join('')+'</div></details><p class="gallery-help">← → 切换 / 聚焦照片后 Enter 放大 / Esc 返回</p><div class="work-pagination"><a href="#/works/'+prev.slug+'"><small>← 上一间 / '+esc(prev.id)+'</small>'+esc(prev.title)+'</a><a href="#/works/'+next.slug+'"><small>下一间 / '+esc(next.id)+' →</small>'+esc(next.title)+'</a></div></div></article>';
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
function poemVignette(n){
  const text=(n.title||'')+'\n'+(n.body||[]).join('\n');
  if(/梧桐|叶脉|秋叶|枫/.test(text)){
    return '<div class="poem-vignette vignette-leaf" aria-hidden="true" title="梧桐叶脉"><svg viewBox="0 0 120 120" fill="none"><path d="M22 98 C45 75 72 48 96 20" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/><path d="M36 82 C26 62 24 44 34 26 C48 33 56 30 68 18 C72 34 82 38 96 20 C88 42 92 52 104 64 C86 68 76 76 68 92 C54 84 44 84 36 82 Z" stroke="currentColor" stroke-width=".95" stroke-linejoin="round" opacity=".78"/><path d="M52 68 L35 50 M65 55 L48 35 M58 62 L80 57 M72 47 L92 43" stroke="currentColor" stroke-width=".75" stroke-linecap="round" opacity=".58"/></svg></div>';
  }
  if(/猫|萨摩耶/.test(text)){
    return '<div class="poem-vignette vignette-cat" aria-hidden="true" title="眠猫小印"><svg viewBox="0 0 120 120" fill="none"><path d="M30 78 C28 56 46 44 68 48 C84 50 94 62 92 76 C90 86 76 90 54 90 C36 90 22 84 22 76 C22 70 28 67 35 68" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M35 55 L32 42 L43 49 M52 48 L56 38 L61 48" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><path d="M38 64 Q42 67 46 64 M53 64 Q57 67 61 64" stroke="currentColor" stroke-width=".9" stroke-linecap="round"/><path d="M88 78 C98 78 104 71 101 63 C99 57 93 59 94 64" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg></div>';
  }
  if(/舟|帆|江|渡|海|波|溪/.test(text)){
    return '<div class="poem-vignette vignette-boat" aria-hidden="true" title="一叶轻舟"><svg viewBox="0 0 120 120" fill="none"><path d="M18 74 Q60 86 104 68 Q82 88 46 88 Q26 87 18 74 Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M44 76 Q58 62 74 73" stroke="currentColor" stroke-width=".95" opacity=".75"/><path d="M68 74 L96 56" stroke="currentColor" stroke-width=".85" stroke-linecap="round"/><path d="M14 96 Q42 91 70 96 T108 94" stroke="currentColor" stroke-width=".75" stroke-dasharray="3 5" opacity=".55"/></svg></div>';
  }
  return '<div class="poem-vignette vignette-moon" aria-hidden="true" title="星月印记"><svg viewBox="0 0 120 120" fill="none"><path d="M72 26 A30 30 0 1 0 94 74 A25 25 0 1 1 72 26 Z" stroke="currentColor" stroke-width="1.05"/><path d="M34 42 L34 50 M30 46 L38 46 M84 34 L84 40 M81 37 L87 37" stroke="currentColor" stroke-width=".8" stroke-linecap="round" opacity=".65"/><path d="M22 86 Q56 78 96 86" stroke="currentColor" stroke-width=".75" stroke-dasharray="2 6" opacity=".5"/></svg></div>';
}
function getSealState(slug){
  try{const map=JSON.parse(localStorage.getItem('qz_poem_seals')||'{}');return !!map[slug];}catch{return false;}
}
function toggleSealState(slug){
  try{const map=JSON.parse(localStorage.getItem('qz_poem_seals')||'{}');map[slug]=!map[slug];localStorage.setItem('qz_poem_seals',JSON.stringify(map));return !!map[slug];}catch{return true;}
}
function bookPage(n){
  const paragraphs=n.body.map(p=>'<p>'+esc(p)+'</p>').join('');
  const sealed=getSealState(n.slug);
  const placeTag=n.place?' · 写于'+esc(n.place):'';
  return '<div class="book-poem-wrap"><div class="book-poem-header"><span class="book-leaf-meta">'+esc(n.category)+' / '+esc(n.genre)+placeTag+'</span><h2>'+esc(n.title)+'</h2><span class="book-date">'+esc(n.date||'')+'</span></div><div class="book-poem-body">'+paragraphs+'</div>'+poemVignette(n)+'<div class="book-poem-actions"><a class="book-permalink" href="#/notes/'+esc(n.slug)+'">单独打开这首诗 ↗</a><button type="button" class="poem-seal-btn '+(sealed?'is-sealed':'')+'" data-seal-slug="'+esc(n.slug)+'" aria-pressed="'+sealed+'"><span class="seal-mark" aria-hidden="true">清舟</span><span class="seal-text">'+(sealed?'已落朱砂印 · 留存共鸣':'落一枚朱砂 · 记下停驻')+'</span></button></div></div>';
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
  return '<div class="wrap poetry-room poetry-room-v09"><header class="poetry-heading"><span class="poetry-overline">诗的房间</span><h1>翻开一页，读一首诗。</h1></header><section class="book-library" aria-label="可翻阅的诗集"><div class="book-toolbar"><div class="poetry-switch" role="group" aria-label="诗歌分类方式"><button type="button" data-poetry-mode="series" aria-pressed="true">按诗集</button><button type="button" data-poetry-mode="genre" aria-pressed="false">按体裁</button></div><span class="book-count">'+A.notes.length+' 首作品</span></div><div class="book-cover-row" id="book-volumes" aria-label="选择诗集"></div><div class="book-handhint">选择目录中的诗，手机上还可以左右滑动切换作品。</div><div class="book-open" id="reading-book"><section class="book-sheet book-left" aria-label="诗集目录"><div id="book-toc"></div><p class="book-footnote">清舟的诗歌 · 逐页复核稿</p></section><section class="book-sheet book-right" aria-label="当前诗歌"><button class="book-back" id="book-back" type="button">← 返回目录</button><div id="book-current"></div><div class="book-page-controls"><button type="button" id="book-prev">← 上一首</button><span id="book-page-count">1 / 1</span><button type="button" id="book-next">下一首 →</button></div></section></div>'+(note?'<details class="poetry-source-details"><summary>关于《墨檐》的缺篇说明</summary><p>'+esc(note)+'</p></details>':'')+'</section></div>';
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
    if(e.target.closest('#book-next')){bookState.index=Math.min(bookEntries().length-1,bookState.index+1);bookState.view='poem';renderBook();document.querySelector('#book-next')?.focus();return;}
    const sealBtn=e.target.closest('[data-seal-slug]');if(sealBtn){const on=toggleSealState(sealBtn.dataset.sealSlug);sealBtn.classList.toggle('is-sealed',on);sealBtn.setAttribute('aria-pressed',String(on));const txt=sealBtn.querySelector('.seal-text');if(txt)txt.textContent=on?'已落朱砂印 · 留存共鸣':'落一枚朱砂 · 记下停驻';}
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
  const sealed=getSealState(n.slug);
  const sealCount=getPoemSealCount(n.slug);
  const placeTag=n.place?' · 写于'+esc(n.place):'';
  const annos=getPoemAnnotations(n.slug);
  const isVertical=localStorage.getItem('qz_poetry_direction')==='vertical';
  return '<div class="wrap"><article class="article poetry-reading '+(isVertical?'is-vertical ':'')+(n.poem?'poem':'')+'" data-poem-slug="'+esc(n.slug)+'"><div class="paperweight-bar" aria-hidden="true"><span class="weight-label">清舟笺谱</span></div><div class="poem-read-toolbar"><a class="quiet-link" href="#/notes">← 回到诗集</a><div class="read-mode-btns"><button type="button" class="dir-toggle-btn" id="toggle-poem-dir" aria-label="切换排版方向"><span class="dir-icon" aria-hidden="true">'+(isVertical?'＝':'‖')+'</span><span class="dir-text">'+(isVertical?'切为横排':'古笺竖排')+'</span></button></div></div><div class="poetry-paper-inner"><div class="reading-marker"><span>'+String(i+1).padStart(2,'0')+' / '+esc(n.category)+' · '+esc(n.genre||'未分类')+placeTag+'</span><span>'+(n.demo!==false?'演示文字':'逐页复核稿')+'</span></div><h1>'+esc(n.title)+'</h1>'+(n.en?'<p class="lead">'+esc(n.en)+'</p>':'')+'<div class="body book-poem-wrap">'+n.body.map(p=>'<p>'+esc(p)+'</p>').join('')+poemVignette(n)+'</div><div class="book-poem-actions"><p class="reading-colophon">'+(n.demo!==false?'此页为原型创作样例，尚非所有者真实作品。':esc((n.sourceMeta||[]).join(' / ')||'来源：诗歌电子稿逐页复核版'))+'</p><button class="poem-seal-btn '+(sealed?'is-sealed':'')+'" type="button" data-seal-slug="'+esc(n.slug)+'" aria-pressed="'+sealed+'"><span class="seal-mark" aria-hidden="true">清舟</span><span class="seal-text">'+(sealed?'已落朱砂印 · 留存共鸣':'落一枚朱砂 · 记下停驻')+'</span><span class="seal-count-badge">'+sealCount+' 人落印</span></button></div><details class="poem-annotations"><summary><span class="anno-icon">✎</span> 诗笺批注与旅人共鸣 (<span id="poem-anno-count">'+annos.length+'</span>)</summary><div class="anno-box" id="poem-anno-list">'+(annos.length?annos.map(a=>'<div class="anno-card"><div class="anno-head"><strong>'+esc(a.name)+'</strong><small>'+(a.place?'写于 '+esc(a.place)+' · ':'')+esc(a.date)+'</small></div><p>'+esc(a.text)+'</p></div>').join(''):'<p class="anno-empty">这一页尚无夹笺，写下第一句心绪吧。</p>')+'</div><form class="anno-form" id="poem-anno-form"><div class="anno-form-row"><input type="text" id="anno-name" class="anno-input" placeholder="称呼（如：山行客）" maxlength="16" required><input type="text" id="anno-place" class="anno-input" placeholder="来自何处（选填）" maxlength="16"></div><textarea id="anno-text" class="anno-textarea" placeholder="写下一句读这首诗的心绪或批注..." required rows="2" maxlength="140"></textarea><button type="submit" class="anno-submit-btn"><span class="btn-seal">清舟</span> 夹入此页</button></form></details></div><div class="article-nav"><a href="#/notes/'+prev.slug+'">← '+esc(prev.title)+'</a><a href="#/notes/'+next.slug+'">'+esc(next.title)+' →</a></div></article></div>';
}
function bindArticle(slug){
  const art=document.querySelector('.article.poetry-reading');
  if(!art)return()=>{};
  const toggleBtn=art.querySelector('#toggle-poem-dir');
  const onToggleDir=()=>{
    const vert=!art.classList.contains('is-vertical');
    art.classList.toggle('is-vertical',vert);
    localStorage.setItem('qz_poetry_direction',vert?'vertical':'horizontal');
    const icon=toggleBtn.querySelector('.dir-icon');
    const txt=toggleBtn.querySelector('.dir-text');
    if(icon)icon.textContent=vert?'＝':'‖';
    if(txt)txt.textContent=vert?'切为横排':'古笺竖排';
  };
  toggleBtn?.addEventListener('click',onToggleDir);

  const sealBtn=art.querySelector('[data-seal-slug]');
  const onSeal=()=>{
    const on=toggleSealState(slug);
    const newCount=recordPoemSeal(slug);
    sealBtn.classList.toggle('is-sealed',on);
    sealBtn.setAttribute('aria-pressed',String(on));
    const txt=sealBtn.querySelector('.seal-text');
    if(txt)txt.textContent=on?'已落朱砂印 · 留存共鸣':'落一枚朱砂 · 记下停驻';
    const badge=sealBtn.querySelector('.seal-count-badge');
    if(badge)badge.textContent=newCount+' 人落印';
  };
  sealBtn?.addEventListener('click',onSeal);

  const form=art.querySelector('#poem-anno-form');
  const onAddAnno=e=>{
    e.preventDefault();
    const name=art.querySelector('#anno-name').value.trim()||'行客';
    const place=art.querySelector('#anno-place').value.trim()||'';
    const text=art.querySelector('#anno-text').value.trim();
    if(!text)return;
    const now=new Date();
    const date=now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0');
    addPoemAnnotation(slug,{name,place,text,date});
    const list=getPoemAnnotations(slug);
    const listEl=art.querySelector('#poem-anno-list');
    if(listEl){
      listEl.innerHTML=list.map(a=>'<div class="anno-card"><div class="anno-head"><strong>'+esc(a.name)+'</strong><small>'+(a.place?'写于 '+esc(a.place)+' · ':'')+esc(a.date)+'</small></div><p>'+esc(a.text)+'</p></div>').join('');
    }
    const countEl=art.querySelector('#poem-anno-count');
    if(countEl)countEl.textContent=list.length;
    form.reset();
  };
  form?.addEventListener('submit',onAddAnno);

  return ()=>{
    toggleBtn?.removeEventListener('click',onToggleDir);
    sealBtn?.removeEventListener('click',onSeal);
    form?.removeEventListener('submit',onAddAnno);
  };
}
function labDiagram(slug){
  if(slug==='rongrong'){
    return '<svg class="lab-blueprint" viewBox="0 0 220 118" fill="none" aria-hidden="true"><circle cx="110" cy="56" r="28" stroke="currentColor" stroke-width=".9" stroke-dasharray="3 4" opacity=".6"/><circle cx="110" cy="56" r="14" stroke="currentColor" stroke-width="1.15"/><circle cx="110" cy="56" r="3.2" fill="currentColor"/><path d="M28 56 C58 30 78 42 96 51 M124 61 C142 70 162 80 192 56" stroke="currentColor" stroke-width=".9" opacity=".75"/><circle cx="52" cy="43" r="2.2" fill="currentColor" opacity=".75"/><circle cx="168" cy="67" r="2.2" fill="currentColor" opacity=".75"/><text x="16" y="106" fill="currentColor" font-size="8.5" letter-spacing="1.6" opacity=".6">FIG.01 / DIALOGUE & MEMORY KERNEL</text></svg>';
  }
  if(slug==='machine-herbarium'){
    return '<svg class="lab-blueprint" viewBox="0 0 220 118" fill="none" aria-hidden="true"><path d="M110 92 L110 20 M110 68 L82 48 M110 54 L138 35 M110 38 L88 24" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/><ellipse cx="77" cy="44" rx="11" ry="5.5" transform="rotate(-28 77 44)" stroke="currentColor" stroke-width=".95"/><ellipse cx="143" cy="32" rx="11" ry="5.5" transform="rotate(28 143 32)" stroke="currentColor" stroke-width=".95"/><rect x="52" y="14" width="116" height="72" stroke="currentColor" stroke-width=".7" stroke-dasharray="2 4" opacity=".5"/><text x="16" y="106" fill="currentColor" font-size="8.5" letter-spacing="1.6" opacity=".6">FIG.02 / SPECULATIVE HERBARIUM</text></svg>';
  }
  return '<svg class="lab-blueprint" viewBox="0 0 220 118" fill="none" aria-hidden="true"><path d="M26 72 Q72 32 116 58 T194 40" stroke="currentColor" stroke-width="1.15"/><path d="M26 84 Q80 48 126 70 T194 56" stroke="currentColor" stroke-width=".8" stroke-dasharray="3 4" opacity=".65"/><circle cx="68" cy="51" r="3.2" stroke="currentColor" stroke-width="1"/><circle cx="144" cy="63" r="3.2" stroke="currentColor" stroke-width="1"/><path d="M68 47 L68 26 M144 59 L144 36" stroke="currentColor" stroke-width=".75" opacity=".6"/><text x="16" y="106" fill="currentColor" font-size="8.5" letter-spacing="1.6" opacity=".6">FIG.03 / SENSORY TOPOGRAPHY</text></svg>';
}
function lab(){
 return '<div class="wrap personal-lab" id="lab-desk"><div class="lab-lamp-glow" aria-hidden="true"></div><header class="room-heading"><span class="eyebrow">NIGHT DESK / 04</span><h1>还亮着的实验桌</h1><p>夜深时留一盏暖灯，把还未定型的念头、草图与机器实验摊在桌面上。</p></header><div class="lab-workbench" aria-label="实验项目手札">'+A.labs.map((l,idx)=>'<a class="lab-card" href="#/lab/'+esc(l.slug)+'"><div class="lab-card-top"><span class="lab-card-id">'+esc(l.id||('L—00'+(idx+1)))+' · '+esc(l.kind||'CONCEPT')+'</span><span class="lab-card-status">○ '+esc(l.status)+'</span></div><div class="lab-card-diagram">'+labDiagram(l.slug)+'</div><div class="lab-card-body"><h2>'+esc(l.title)+'</h2><small>'+esc(l.en||'')+'</small><p>'+esc(l.intro||'')+'</p></div><span class="lab-card-enter">翻阅实验手札 ↗</span></a>').join('')+'</div></div>';
}
const HERBARIUM_SAMPLES=[
  {tag:'雨后青苔',latin:'Bryophyta · Noctis Imber',place:'旧墙隅与石阶阴面',note:'机器识别为「高湿度地表附生绿斑（置信度 0.91）」；人却记住了雨停后空气里微苦的泥土腥气，和一整个缓慢下来的下午。',verse:'阶前不语承残滴，替旧墙根记岁年。'},
  {tag:'九月梧桐',latin:'Platanus · Autumnus Mensura',place:'秋风初起的街角',note:'机器提取出「掌状裂叶、边缘锯齿、褐化率 64%」；人拾起它蜷曲的叶脉，觉得那是一把丈量过彤云与远星的旧罗盘。',verse:'叶脉如尺量秋色，留得晴空一寸光。'},
  {tag:'晚霞与桂子',latin:'Osmanthus · Vespera Aura',place:'暮色将合的江岸小城',note:'机器将气味分子归入「芳樟醇与紫罗兰酮簇」；人却在晚风里听见了客家乡音与采茶回响。',verse:'金粟微茫随水远，半城暮色半城香。'},
  {tag:'山谷雾松',latin:'Pinus · Nebula Montis',place:'高海拔寒林与乱石间',note:'机器标注为「针叶林冠层低能见度样本」；人在雾海与铁索旁停下脚步，觉得树与树之间的空白才是最好的停留处。',verse:'雾锁寒松千嶂静，人行云外第几峰。'}
];
function projectDetail(l){
  const stages=l.stages||[{label:'当前状态',text:l.status},{label:'记录',text:l.record}];
  const interactive=l.slug==='machine-herbarium'?
    '<section class="lab-interactive-box" aria-label="机器植物志·概念标本台"><div class="eyebrow"><span class="red">INTERACTIVE PROTOTYPE</span> &nbsp; / &nbsp; 机器命名 vs 人的记忆</div><h2>采集一枚概念标本</h2><p class="lab-proto-desc">选择一处日常观察片段，看看「算法特征提取」与「人的诗意命名」在同一张标本卡上的对照：</p><div class="herb-pills" role="group" aria-label="选择观察样本">'+HERBARIUM_SAMPLES.map((s,i)=>'<button type="button" class="herb-pill" data-herb="'+i+'" aria-pressed="'+(i===0)+'">'+esc(s.tag)+'</button>').join('')+'</div><div class="herb-card" id="herb-card"><div class="herb-card-head"><span id="herb-latin">'+esc(HERBARIUM_SAMPLES[0].latin)+'</span><small id="herb-place">'+esc(HERBARIUM_SAMPLES[0].place)+'</small></div><p id="herb-note">'+esc(HERBARIUM_SAMPLES[0].note)+'</p><blockquote id="herb-verse">'+esc(HERBARIUM_SAMPLES[0].verse)+'</blockquote></div></section>':'';
  return '<div class="wrap project-reading" id="lab-desk"><div class="lab-lamp-glow" aria-hidden="true"></div><a class="quiet-link" href="#/lab">← 回到实验桌</a><header class="room-heading">'+eyebrow(l.id,'PROJECT DOSSIER')+'<h1>'+esc(l.title)+'</h1><p>'+esc(l.en)+'</p><span class="project-status">○ '+esc(l.status)+'</span></header><div class="project-reading-grid"><section><h2>一开始的念头</h2><p>'+esc(l.inspiration||l.intro)+'</p><h2>还想继续问的</h2><ul>'+(l.questions||['这个想法想留下什么？','下一次尝试，需要怎样的观察？']).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></section><section><h2>留在桌上的记录</h2><ol class="project-stages">'+stages.map(s=>'<li><span>'+esc(s.label)+'</span><p>'+esc(s.text)+'</p></li>').join('')+'</ol><p class="project-boundary">这里呈现档案与演示状态，不构成已发布产品或已完成科研成果的声明。</p></section></div>'+interactive+'</div>';
}
function bindLabDesk(){
  const desk=document.querySelector('#lab-desk');if(!desk)return()=>{};
  const move=e=>{const r=desk.getBoundingClientRect();desk.style.setProperty('--lamp-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');desk.style.setProperty('--lamp-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');};
  const click=e=>{const b=e.target.closest('[data-herb]');if(!b)return;const idx=Number(b.dataset.herb),sample=HERBARIUM_SAMPLES[idx];if(!sample)return;desk.querySelectorAll('[data-herb]').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===idx)));document.querySelector('#herb-latin').textContent=sample.latin;document.querySelector('#herb-place').textContent=sample.place;document.querySelector('#herb-note').textContent=sample.note;document.querySelector('#herb-verse').textContent=sample.verse;};
  desk.addEventListener('pointermove',move);desk.addEventListener('click',click);
  return()=>{desk.removeEventListener('pointermove',move);desk.removeEventListener('click',click);};
}

function about(){return `<div class="wrap">${title('05','ABOUT','关于这间小店','世界的边缘，往往藏在日常的细节里。')}<div class="about-layout"><div>${eyebrow('A PERSONAL MANIFESTO','小店的自述')}<h2>我想保留的，<br>是看向世界的方式。</h2><p>这里是一个安放注意力的小地方。用诗歌留下没说完的话，用摄影留下光，再把实验和日常的碎片，慢慢收进来。</p><p>在这里，事物可以不被立即归类。一个下午的光，可以成为一组照片；一个无法回答的问题，可以长成一篇手记；一次偶然的尝试，也可以留下自己的位置。</p><p>希望每次回到这里，都能发现：世界依然辽阔，而观察尚未结束。</p><div class="demo-note">以上为网站概念文案。所有者的真实姓名、个人简介与经历尚待填写。</div></div><aside class="about-sidebar">${eyebrow('OPEN ENDED','保持开放')}<dl><dt>关注的方向 / INTERESTS</dt><dd>诗歌与日常观察<br>影像与叙事<br>AI、交互与生活碎片</dd><dt>关于作者 / THE PERSON</dt><dd>个人介绍，待续。</dd><dt>联系 / CONTACT</dt><dd>联系方式与社交账号<br>将在所有者提供后加入。</dd><dt>当前版本 / EDITION</dt><dd>Vol. 001 / v1.1.1 · 本地预览<br>诗歌来自所有者稿件，影像与足迹等待真实内容</dd></dl></aside></div></div>`}

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
  return `<section class="china-footprints"><div class="wrap china-wrap">
    <header class="china-intro"><span class="eyebrow">TRACES / PLACES I KEEP</span><h1>走过的地方</h1><p>每一盏微光，都来自真实走过的城市；山脉与长河之间，留着写诗的坐标。</p></header>
    <div class="china-layout">
      <div class="china-map-stage">
        <div class="china-map-caption"><span>中国 · 山河足迹舆图</span><span>22 PLACES / RIVERS, MOUNTAINS & POEMS</span></div>
        <svg class="china-map" id="china-footprint-map" viewBox="0 0 930 650" role="group" aria-label="中国山河足迹地图，标记二十二处到访城市与山河水系">
          <defs>
            <linearGradient id="chinaLandFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#254943"/><stop offset=".52" stop-color="#183a37"/><stop offset="1" stop-color="#102a2c"/></linearGradient>
            <linearGradient id="chinaLandEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8da98a"/><stop offset=".55" stop-color="#d0bd83"/><stop offset="1" stop-color="#6f9a8a"/></linearGradient>
            <linearGradient id="chinaRiverStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7ebbb2" stop-opacity=".28"/><stop offset=".5" stop-color="#b9d8c9" stop-opacity=".62"/><stop offset="1" stop-color="#e8d59e" stop-opacity=".78"/></linearGradient>
            <radialGradient id="chinaCityGlow"><stop offset="0" stop-color="#ffe7a2" stop-opacity=".9"/><stop offset=".28" stop-color="#f1ca78" stop-opacity=".35"/><stop offset="1" stop-color="#f1ca78" stop-opacity="0"/></radialGradient>
            <filter id="chinaSoftGlow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
            <clipPath id="china-land-clip"><path id="china-clip-shape" d=""/></clipPath>
          </defs>
          <g class="china-grid" aria-hidden="true"><path d="M30 160 Q465 80 900 160 M20 300 Q465 235 910 300 M25 440 Q465 375 905 440 M70 570 Q465 515 860 570"/><path d="M220 25 Q180 320 220 620 M400 20 Q385 320 400 630 M580 20 Q595 320 580 630 M760 25 Q800 320 760 620"/></g>
          <g class="china-map-plane" transform="matrix(.94 -.08 .10 .74 -5 105)">
          <path class="china-land-shadow" d="" aria-hidden="true"/>
          <g class="china-land-depth" aria-hidden="true"></g>
          <path class="china-land" id="china-mainland" d=""/>
          <path class="china-island" id="china-hainan" d=""/>
          <path class="china-island" id="china-taiwan" d=""/>
          <g class="china-topography" id="china-topography" clip-path="url(#china-land-clip)" aria-hidden="true"></g>
          <g class="china-network" id="china-network" aria-hidden="true"></g>
          <g class="china-city-points" id="china-city-points"></g>
          </g>
        </svg>
        <div class="china-nearby" id="china-nearby" role="group" aria-label="选择附近城市" aria-live="polite" hidden></div>
        <p class="china-map-note">底纹绘出长江、黄河、西江·郁江三大水系与秦岭、横断、武陵、南岭、太行山脉；标有 ✦ 的四座地点（上海、玉林、苏州、华阴）收录了写于当地的 30 首诗篇。</p>
      </div>
      <aside class="china-story">
        <span class="china-count">PLACES / 22 · POEMS / 30</span><h2 id="china-selected-title">去过的地方</h2>
        <p id="china-selected-description">点亮的城市，来自我真实走过的路。选择一座城市，查看它的山河水文位置与写于当地的诗稿。</p>
        <div id="china-poem-slot" class="china-poem-slot" hidden></div>
        <p class="china-disclaimer">城市位置与山河水系按公开地理数据近似投影。诗歌创作地点依逐页复核稿精确归档。</p>
        <div class="china-city-list" id="china-city-list" aria-label="按城市选择足迹"></div>
      </aside>
    </div>
    <p class="china-footer">路过的地方，慢慢变成自己的地图。</p>
  </div></section>`;
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

// --- 檐下留言簿页面 ---
function guestbook(){
  const notes=getGuestbookNotes();
  return '<div class="wrap guestbook-room"><header class="room-heading"><span class="eyebrow">GUESTBOOK / 06</span><h1>檐下留言簿</h1><p>夜深时留一盏暖灯，在屋檐下挂一枚木牌，留下一行字迹与行客的名字。</p></header><div class="guestbook-stage"><section class="guestbook-composer"><div class="composer-lamp" aria-hidden="true"></div><h2>挂一枚木牌 / 留一纸心意</h2><p class="composer-intro">选一枚心仪的印记，写下你在此刻的停驻：</p><form id="guestbook-form" class="guestbook-form"><div class="seal-picker" role="radiogroup" aria-label="挑选印记"><label class="seal-opt"><input type="radio" name="seal" value="舟" checked><span>舟 · 孤舟</span></label><label class="seal-opt"><input type="radio" name="seal" value="星"><span>星 · 星河</span></label><label class="seal-opt"><input type="radio" name="seal" value="松"><span>松 · 松针</span></label><label class="seal-opt"><input type="radio" name="seal" value="猫"><span>猫 · 眠猫</span></label><label class="seal-opt"><input type="radio" name="seal" value="叶"><span>叶 · 秋叶</span></label></div><div class="form-row"><input type="text" id="gb-name" placeholder="你的称谓（如：山行客）" maxlength="16" required><input type="text" id="gb-place" placeholder="来自何处（如：江南 / 杭州）" maxlength="16"></div><textarea id="gb-content" placeholder="写下你想对小店说的话，或读诗看画的心绪..." required rows="3" maxlength="240"></textarea><button type="submit" class="gb-submit-btn"><span class="btn-seal">清舟</span> 挂上屋檐</button></form></section><section class="guestbook-eaves" aria-label="檐下挂牌"><div class="eaves-beam" aria-hidden="true"><span class="beam-glow"></span></div><div class="eaves-plaques" id="eaves-plaques">'+notes.map((note,idx)=>'<div class="eaves-card plaque-seal-'+esc(note.seal)+'"><div class="plaque-string" aria-hidden="true"></div><div class="plaque-inner"><div class="plaque-top"><span class="plaque-seal-mark">'+esc(note.seal)+'</span><strong class="plaque-name">'+esc(note.name)+'</strong><small class="plaque-place">'+(note.place?'写于 '+esc(note.place):'')+'</small></div><p class="plaque-text">'+esc(note.text)+'</p><div class="plaque-foot"><span class="plaque-date">'+esc(note.date)+'</span><span class="plaque-num">#'+(idx+1)+'</span></div></div></div>').join('')+'</div></section></div></div>';
}
function bindGuestbook(){
  const form=document.querySelector('#guestbook-form');
  const plaques=document.querySelector('#eaves-plaques');
  if(!form||!plaques)return()=>{};
  const onSubmit=e=>{
    e.preventDefault();
    const sealEl=form.querySelector('input[name="seal"]:checked');
    const seal=sealEl?sealEl.value:'舟';
    const name=document.querySelector('#gb-name').value.trim()||'过路客';
    const place=document.querySelector('#gb-place').value.trim()||'';
    const text=document.querySelector('#gb-content').value.trim();
    if(!text)return;
    const now=new Date();
    const date=now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0');
    const newNote={id:'gb-'+Date.now(),name,place,seal,date,text};
    addGuestbookNote(newNote);
    const card=document.createElement('div');
    card.className='eaves-card plaque-seal-'+seal+' is-new';
    card.innerHTML='<div class="plaque-string" aria-hidden="true"></div><div class="plaque-inner"><div class="plaque-top"><span class="plaque-seal-mark">'+esc(seal)+'</span><strong class="plaque-name">'+esc(name)+'</strong><small class="plaque-place">'+(place?'写于 '+esc(place):'')+'</small></div><p class="plaque-text">'+esc(text)+'</p><div class="plaque-foot"><span class="plaque-date">'+esc(date)+'</span><span class="plaque-num">刚刚</span></div></div>';
    plaques.insertBefore(card,plaques.firstChild);
    form.reset();
    card.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  form.addEventListener('submit',onSubmit);
  return ()=>{form.removeEventListener('submit',onSubmit);};
}

let roamingPaused=false;
let roamingIntroComplete=false;
function bindRoaming(){
  const area=document.querySelector('#rooms'),button=document.querySelector('#toggle-roaming');

  // Keep the portrait illustration's proportions while giving tablets wider banks.
  const portraitScene=area.querySelector('.mobile-scene-art');
  const sizePortrait=()=>{
    const width=area.clientWidth;
    const portrait=matchMedia('(orientation: portrait)').matches;
    const frame=portrait&&width<=900 ? Math.max(390,width) : 390;
    portraitScene.setAttribute('viewBox',`${(390-frame)/2} 0 ${frame} 820`);
  };
  sizePortrait();
  window.addEventListener('resize',sizePortrait);

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
    if(paused&&!introDone){roamingIntroComplete=true;introDone=true;area.dataset.intro='complete';}
    if(visible&&!document.hidden&&!introDone&&area.dataset.intro==='pending') area.dataset.intro='playing';
  };
  const onComplete=e=>{
    if(!['river-reveal-v08','river-mobile-arrival','river-progressive-reveal'].includes(e.animationName)||disposed)return;
    roamingIntroComplete=true;introDone=true;area.dataset.intro='complete';
  };
  let lastRip=0;
  const onPointerRipple=e=>{
    if(area.dataset.running!=='true')return;
    const now=Date.now();
    if(now-lastRip<140)return;
    lastRip=now;
    const r=area.getBoundingClientRect();
    const rip=document.createElement('span');
    rip.className='water-ripple-particle';
    rip.style.left=(e.clientX-r.left)+'px';
    rip.style.top=(e.clientY-r.top)+'px';
    area.appendChild(rip);
    rip.addEventListener('animationend',()=>rip.remove());
  };
  area.addEventListener('pointermove',onPointerRipple,{passive:true});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05});
  observer.observe(area);
  const onToggle=()=>{roamingPaused=!roamingPaused;sync();};
  button.addEventListener('click',onToggle);area.addEventListener('animationend',onComplete);
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
  return ()=>{disposed=true;area.removeEventListener('pointermove',onPointerRipple);observer.disconnect();window.removeEventListener('resize',sizePortrait);button.removeEventListener('click',onToggle);area.removeEventListener('animationend',onComplete);preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
}

function render(){
  const hash=location.hash;
  const fromRoom=document.body.dataset.room||'home';
  const fromHome=fromRoom==='home';
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
    room='traces';label='走过的地方';html=traces();
  }else if(page==='guestbook'){
    room='guestbook';label='檐下留言簿';html=guestbook();
  }else if(page==='about'){room='about';html=about();label='关于';}
  else if(page==='credits'){room='about';html=credits();label='版本与来源';}
  if(!html){room='about';html='<div class="wrap">'+title('404','NOT FOUND','这条路，尚未写下。','可以回到入口，重新选一个方向。')+'<a class="quiet-link" href="#/">回到入口 →</a></div>';label='未找到档案';}
  document.body.dataset.room=room;
  document.body.classList.toggle('in-darkroom',room==='photography');
  document.body.classList.toggle('in-geography',room==='traces');
  document.querySelector('meta[name=theme-color]').content='#0b211f';
  main.innerHTML=html;setAtmosphere(room);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&((fromRoom==='home'&&room==='poems')||(fromRoom==='poems'&&room==='home'))){
    main.dataset.routeBridge=fromRoom==='home'?'night-to-paper':'paper-to-night';
    main.classList.remove('route-bridge-active');void main.offsetWidth;main.classList.add('route-bridge-active');
    main.addEventListener('animationend',()=>{main.classList.remove('route-bridge-active');delete main.dataset.routeBridge;},{once:true});
  } else if(fromHome&&room!=='home'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){main.animate([{opacity:.76},{opacity:1}],{duration:260,easing:'ease-out'});}
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
  if(document.querySelector('.article.poetry-reading')){
    const art=document.querySelector('.article.poetry-reading');
    const slug=art.dataset.poemSlug;
    if(slug){const previousDispose=disposePage,stop=bindArticle(slug);disposePage=()=>{previousDispose();stop();};}
  }
  if(document.querySelector('.guestbook-room')){
    const previousDispose=disposePage,stop=bindGuestbook();disposePage=()=>{previousDispose();stop();};
  }
  if(document.querySelector('.roaming-night'))disposePage=bindRoaming();
  if(document.querySelector('.cosmos'))disposePage=bindCosmos();
  if(document.querySelector('#lab-desk')){const previousDispose=disposePage,stop=bindLabDesk();disposePage=()=>{previousDispose();stop();};}
  if(document.querySelector('.idea-tree')){const previousDispose=disposePage,tree=document.querySelector('.idea-tree');const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){tree.classList.add('tree-in-view');obs.disconnect();}},{threshold:.15});const revealOnFocus=()=>{tree.classList.remove('tree-in-view');obs.disconnect();};tree.addEventListener('focusin',revealOnFocus);obs.observe(tree);disposePage=()=>{previousDispose();obs.disconnect();tree.removeEventListener('focusin',revealOnFocus);};}
  if(document.querySelector('#china-footprint-map')&&window.initChinaFootprints){const previousDispose=disposePage;const stop=window.initChinaFootprints();disposePage=()=>{previousDispose();stop?.();};}
  if(document.querySelector('.stellar-stage')){const previousDispose=disposePage,disposeConstellation=bindConstellation();disposePage=()=>{previousDispose();disposeConstellation();};}
}
// One persistent audio element lives outside the route-swapped <main>.
function initSoundDock(){
  const dock=document.querySelector('#music-dock'),audio=document.querySelector('#dock-audio'),toggle=document.querySelector('#dock-toggle'),panel=document.querySelector('#dock-panel'),play=document.querySelector('#dock-play'),progress=document.querySelector('#dock-progress'),elapsed=document.querySelector('#dock-elapsed'),duration=document.querySelector('#dock-duration');
  if(!dock||!audio)return;
  const fmt=t=>Number.isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
  const update=()=>{
    play.textContent=audio.paused?'▶':'Ⅱ';
    play.setAttribute('aria-label',(audio.paused?'播放':'暂停')+'《有光的地方》');
    dock.classList.toggle('is-playing',!audio.paused);
    if(!panel.hidden){
      elapsed.textContent=fmt(audio.currentTime);
      if(Number.isFinite(audio.duration))duration.textContent=fmt(audio.duration);
      progress.value=audio.duration>0?String(Math.round(audio.currentTime/audio.duration*1000)):'0';
      progress.style.setProperty('--fill',(Number(progress.value)/10)+'%');
    }
  };
  const open=v=>{panel.hidden=!v;if(v)update();toggle.setAttribute('aria-expanded',String(v));toggle.setAttribute('aria-label',v?'收起音乐播放器':'展开音乐播放器');if(v)play.focus();else toggle.focus();};
  toggle.addEventListener('click',()=>open(panel.hidden));
  document.querySelector('#dock-close').addEventListener('click',()=>open(false));
  play.addEventListener('click',async()=>{if(audio.paused){try{await audio.play();}catch(err){play.setAttribute('aria-label','播放未成功，请检查浏览器音频设置');}}else audio.pause();update();});
  progress.addEventListener('input',()=>{if(audio.duration>0&&Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(progress.value)/1000;update();});
  let audioCtx=null,analyser=null,dataArray=null,rafId=0;
  const pumpAudioEnergy=()=>{
    if(audio.paused||document.body.dataset.room!=='photography'){
      window.__qzAudioEnergy=0;
      rafId=0;
      return;
    }
    if(!analyser)ensureAudioAnalyser();
    if(analyser){
      analyser.getByteFrequencyData(dataArray);
      let sum=0;for(let i=0;i<24;i++)sum+=dataArray[i];
      window.__qzAudioEnergy=Math.min(1,Math.max(0,(sum/(24*255)-.08)*1.85));
    }
    rafId=requestAnimationFrame(pumpAudioEnergy);
  };
  const ensureAudioAnalyser=()=>{
    if(audioCtx||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(max-width: 900px)').matches)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      audioCtx=new Ctx();const src=audioCtx.createMediaElementSource(audio);
      analyser=audioCtx.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.82;
      src.connect(analyser);analyser.connect(audioCtx.destination);
      dataArray=new Uint8Array(analyser.frequencyBinCount);
    }catch(e){}
  };
  audio.addEventListener('timeupdate',update);audio.addEventListener('loadedmetadata',update);
  audio.addEventListener('play',()=>{update();if(document.body.dataset.room==='photography'){ensureAudioAnalyser();if(audioCtx?.state==='suspended')audioCtx.resume();cancelAnimationFrame(rafId);pumpAudioEnergy();}});
  audio.addEventListener('pause',()=>{update();cancelAnimationFrame(rafId);rafId=0;window.__qzAudioEnergy=0;});
  audio.addEventListener('ended',()=>{update();cancelAnimationFrame(rafId);rafId=0;window.__qzAudioEnergy=0;});
  audio.addEventListener('error',()=>{play.disabled=true;play.textContent='!';});
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




