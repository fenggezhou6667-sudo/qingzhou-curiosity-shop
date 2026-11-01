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
 const rooms=[['photos','光停过的地方','works'],['poems','诗的房间','notes'],['traces','日子走过的小路','traces'],['lab','还亮着的实验桌','lab']];
 const scene=(classes,width,height,asset,path)=>`<svg class="scene-svg ${classes}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><g class="river-revealed"><image href="assets/${asset}" width="${width}" height="${height}" preserveAspectRatio="none"/><rect width="${width}" height="${height}" fill="#061d21" opacity=".12"/><path class="river-current" pathLength="100" d="${path}"/></g></svg>`;
 return `<div class="shop-home"><section class="roaming-night roaming-v07b" id="rooms" aria-labelledby="roaming-title" data-paused="false" data-running="false"><h1 id="roaming-title" class="river-sr">清舟的杂货铺 · 漫游入口</h1><div class="scene-art" aria-hidden="true">${scene('desktop-scene-art',1440,820,'river-quiet-desktop.jpg','M 730 0 C 710 75 760 135 780 190 C 790 250 710 290 730 340 C 750 395 820 430 800 480 C 780 540 725 570 750 640 C 780 710 750 765 750 820')}${scene('mobile-scene-art tablet-scene-art',390,820,'river-quiet-portrait.jpg','M 230 0 C 220 70 195 105 210 150 C 235 210 250 245 220 300 C 200 355 260 400 250 450 C 240 500 210 550 235 600 C 265 660 230 740 250 820')}</div><button class="motion-toggle" id="toggle-roaming" type="button" aria-label="暂停首页动画" aria-pressed="false" title="暂停首页动画"><span aria-hidden="true">Ⅱ</span></button><div class="roaming-network">${rooms.map(([key,name,href])=>'<a class="wander-node node-'+key+'" data-branch="'+key+'" href="#/'+href+'"><span class="node-point" aria-hidden="true"></span><h2>'+name+'</h2></a>').join('')}</div></section></div>`;
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
  const selectedPoem=A.notes[0],poemLine=selectedPoem?.body[0]?.split('\n')[0]||'';
  const poemStar=selectedPoem?'<details class="poem-star"><summary aria-label="打开星点，读一句诗"><span aria-hidden="true">✧</span></summary><div class="star-poem-page"><span>一行诗 / '+esc(selectedPoem.title)+'</span><p>'+esc(poemLine)+'</p><a href="#/notes/'+esc(selectedPoem.slug)+'">读完这首诗 ↗</a></div></details>':'';
  const demoCount=A.works.filter(w=>w.demo!==false).length;
  return '<div class="stellar-room">'+starfieldMarkup('collection',210)+'<div class="wrap"><div class="stellar-preface"><header class="stellar-intro"><h1>星空暗房</h1><p>让目光慢下来，沿着光寻找影像。</p><small>'+(demoCount?'当前包含 '+demoCount+' 组授权图库选读，真实摄影作品待补充。':'影像收藏 / PHOTOGRAPHY')+'</small></header>'+poemStar+'</div><div class="stellar-stage"><svg class="stellar-threads" aria-hidden="true"></svg><div class="stellar-works">'+A.works.map((w,i)=>'<a href="#/works/'+esc(w.slug)+'" class="stellar-work star-place-'+(i%3)+'"><span class="stellar-star" aria-hidden="true"></span><div class="stellar-image">'+photo(w.cover,i===0,'card')+'</div><div class="stellar-caption"><span>'+(w.demo!==false?'图库选读':'摄影作品')+'</span><h2>'+esc(w.title)+'</h2><small>'+esc(w.en)+' ↗</small></div></a>').join('')+'</div></div><p class="stellar-end">光会留下它经过的地方。<br><span>选择一幅影像，进入暗房。</span></p></div></div>';
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
 return '<div class="wrap personal-lab"><header class="room-heading"><h1>还亮着的实验桌</h1><p>把想法放在这里，慢慢试出结果。</p></header><div class="life-ledger" aria-label="实验项目清单">'+A.labs.map(l=>'<a class="life-ledger-item" href="#/lab/'+esc(l.slug)+'"><span class="life-ledger-kind">'+esc(l.kind||'IDEA')+'</span><strong>'+esc(l.title)+'</strong><span>'+esc(l.status)+'</span><span aria-hidden="true">↗</span></a>').join('')+'</div></div>';
}
function projectDetail(l){
  const stages=l.stages||[{label:'当前状态',text:l.status},{label:'记录',text:l.record}];
  return '<div class="wrap project-reading"><a class="quiet-link" href="#/lab">← 回到实验桌</a><header class="room-heading">'+eyebrow(l.id,'PROJECT DOSSIER')+'<h1>'+esc(l.title)+'</h1><p>'+esc(l.en)+'</p><span class="project-status">○ '+esc(l.status)+'</span></header><div class="project-reading-grid"><section><h2>一开始的念头</h2><p>'+esc(l.inspiration||l.intro)+'</p><h2>还想继续问的</h2><ul>'+(l.questions||['这个想法想留下什么？','下一次尝试，需要怎样的观察？']).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></section><section><h2>留在桌上的记录</h2><ol class="project-stages">'+stages.map(s=>'<li><span>'+esc(s.label)+'</span><p>'+esc(s.text)+'</p></li>').join('')+'</ol><p class="project-boundary">这里呈现档案与演示状态，不构成已发布产品或已完成科研成果的声明。</p></section></div>'+'</div>';
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
    <header class="china-intro"><span class="eyebrow">TRACES / PLACES I KEEP</span><h1>走过的地方</h1><p>每一盏微光，都来自真实走过的城市。</p></header>
    <div class="china-layout">
      <div class="china-map-stage">
        <div class="china-map-caption"><span>中国 · 足迹图</span><span>21 CITIES / LIVED MEMORIES</span></div>
        <svg class="china-map" id="china-footprint-map" viewBox="0 0 930 650" role="group" aria-label="中国足迹地图，标记二十一座到访城市">
          <defs>
            <linearGradient id="chinaLandFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#254943"/><stop offset=".52" stop-color="#183a37"/><stop offset="1" stop-color="#102a2c"/></linearGradient>
            <linearGradient id="chinaLandEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8da98a"/><stop offset=".55" stop-color="#d0bd83"/><stop offset="1" stop-color="#6f9a8a"/></linearGradient>
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
          <g class="china-topography" clip-path="url(#china-land-clip)" aria-hidden="true">
            <path d="M85 195 C175 130 235 210 295 190 S420 118 495 165 S610 214 700 145 S820 150 880 125"/>
            <path d="M75 228 C170 163 240 244 305 222 S420 150 500 197 S610 245 710 178 S820 184 890 157"/>
            <path d="M92 285 C185 220 245 302 325 275 S450 210 535 255 S655 300 745 232 S840 235 900 213"/>
            <path d="M100 365 C190 300 270 383 350 350 S470 292 560 330 S670 370 770 309 S850 308 900 292"/>
            <path d="M125 435 C220 372 295 450 385 415 S505 362 590 399 S700 434 795 382 S860 382 900 364"/>
            <path d="M180 500 C270 445 340 510 430 480 S550 432 630 465 S730 492 810 450"/>
          </g>
          <g class="china-network" id="china-network" aria-hidden="true"></g>
          <g class="china-city-points" id="china-city-points"></g>
          </g>
        </svg>
        <div class="china-nearby" id="china-nearby" role="group" aria-label="选择附近城市" aria-live="polite" hidden></div>
        <p class="china-map-note">光点代表到访地点；细线仅用于呈现足迹网络，不代表实际旅行顺序。</p>
      </div>
      <aside class="china-story">
        <span class="china-count">PLACES / 21</span><h2 id="china-selected-title">去过的地方</h2>
        <p id="china-selected-description">点亮的城市，来自我真实走过的路。选择一座城市，看看它在地图上的位置。</p>
        <p class="china-disclaimer">城市位置按公开地理数据近似定位。日期、路线、照片与美食记录，等你慢慢补上。</p>
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
let roamingPaused=false;
let roamingIntroComplete=false;
function bindRoaming(){
  const area=document.querySelector('#rooms'),button=document.querySelector('#toggle-roaming');

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
  if(document.querySelector('.roaming-night'))disposePage=bindRoaming();
  if(document.querySelector('.idea-tree')){const previousDispose=disposePage,tree=document.querySelector('.idea-tree');const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){tree.classList.add('tree-in-view');obs.disconnect();}},{threshold:.15});const revealOnFocus=()=>{tree.classList.remove('tree-in-view');obs.disconnect();};tree.addEventListener('focusin',revealOnFocus);obs.observe(tree);disposePage=()=>{previousDispose();obs.disconnect();tree.removeEventListener('focusin',revealOnFocus);};}
  if(document.querySelector('#china-footprint-map')&&window.initChinaFootprints){const previousDispose=disposePage;const stop=window.initChinaFootprints();disposePage=()=>{previousDispose();stop?.();};}
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
  document.querySelector('#dock-close').addEventListener('click',()=>open(false));
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




