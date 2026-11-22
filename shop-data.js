export const SOLAR_TERMS = [
  { name: '小寒', month: 1, day: 5, pentad: '雁北乡 / 鹊始巢 / 雉雊', mood: '岁暮天寒，围炉煮茗' },
  { name: '大寒', month: 1, day: 20, pentad: '鸡始乳 / 征鸟厉疾 / 水泽腹坚', mood: '坚冰深处，春意已生' },
  { name: '立春', month: 2, day: 4, pentad: '东风解冻 / 蛰虫始振 / 鱼陟负冰', mood: '东风解冻，春山可望' },
  { name: '雨水', month: 2, day: 19, pentad: '獭祭鱼 / 鸿雁来 / 草木萌动', mood: '随风潜入夜，润物细无声' },
  { name: '惊蛰', month: 3, day: 5, pentad: '桃始华 / 仓庚鸣 / 鹰化为鸠', mood: '春雷初响，万物舒荣' },
  { name: '春分', month: 3, day: 20, pentad: '玄鸟至 / 雷乃发声 / 始电', mood: '昼夜均分，草长莺飞' },
  { name: '清明', month: 4, day: 4, pentad: '桐始华 / 田鼠化为鴽 / 虹始见', mood: '风清景明，万物皆显' },
  { name: '谷雨', month: 4, day: 20, pentad: '萍始生 / 鸣鸠拂其羽 / 戴胜降于桑', mood: '雨生百谷，暮春将歇' },
  { name: '立夏', month: 5, day: 5, pentad: '蝼蝈鸣 / 蚯蚓出 / 王瓜生', mood: '绿树阴浓夏日长' },
  { name: '小满', month: 5, day: 21, pentad: '苦菜秀 / 靡草死 / 麦秋至', mood: '江河渐满，小得盈满' },
  { name: '芒种', month: 6, day: 5, pentad: '螳螂生 / 鵙始鸣 / 反舌无声', mood: '青梅煮酒，麦浪翻金' },
  { name: '夏至', month: 6, day: 21, pentad: '鹿角解 / 蜩始鸣 / 半夏生', mood: '日北至，日长之至' },
  { name: '小暑', month: 7, day: 7, pentad: '温风至 / 蟋蟀居壁 / 鹰始挚', mood: '荷风送香，竹露滴清' },
  { name: '大暑', month: 7, day: 23, pentad: '腐草为萤 / 土润溽暑 / 大雨时行', mood: '雷雨骤歇，流萤染夏' },
  { name: '立秋', month: 8, day: 7, pentad: '凉风至 / 白露生 / 寒蝉鸣', mood: '一叶梧桐，天下知秋' },
  { name: '处暑', month: 8, day: 23, pentad: '鹰乃祭鸟 / 天地始肃 / 禾乃登', mood: '暑向此时退，秋从此处生' },
  { name: '白露', month: 9, day: 7, pentad: '鸿雁来 / 玄鸟归 / 群鸟养羞', mood: '露从今夜白，月是故乡明' },
  { name: '秋分', month: 9, day: 23, pentad: '雷始收声 / 蛰虫坯户 / 水始涸', mood: '碧云天，秋色连波' },
  { name: '寒露', month: 10, day: 8, pentad: '鸿雁来宾 / 雀入大水为蛤 / 菊有黄华', mood: '秋深露重，菊有黄华' },
  { name: '霜降', month: 10, day: 23, pentad: '豺乃祭兽 / 草木黄落 / 蛰虫咸俯', mood: '气肃而凝，露结为霜' },
  { name: '立冬', month: 11, day: 7, pentad: '水始冰 / 地始冻 / 雉入大水为蜃', mood: '冬水初凝，静室宜读' },
  { name: '小雪', month: 11, day: 22, pentad: '虹藏不见 / 天气上升 / 闭塞成冬', mood: '晚来天欲雪，能饮一杯无' },
  { name: '大雪', month: 12, day: 7, pentad: '鹖鴠不鸣 / 虎始交 / 荔挺出', mood: '千山素裹，独钓寒江' },
  { name: '冬至', month: 12, day: 22, pentad: '蚯蚓结 / 麋角解 / 水泉动', mood: '阳气始萌，日南至' }
];

export const HERBARIUM_SAMPLES = [
  { tag: '雨后青苔', latin: 'Bryophyta · Noctis Imber', place: '旧墙隅与石阶阴面', note: '机器识别为「高湿度地表附生绿斑（置信度 0.91）」；人却记住了雨停后空气里微苦的泥土腥气，和一整个缓慢下来的下午。', verse: '阶前不语承残滴，替旧墙根记岁年。' },
  { tag: '九月梧桐', latin: 'Platanus · Autumnus Mensura', place: '秋风初起的街角', note: '机器提取出「掌状裂叶、边缘锯齿、褐化率 64%」；人拾起它蜷曲的叶脉，觉得那是一把丈量过彤云与远星的旧罗盘。', verse: '叶脉如尺量秋色，留得晴空一寸光。' },
  { tag: '晚霞与桂子', latin: 'Osmanthus · Vespera Aura', place: '暮色将合的江岸小城', note: '机器将气味分子归入「芳樟醇与紫罗兰酮簇」；人却在晚风里听见了客家乡音与采茶回响。', verse: '金粟微茫随水远，半城暮色半城香。' },
  { tag: '山谷雾松', latin: 'Pinus · Nebula Montis', place: '高海拔寒林与乱石间', note: '机器标注为「针叶林冠层低能见度样本」；人在雾海与铁索旁停下脚步，觉得树与树之间的空白才是最好的停留处。', verse: '雾锁寒松千嶂静，人行云外第几峰。' }
];

export const DEFAULT_RIVER_WISHES = [
  { id: 'w-1', text: '在清舟星的小木屋前看了一会玫瑰，很治愈', stamp: '🌹', date: '昨夜', cheers: 18 },
  { id: 'w-2', text: '今天下定决心换座城市生活，愿顺水行舟', stamp: '⛵', date: '2天前', cheers: 24 },
  { id: 'w-3', text: '偷偷摸了摸屋檐上打呼噜的小猫，爪爪好软', stamp: '🐾', date: '3天前', cheers: 36 },
  { id: 'w-4', text: '夜深了，来光河边散散心。愿所有人都能睡个好觉', stamp: '🌙', date: '4天前', cheers: 42 },
  { id: 'w-5', text: '掌柜的，上一壶热龙井，今日摸鱼无罪', stamp: '🍵', date: '5天前', cheers: 15 },
  { id: 'w-6', text: '在《墨檐》里读到了乡愁。倚山水暖风走过', stamp: '🏮', date: '6天前', cheers: 29 }
];

export const PLACES_22 = [
  { index: 0, name: '玉林', group: '华南', hasDirectPoem: true },
  { index: 1, name: '北海', group: '华南', hasDirectPoem: false },
  { index: 2, name: '南宁', group: '华南', hasDirectPoem: false },
  { index: 3, name: '防城港', group: '华南', hasDirectPoem: false },
  { index: 4, name: '贵港', group: '华南', hasDirectPoem: false },
  { index: 5, name: '贵阳', group: '西南', hasDirectPoem: false },
  { index: 6, name: '昆明', group: '西南', hasDirectPoem: false },
  { index: 7, name: '丽江', group: '西南', hasDirectPoem: false },
  { index: 8, name: '大理', group: '西南', hasDirectPoem: false },
  { index: 9, name: '武汉', group: '华中', hasDirectPoem: false },
  { index: 10, name: '长沙', group: '华中', hasDirectPoem: false },
  { index: 11, name: '张家界', group: '华中', hasDirectPoem: false },
  { index: 12, name: '杭州', group: '华东', hasDirectPoem: false },
  { index: 13, name: '苏州', group: '华东', hasDirectPoem: true },
  { index: 14, name: '无锡', group: '华东', hasDirectPoem: false },
  { index: 15, name: '上海', group: '华东', hasDirectPoem: true },
  { index: 16, name: '济南', group: '华东', hasDirectPoem: false },
  { index: 17, name: '郑州', group: '中原与西北', hasDirectPoem: false },
  { index: 18, name: '洛阳', group: '中原与西北', hasDirectPoem: false },
  { index: 19, name: '华阴', group: '中原与西北', hasDirectPoem: true },
  { index: 20, name: '西安', group: '中原与西北', hasDirectPoem: false },
  { index: 21, name: '北京', group: '华北', hasDirectPoem: false }
];

export const CITY_MEMORIES = {
  '上海': { hydro: '长江入海口 · 黄浦江与吴淞江交汇', desc: '黄浦江畔的立桥、高厦与梧桐街区。从「欎外」奔赴「沪中」，《墨檐》七篇、《挽岚》四篇与六首长短句皆诞生于此。' },
  '玉林': { hydro: '南流江与北流河流域 · 桂东南丘陵盆地', desc: '岭南桂东南的故地与起点。郁江支脉与南流江水滋养的烟火小城，收录了从旧旅、夏晚、暮霭到古言与《清平乐》的多首诗篇。' },
  '苏州': { hydro: '太湖流域 · 江南运河水网', desc: '姑苏云泽、水巷与晚花笛声。在江南初冬的梧桐舟与荻花箫声里，写下了《初冬即兴（其一）·昆曲》。' },
  '华阴': { hydro: '秦岭太华北麓 · 渭河入黄口', desc: '西岳华山脚下、渭水汇入黄河之地。曾在秋雨寒风的夜色里拄杖攀登太华绝险，于孤灯铁索间写下《夜登华山记》。' },
  '南宁': { hydro: '珠江水系 · 郁江（邕江）河谷', desc: '绿城水岸与邕江晚风。顺郁江东去可抵贵港与桂东南故地，是一路向南与向西行旅的枢纽。', nearPoemCity: '玉林' },
  '北海': { hydro: '北部湾畔 · 南流江入海口南翼', desc: '北部湾畔的潮声、银滩与晚风。向南望去是蔚蓝天海与深褐礁岸，留存着南方海岸线的呼吸感。', nearPoemCity: '玉林' },
  '防城港': { hydro: '十万大山南麓 · 北部湾深水港湾', desc: '山海相接的边境港湾，海风掠过湿润的岸线与红树林，留下一段安静的南方海岸记忆。', nearPoemCity: '玉林' },
  '贵港': { hydro: '西江黄金水道 · 郁江与黔江交汇', desc: '西江水系流经的荷城，与毗邻的玉林、南宁同属桂东南至桂中的熟悉风土。', nearPoemCity: '玉林' },
  '杭州': { hydro: '钱塘江畔 · 西子湖与京杭运河南端', desc: '湖山与晚榭相映的江南城池。秋夜微凉时，木樨香气与水岸灯影总与沪苏一带的江南行迹相连。', nearPoemCity: '苏州' },
  '无锡': { hydro: '太湖北岸 · 江南古运河水道', desc: '太湖水畔的温润一驿，紧邻苏州，水岸与春风串联起太湖至吴淞江的江南旅途。', nearPoemCity: '苏州' },
  '济南': { hydro: '黄河下游南岸 · 泰山北麓泉域', desc: '南依泰山、北临黄河的泉城。在由南向北跨越黄河的旅途中，记下了泉石与清寒晨风。', nearPoemCity: '上海' },
  '西安': { hydro: '关中平原 · 渭河南岸、秦岭北麓', desc: '八水绕长安的古都风烟，向东沿秦岭北麓即达华阴与西岳太华山，是夜登华山前的重要驿站。', nearPoemCity: '华阴' },
  '洛阳': { hydro: '黄河中游南岸 · 伊洛河盆地', desc: '伊洛河畔、崤函古道东端的千年古都，与华阴、西安同处黄河与渭洛水系串联的中原走廊。', nearPoemCity: '华阴' },
  '郑州': { hydro: '黄河中下游分界 · 中原腹地', desc: '黄河之滨的中原交汇驿站，南来北往的列车在此停靠，把江南、岭南与关中的旅途织成网络。', nearPoemCity: '华阴' },
  '武汉': { hydro: '长江中游 · 汉江入江口与江汉平原', desc: '大江东去、汉水来汇的百湖江城。在浩荡长江风浪与夜色灯火之间，感受过楚天山河之阔。', nearPoemCity: '上海' },
  '长沙': { hydro: '湘江下游 · 洞庭湖水系南翼', desc: '湘江北去、岳麓山映衬的星城夜色，热烈的人间烟火与旧友欢聚的笑谈都在此定格。', nearPoemCity: '玉林' },
  '张家界': { hydro: '武陵山脉腹地 · 澧水发源地', desc: '奇峰千仞、云海吞吐的武陵山脉。薄雾漫过石英砂岩峰林时，天地如同一幅未干的青墨山水。', nearPoemCity: '玉林' },
  '贵阳': { hydro: '云贵高原东斜坡 · 乌江流域与苗岭', desc: '黔中群山环抱的凉爽夏夜，林城多雨的屋檐与青苔，是西南行旅中安静的一站。', nearPoemCity: '玉林' },
  '昆明': { hydro: '云贵高原滇池盆地 · 金沙江与南盘江分水岭', desc: '高原澄澈的阳光与四季不败的花木，滇池云影低垂，风里带着西南特有的疏朗。', nearPoemCity: '玉林' },
  '大理': { hydro: '横断山脉南延 · 点苍山与洱海盆地', desc: '苍山十九峰与洱海月光交汇之地。风吹过坝子与古镇屋檐，时间在这里变得格外轻缓。', nearPoemCity: '玉林' },
  '丽江': { hydro: '横断山脉腹地 · 金沙江虎跳峡大拐弯', desc: '玉龙雪山脚下、长江上游金沙江急转东流之处，抬头可见高原夜空里格外清亮的星河。', nearPoemCity: '玉林' },
  '北京': { hydro: '太行山与燕山交汇 · 华北平原北端', desc: '太行北端与燕山怀抱的北国都城。站在高处回望来路，万里山河与南北风物尽收眼底。', nearPoemCity: '华阴' }
};

export const LAB_SLUG_ALIAS = {
  herbarium: 'machine-herbarium',
  'topo-sound': 'memory-map'
};

const STATIONS = [
  { id: 'works', t: 0.00, min: 0.00, max: 0.23, eyebrow: 'ZONE 01 · PLANET B-612', title: 'B-612 清舟星 · 星屋与摄影卫星' },
  { id: 'notes', t: 0.32, min: 0.23, max: 0.43, eyebrow: 'ZONE 02 · STUDY DESK LEFT', title: '二层书房 · 《墨盐》诗卷' },
  { id: 'labs', t: 0.50, min: 0.43, max: 0.64, eyebrow: 'ZONE 03 · LAB TABLE RIGHT', title: '月下实验桌 · 标本与构造' },
  { id: 'traces', t: 0.75, min: 0.64, max: 0.87, eyebrow: 'ZONE 04 · CHINA TOPOGRAPHY', title: '三维山河舆图 · 廿二城行迹' },
  { id: 'about', t: 0.96, min: 0.87, max: 1.00, eyebrow: 'ZONE 05 · NIGHT RIVER', title: '檐下归舟 · 人间灯火河' }
];

export const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const archive = () => window.ARCHIVE || { works: [], images: {}, notes: [], labs: [] };

export function imgSrc(key, size = 640) {
  const img = archive().images[key];
  if (!img) return './assets/lake-640.jpg';
  const file = img.file || key;
  return `./assets/${file}-${size}.jpg`;
}

export function getSolarTerm() {
  const now = new Date();
  const code = (now.getMonth() + 1) * 100 + now.getDate();
  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1];
  for (const term of SOLAR_TERMS) {
    if (code >= term.month * 100 + term.day) current = term;
  }
  return current;
}

export function updateSolarTermHUD() {
  const el = document.getElementById('hud-solar-term');
  if (!el) return;
  const term = getSolarTerm();
  el.textContent = `${term.name} · ${term.mood}`;
  el.title = `物候三候：${term.pentad}`;
}

/* ---------- Web Audio Soundscape ---------- */
let sfxCtx = null;
export function ensureSfx() {
  if (!sfxCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) sfxCtx = new Ctx();
  }
  if (sfxCtx && sfxCtx.state === 'suspended') {
    sfxCtx.resume().catch(() => {});
  }
  return sfxCtx;
}

export function playTone(freq, duration = 0.45, type = 'sine', gainVal = 0.06) {
  try {
    const ctx = ensureSfx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, ctx.currentTime + duration);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch { /* ignore */ }
}

export const playChimeSound = () => { playTone(880, 0.7, 'sine', 0.05); setTimeout(() => playTone(1320, 0.65, 'sine', 0.035), 90); };
export const playWoodTapSound = () => playTone(210, 0.14, 'triangle', 0.07);
export const playWaterSplashSound = () => { playTone(528, 0.55, 'sine', 0.045); setTimeout(() => playTone(660, 0.5, 'sine', 0.03), 110); };

/* ---------- Local Storage Helpers ---------- */
const lsGet = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const getSealsMap = () => lsGet('qz-poem-seals', {});
export function togglePoemSeal(slug) {
  const m = getSealsMap();
  const next = !m[slug];
  m[slug] = next;
  lsSet('qz-poem-seals', m);
  return next;
}

export const getAnnotationsMap = () => lsGet('qz-poem-notes', {});
export function addPoemAnnotation(slug, lineIdx, text) {
  const m = getAnnotationsMap();
  if (!m[slug]) m[slug] = {};
  if (text) m[slug][lineIdx] = text;
  else delete m[slug][lineIdx];
  lsSet('qz-poem-notes', m);
}

export const getRiverWishes = () => lsGet('qz-river-wishes', DEFAULT_RIVER_WISHES);
export function addRiverWish(text) {
  const clean = text.trim().slice(0, 96);
  if (!clean) return getRiverWishes();
  const stamps = ['🏮', '✨', '⛵', '🌙', '🍂', '💧'];
  const wish = {
    id: 'w-' + Date.now(),
    text: clean,
    stamp: stamps[Math.floor(Math.random() * stamps.length)],
    date: '刚刚',
    cheers: 1
  };
  const next = [wish, ...getRiverWishes()].slice(0, 24);
  lsSet('qz-river-wishes', next);
  return next;
}
