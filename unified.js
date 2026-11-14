import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';

const SOLAR_TERMS = [
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

const HERBARIUM_SAMPLES = [
  { tag: '雨后青苔', latin: 'Bryophyta · Noctis Imber', place: '旧墙隅与石阶阴面', note: '机器识别为「高湿度地表附生绿斑（置信度 0.91）」；人却记住了雨停后空气里微苦的泥土腥气，和一整个缓慢下来的下午。', verse: '阶前不语承残滴，替旧墙根记岁年。' },
  { tag: '九月梧桐', latin: 'Platanus · Autumnus Mensura', place: '秋风初起的街角', note: '机器提取出「掌状裂叶、边缘锯齿、褐化率 64%」；人拾起它蜷曲的叶脉，觉得那是一把丈量过彤云与远星的旧罗盘。', verse: '叶脉如尺量秋色，留得晴空一寸光。' },
  { tag: '晚霞与桂子', latin: 'Osmanthus · Vespera Aura', place: '暮色将合的江岸小城', note: '机器将气味分子归入「芳樟醇与紫罗兰酮簇」；人却在晚风里听见了客家乡音与采茶回响。', verse: '金粟微茫随水远，半城暮色半城香。' },
  { tag: '山谷雾松', latin: 'Pinus · Nebula Montis', place: '高海拔寒林与乱石间', note: '机器标注为「针叶林冠层低能见度样本」；人在雾海与铁索旁停下脚步，觉得树与树之间的空白才是最好的停留处。', verse: '雾锁寒松千嶂静，人行云外第几峰。' }
];

const DEFAULT_RIVER_WISHES = [
  { id: 'w-1', text: '在星空暗房里发了半小时呆，很治愈', stamp: '✨', date: '昨夜', cheers: 18 },
  { id: 'w-2', text: '今天下定决心换座城市生活，愿顺水行舟', stamp: '⛵', date: '2天前', cheers: 24 },
  { id: 'w-3', text: '偷偷摸了摸屋檐上打呼噜的小猫，爪爪好软', stamp: '🐾', date: '3天前', cheers: 36 },
  { id: 'w-4', text: '夜深了，来光河边散散心。愿所有人都能睡个好觉', stamp: '🌙', date: '4天前', cheers: 42 },
  { id: 'w-5', text: '掌柜的，上一壶热龙井，今日摸鱼无罪', stamp: '🍵', date: '5天前', cheers: 15 },
  { id: 'w-6', text: '在《墨檐》里读到了乡愁。倚山水暖风走过', stamp: '🏮', date: '6天前', cheers: 29 }
];

const PLACES_22 = [
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

const CITY_MEMORIES = {
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

const LAB_SLUG_ALIAS = {
  herbarium: 'machine-herbarium',
  'topo-sound': 'memory-map'
};

const STATIONS = [
  { id: 'works', t: 0.00, min: 0.00, max: 0.23, eyebrow: 'ZONE 01 · COSMOS DARKROOM', title: '穹顶星海 · 摄影与星轨' },
  { id: 'notes', t: 0.32, min: 0.23, max: 0.43, eyebrow: 'ZONE 02 · STUDY DESK LEFT', title: '二层书房 · 《墨盐》诗卷' },
  { id: 'labs', t: 0.50, min: 0.43, max: 0.64, eyebrow: 'ZONE 03 · LAB TABLE RIGHT', title: '月下实验桌 · 标本与构造' },
  { id: 'traces', t: 0.75, min: 0.64, max: 0.87, eyebrow: 'ZONE 04 · CHINA TOPOGRAPHY', title: '三维山河舆图 · 廿二城行迹' },
  { id: 'about', t: 0.96, min: 0.87, max: 1.00, eyebrow: 'ZONE 05 · NIGHT RIVER', title: '檐下归舟 · 人间灯火河' }
];

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const archive = () => window.ARCHIVE || { works: [], images: {}, notes: [], labs: [] };

function imgSrc(key, size = 640) {
  const img = archive().images[key];
  if (!img) return './assets/lake-640.jpg';
  const file = img.file || key;
  return `./assets/${file}-${size}.jpg`;
}

function getSolarTerm() {
  const now = new Date();
  const code = (now.getMonth() + 1) * 100 + now.getDate();
  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1];
  for (const term of SOLAR_TERMS) {
    if (code >= term.month * 100 + term.day) current = term;
  }
  return current;
}

function updateSolarTermHUD() {
  const el = document.getElementById('hud-solar-term');
  if (!el) return;
  const term = getSolarTerm();
  el.textContent = `${term.name} · ${term.mood}`;
  el.title = `物候三候：${term.pentad}`;
}

/* ---------- Web Audio Soundscape ---------- */
let sfxCtx = null;
function ensureSfx() {
  if (!sfxCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) sfxCtx = new Ctx();
  }
  if (sfxCtx && sfxCtx.state === 'suspended') {
    sfxCtx.resume().catch(() => {});
  }
  return sfxCtx;
}

function playTone(freq, duration = 0.45, type = 'sine', gainVal = 0.06) {
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
  } catch { /* ignore blocked autoplay */ }
}

const playChimeSound = () => { playTone(880, 0.7, 'sine', 0.05); setTimeout(() => playTone(1320, 0.65, 'sine', 0.035), 90); };
const playWoodTapSound = () => playTone(210, 0.14, 'triangle', 0.07);
const playWaterSplashSound = () => { playTone(528, 0.55, 'sine', 0.045); setTimeout(() => playTone(660, 0.5, 'sine', 0.03), 110); };

/* ---------- Local Storage Helpers ---------- */
const lsGet = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const getSealsMap = () => lsGet('qz-poem-seals', {});
function togglePoemSeal(slug) {
  const m = getSealsMap();
  const next = !m[slug];
  m[slug] = next;
  lsSet('qz-poem-seals', m);
  return next;
}

const getAnnotationsMap = () => lsGet('qz-poem-notes', {});
function addPoemAnnotation(slug, lineIdx, text) {
  const m = getAnnotationsMap();
  if (!m[slug]) m[slug] = {};
  m[slug][lineIdx] = text;
  lsSet('qz-poem-notes', m);
}

const getRiverWishes = () => lsGet('qz-river-wishes', DEFAULT_RIVER_WISHES);
function addRiverWish(text) {
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

/* ---------- UI State ---------- */
const state = {
  targetT: 0.0,
  currentT: 0.0,
  autoPlay: false,
  lastWheelAt: 0,
  pointerX: 0,
  pointerY: 0,
  activeStationId: 'works',
  activePortal: 'none',
  deckCollapsed: false,
  selectedWorkSlug: 'still-water',
  poemCategory: '全部',
  selectedPoemSlug: 'poem-001',
  selectedLabSlug: 'rongrong',
  selectedSampleIdx: 0,
  cityRegion: '全部',
  selectedCityName: '上海',
  lightboxItems: [],
  lightboxIdx: 0
};

let cameraTrack = [];
let posCurve = null;
let lookCurve = null;
let lastRenderedZone = '';
let lastStationKey = '';

let scene, camera, renderer;
let glbRoot = null;
let pointerLight = null;
const namedObjects = new Map();
const clickableRoots = [];
const cityBeaconMeshes = new Map();
const riverBoats = [];
const rippleRings = [];
let galaxyPoints = null;
let cascadePoints = null;
let cascadeVelocities = [];
let cosmosAnchor = new THREE.Vector3(0, 28, 32);

const markerElements = new Map();

function showToast(msg) {
  const el = document.getElementById('cinema-toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { el.hidden = true; }, 2800);
}

function trackToCurveU(t) {
  if (!cameraTrack.length) return 0;
  if (t <= cameraTrack[0].t) return 0;
  const last = cameraTrack.length - 1;
  if (t >= cameraTrack[last].t) return 1;
  for (let i = 0; i < last; i++) {
    const a = cameraTrack[i];
    const b = cameraTrack[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const frac = (t - a.t) / span;
      return (i + frac) / last;
    }
  }
  return clamp(t, 0, 1);
}

function sampleFov(t) {
  if (!cameraTrack.length) return 48;
  for (let i = 0; i < cameraTrack.length - 1; i++) {
    const a = cameraTrack[i], b = cameraTrack[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1);
      return a.fov + (b.fov - a.fov) * f;
    }
  }
  return cameraTrack[cameraTrack.length - 1].fov || 46;
}

function getStationByT(t) {
  for (const s of STATIONS) {
    if (t >= s.min && t <= s.max) return s;
  }
  return STATIONS[STATIONS.length - 1];
}

function getPortalByT(t) {
  if (Math.abs(t - 0.20) < 0.045) return { id: 'skylight', label: '穿过天窗 · 入归案' };
  if (Math.abs(t - 0.61) < 0.045) return { id: 'window', label: '推开木窗 · 见山河' };
  if (Math.abs(t - 0.86) < 0.04) return { id: 'cascade', label: '顺水落差 · 入归舟夜' };
  return null;
}

function makeStarTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 64;
  cvs.height = 64;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.28, 'rgba(255,242,214,0.85)');
  grad.addColorStop(0.65, 'rgba(130,196,255,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cvs);
  return tex;
}

function addProceduralEffects() {
  // 1. Spiral Galaxy centered around Zone 1 Einstein Core (0, 28, 32)
  const starCount = 9000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const palette = [
    new THREE.Color(0xffe1a6),
    new THREE.Color(0x88c9ff),
    new THREE.Color(0x6ef0db),
    new THREE.Color(0xffffff)
  ];

  for (let i = 0; i < starCount; i++) {
    const arm = i % 3;
    const isHalo = i > starCount * 0.82;
    const radius = isHalo ? 8 + Math.random() * 24 : 1.4 + Math.pow(Math.random(), 0.72) * 18.5;
    const spin = radius * 0.42 + (arm * Math.PI * 2) / 3;
    const spread = isHalo ? 6.5 : 0.45 + radius * 0.11;
    const theta = spin + (Math.random() - 0.5) * 0.75;

    const x = Math.cos(theta) * radius + (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * (isHalo ? 14 : 2.6 + radius * 0.14);
    const z = Math.sin(theta) * radius + (Math.random() - 0.5) * spread;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = palette[i % palette.length];
    const mix = 0.65 + Math.random() * 0.35;
    colors[i * 3] = c.r * mix;
    colors[i * 3 + 1] = c.g * mix;
    colors[i * 3 + 2] = c.b * mix;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.28,
    map: makeStarTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.80
  });
  galaxyPoints = new THREE.Points(starGeo, starMat);
  galaxyPoints.position.copy(cosmosAnchor);
  galaxyPoints.rotation.x = 0.28;
  galaxyPoints.rotation.z = -0.18;
  scene.add(galaxyPoints);

  // 2. Flowing Mist / Firefly / Waterfall Sparks between Zone 4 China Topo & Zone 5 Night River
  const moteCount = 900;
  const mPos = new Float32Array(moteCount * 3);
  const mCol = new Float32Array(moteCount * 3);
  cascadeVelocities = [];
  for (let i = 0; i < moteCount; i++) {
    const isCascade = i < 420;
    let x, y, z;
    if (isCascade) {
      const east = i % 2 === 1;
      const p0x = east ? 8.1 : 5.4;
      const p1x = east ? 2.2 : -1.8;
      const p0z = east ? -42.2 : -44.2;
      const p1z = -62.5;
      const prog = Math.random();
      x = p0x + (p1x - p0x) * prog + (Math.random() - 0.5) * 0.9;
      y = 1.56 - 8.04 * Math.pow(prog, 1.45);
      z = p0z + (p1z - p0z) * (0.75 * prog + 0.25 * prog * prog);
      cascadeVelocities.push({ isCascade: true, prog, p0x, p1x, p0z, p1z, speed: 0.24 + Math.random() * 0.25, xOff: (Math.random() - 0.5) * 0.8 });
    } else {
      x = (Math.random() - 0.5) * 18;
      y = -6.2 + Math.random() * 8.5;
      z = -62 - Math.random() * 34;
      cascadeVelocities.push({ isCascade: false, phase: Math.random() * Math.PI * 2, baseX: x, baseY: y, baseZ: z });
    }
    mPos[i * 3] = x;
    mPos[i * 3 + 1] = y;
    mPos[i * 3 + 2] = z;
    const c = isCascade ? new THREE.Color(0x6df6e4) : new THREE.Color(0xffd280);
    mCol[i * 3] = c.r;
    mCol[i * 3 + 1] = c.g;
    mCol[i * 3 + 2] = c.b;
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  const mMat = new THREE.PointsMaterial({
    size: 0.36,
    map: makeStarTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85
  });
  cascadePoints = new THREE.Points(mGeo, mMat);
  scene.add(cascadePoints);
}

function setupLighting() {
  scene.add(new THREE.HemisphereLight(0xdbe8ff, 0x1e2c26, 1.55));
  scene.add(new THREE.AmbientLight(0x9fb8d8, 0.55));

  const moonDir = new THREE.DirectionalLight(0xfff1d6, 1.35);
  moonDir.position.set(-14, 42, 34);
  scene.add(moonDir);

  const rimDir = new THREE.DirectionalLight(0x7be8d8, 0.65);
  rimDir.position.set(16, 18, -56);
  scene.add(rimDir);

  const addBeaconLight = (color, intensity, distance, x, y, z) => {
    const pt = new THREE.PointLight(color, intensity, distance, 1.3);
    pt.position.set(x, y, z);
    scene.add(pt);
    return pt;
  };
  addBeaconLight(0xffcf88, 2.6, 36, 0, 29.5, 31.5);   // Zone 1 Cosmos
  addBeaconLight(0xffc982, 2.4, 24, -3.8, 10.6, -5.8); // Zone 2 Study Desk
  addBeaconLight(0xffb45c, 2.6, 22, 4.8, 10.2, -6.2);  // Zone 3 Lab Lamp
  addBeaconLight(0x88f4df, 2.5, 42, 0, 12.5, -42.0);   // Zone 4 China Topo
  addBeaconLight(0xffb45a, 2.8, 38, 0, -2.5, -76.0);   // Zone 5 Night River
  addBeaconLight(0xffcf7a, 2.2, 34, 0, -3.0, -90.0);   // Zone 5 Arched Bridge

  pointerLight = new THREE.PointLight(0xfff0cc, 0.9, 18, 1.6);
  scene.add(pointerLight);
}

function createWaterRipples() {
  for (let i = 0; i < riverBoats.length; i++) {
    const boat = riverBoats[i].obj;
    const geo = new THREE.RingGeometry(0.95, 1.08, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x62e5d0,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(boat.position.x, -6.47, boat.position.z);
    scene.add(ring);
    rippleRings.push({ ring, boat, phase: i * 1.1 });
  }
}

const INTERACTIVE_NAME_RE = /^(Orrery_\d+|Book_Moyan|ZhuSha_Seal_Block|Herbarium_Specimen_Box|Lab_Plate_\d+|City_Beacon_\d+|River_Boat_Lantern_\d+|Roof_Cat_3D|Roof_Windchime)$/;

function resolveClickTargetName(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData && cur.userData.__qzInteractiveName) {
      return cur.userData.__qzInteractiveName;
    }
    cur = cur.parent;
  }
  return null;
}

function handleInteractiveHit(name) {
  if (!name) return;
  if (name === 'Orrery_0') return openWorkDossier('still-water');
  if (name === 'Orrery_1') return openWorkDossier('shape-of-light');
  if (name === 'Orrery_2') return openWorkDossier('long-afternoon');
  if (name === 'Roof_Windchime') {
    playChimeSound();
    showToast('檐角铜铃清响了一声，光尘正在落入阁楼');
    return;
  }
  if (name === 'Book_Moyan') return openPoemDossier(state.selectedPoemSlug);
  if (name === 'ZhuSha_Seal_Block') {
    const stamped = togglePoemSeal(state.selectedPoemSlug);
    playWoodTapSound();
    showToast(stamped ? '已在《墨盐》当前篇目钤下「清舟」朱砂印' : '已拭去当前篇目朱砂印记');
    renderStationDeck(true);
    return;
  }
  if (name === 'Herbarium_Specimen_Box') return openLabDossier('machine-herbarium');
  if (name.startsWith('Lab_Plate_')) {
    const obj = namedObjects.get(name);
    const rawSlug = obj?.userData?.labProjectId || 'rongrong';
    const mapped = LAB_SLUG_ALIAS[rawSlug] || rawSlug;
    state.selectedLabSlug = mapped;
    return openLabDossier(mapped);
  }
  if (name.startsWith('City_Beacon_')) {
    const idx = Number(name.replace('City_Beacon_', ''));
    const place = PLACES_22[idx];
    if (place) {
      selectCity(place.name, true);
    }
    return;
  }
  if (name === 'Roof_Cat_3D') {
    playChimeSound();
    showToast('屋檐上的黑猫竖起耳朵望向灯火河流，轻轻呼噜了一声 🐾');
    return;
  }
  if (name.startsWith('River_Boat_Lantern_')) {
    playWaterSplashSound();
    showToast('一艘乌篷灯船泛起涟漪，可在右下展签写下归舟寄语 🏮');
    if (state.deckCollapsed) toggleDeckCollapse(false);
    const inp = document.getElementById('wish-input-field');
    if (inp) inp.focus();
  }
}

/* ---------- Spatial Projected Markers ---------- */
function getActiveMarkerSpecs() {
  const t = state.currentT;
  const specs = [];
  if (t < 0.25) {
    specs.push(
      { id: 'Orrery_0', label: 'P—001 在寂静的岸边', tone: 'gold', dy: 1.5 },
      { id: 'Orrery_1', label: 'P—002 光的形状', tone: 'gold', dy: 1.5 },
      { id: 'Orrery_2', label: 'P—003 漫长的下午', tone: 'jade', dy: 1.4 },
      { id: 'Roof_Windchime', label: '天窗铜铃', tone: 'gold', dy: 0.4 }
    );
  } else if (t < 0.44) {
    specs.push(
      { id: 'Book_Moyan', label: '翻阅《墨盐》全本诗集', tone: 'gold', dy: 0.55 },
      { id: 'ZhuSha_Seal_Block', label: '朱砂印', tone: 'seal', dy: 0.5 }
    );
  } else if (t < 0.65) {
    specs.push(
      { id: 'Herbarium_Specimen_Box', label: '机器的植物志 · 4号标本匣', tone: 'jade', dy: 0.65 },
      { id: 'Lab_Plate_0', label: 'L—004 绒绒', tone: 'gold', dy: 0.45 },
      { id: 'Lab_Plate_2', label: 'L—003 记忆的地形', tone: 'gold', dy: 0.45 }
    );
  } else if (t < 0.87) {
    for (const p of PLACES_22) {
      if (p.hasDirectPoem || p.name === state.selectedCityName) {
        specs.push({
          id: `City_Beacon_${p.index}`,
          label: `${p.name}${p.hasDirectPoem ? ' · 成诗地' : ''}`,
          tone: p.hasDirectPoem ? 'gold' : 'jade',
          dy: p.hasDirectPoem ? 1.85 : 1.15,
          selected: p.name === state.selectedCityName
        });
      }
    }
  } else {
    specs.push(
      { id: 'Roof_Cat_3D', label: '檐上夜猫', tone: 'gold', dy: 0.85 },
      { id: 'River_Boat_Lantern_2', label: '放一盏归舟河灯', tone: 'jade', dy: 1.05 }
    );
  }
  return specs;
}

const projVec = new THREE.Vector3();
function updateSpatialMarkers() {
  const container = document.getElementById('spatial-markers');
  if (!container || !glbRoot) return;

  const activeSpecs = getActiveMarkerSpecs();
  const activeIds = new Set(activeSpecs.map((s) => s.id));

  for (const [id, btn] of markerElements.entries()) {
    if (!activeIds.has(id)) {
      btn.style.display = 'none';
    }
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const spec of activeSpecs) {
    const targetObj = namedObjects.get(spec.id);
    if (!targetObj) continue;
    let btn = markerElements.get(spec.id);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spatial-marker';
      btn.innerHTML = `<span class="spatial-dot"></span><span class="spatial-text"></span>`;
      btn.addEventListener('click', () => handleInteractiveHit(spec.id));
      container.appendChild(btn);
      markerElements.set(spec.id, btn);
    }

    targetObj.getWorldPosition(projVec);
    projVec.y += spec.dy || 0.8;
    projVec.project(camera);

    const visible = projVec.z >= -1 && projVec.z <= 1;
    const sx = (projVec.x * 0.5 + 0.5) * w;
    const sy = (-projVec.y * 0.5 + 0.5) * h;

    if (!visible || sx < 40 || sx > w - 40 || sy < 66 || sy > h - 72) {
      btn.style.display = 'none';
      continue;
    }

    btn.style.display = 'inline-flex';
    btn.className = `spatial-marker is-${spec.tone}${spec.selected ? ' is-highlighted' : ''}`;
    btn.querySelector('.spatial-text').textContent = spec.label;
    btn.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0) translate(-50%, -100%)`;
  }
}

/* ---------- Cross-Realm Flight & Station Actions ---------- */
function selectCity(cityName, withToast = false) {
  state.selectedCityName = cityName;
  const place = PLACES_22.find((p) => p.name === cityName);
  if (place) state.cityRegion = '全部';
  playWoodTapSound();
  if (withToast) {
    const mem = CITY_MEMORIES[cityName];
    showToast(`${cityName} · ${mem ? mem.hydro : '山河节点已锁定'}`);
  }
  renderStationDeck(true);
}

function flyTo(targetT, opts = {}) {
  state.targetT = clamp(targetT, 0, 1);
  state.autoPlay = false;
  syncAutoPlayButton();
  if (opts.poemPlace) {
    const found = archive().notes.find((n) => n.place === opts.poemPlace);
    if (found) state.selectedPoemSlug = found.slug;
  }
  if (opts.poemSlug) state.selectedPoemSlug = opts.poemSlug;
  if (opts.cityName) state.selectedCityName = opts.cityName;
  if (opts.labSlug) state.selectedLabSlug = opts.labSlug;
  if (opts.workSlug) state.selectedWorkSlug = opts.workSlug;
  if (opts.toast) showToast(opts.toast);
  renderStationDeck(true);
}

/* ---------- Adaptive Right Station Deck Rendering ---------- */
function toggleDeckCollapse(force) {
  state.deckCollapsed = typeof force === 'boolean' ? force : !state.deckCollapsed;
  const deck = document.getElementById('station-deck');
  const toggleBtn = document.getElementById('btn-deck-toggle');
  if (deck) deck.classList.toggle('is-collapsed', state.deckCollapsed);
  if (toggleBtn) {
    toggleBtn.textContent = state.deckCollapsed ? '+' : '—';
    toggleBtn.setAttribute('aria-expanded', String(!state.deckCollapsed));
  }
}

function renderStationDeck(force = false) {
  const station = getStationByT(state.currentT);
  const deckKey = `${station.id}`;
  if (!force && lastStationKey === deckKey) return;
  lastStationKey = deckKey;

  const eyebrow = document.getElementById('deck-eyebrow');
  const title = document.getElementById('deck-title');
  const body = document.getElementById('station-deck-body');
  if (!eyebrow || !title || !body) return;

  eyebrow.textContent = station.eyebrow;
  title.textContent = station.title;

  if (station.id === 'works') {
    const works = archive().works || [];
    body.innerHTML = `
      <p class="deck-lead">悬浮于爱因斯坦广义相对论透镜与螺旋星云之间的三枚星轨仪，分别安放着一卷摄影集。点击星轨仪或下方卡片翻看展签。</p>
      <div class="deck-card-list">
        ${works.map((w) => `
          <button type="button" class="deck-mini-card${w.slug === state.selectedWorkSlug ? ' is-selected' : ''}" data-open-work="${esc(w.slug)}">
            <img class="deck-mini-thumb" src="${esc(imgSrc(w.cover, 640))}" alt="${esc(w.title)}" />
            <div class="deck-mini-meta">
              <div class="deck-mini-kicker">${esc(w.id)} · ${esc(w.year)}</div>
              <div class="deck-mini-title">${esc(w.title)}</div>
              <div class="deck-mini-sub">${esc(w.medium)}</div>
            </div>
          </button>
        `).join('')}
      </div>
      <div class="deck-btn-row">
        <button type="button" class="deck-action-btn" data-fly-t="0.20">↓ 穿过天窗，飞入阁楼书房</button>
      </div>
    `;
    body.querySelectorAll('[data-open-work]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedWorkSlug = btn.dataset.openWork;
        openWorkDossier(btn.dataset.openWork);
      });
    });
  } else if (station.id === 'notes') {
    const notes = archive().notes || [];
    const cats = ['全部', '墨檐', '挽岚', '其他作品'];
    const filtered = state.poemCategory === '全部' ? notes : notes.filter((n) => (n.category || '其他作品') === state.poemCategory);
    let activePoem = filtered.find((n) => n.slug === state.selectedPoemSlug) || filtered[0] || notes[0];
    if (activePoem) state.selectedPoemSlug = activePoem.slug;
    const seals = getSealsMap();
    const isStamped = activePoem ? !!seals[activePoem.slug] : false;
    const previewLines = activePoem ? activePoem.body.join('\n\n') : '';

    body.innerHTML = `
      <div class="deck-chips">
        ${cats.map((c) => `<button type="button" class="deck-chip${c === state.poemCategory ? ' is-active' : ''}" data-poem-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>
      <div class="deck-chips" style="max-height:66px;overflow-y:auto;">
        ${filtered.slice(0, 12).map((n) => `<button type="button" class="deck-chip${n.slug === state.selectedPoemSlug ? ' is-active' : ''}" data-poem-select="${esc(n.slug)}">${esc(n.title.replace(/^墨檐（其[一二三四五六七]）·?/, ''))}</button>`).join('')}
      </div>
      ${activePoem ? `
        <div class="poem-preview-box">
          <div class="poem-preview-title">${esc(activePoem.title)}</div>
          <div class="poem-preview-meta">${esc(activePoem.id)} · ${esc(activePoem.date || '')}${activePoem.place ? ` · ${esc(activePoem.place)}` : ''}</div>
          <div class="poem-preview-lines">${esc(previewLines)}</div>
        </div>
        <div class="deck-btn-row">
          <button type="button" class="deck-action-btn" id="btn-open-poem-dossier">展开全本与批注 ↗</button>
          <button type="button" class="deck-action-btn is-seal" id="btn-seal-poem">${isStamped ? '✓ 已钤朱砂印' : '钤「清舟」朱砂印'}</button>
          ${activePoem.place ? `<button type="button" class="deck-action-btn is-jade" id="btn-fly-poem-city">飞往舆图 · ${esc(activePoem.place)} ↗</button>` : ''}
        </div>
      ` : ''}
    `;

    body.querySelectorAll('[data-poem-cat]').forEach((b) => {
      b.addEventListener('click', () => { state.poemCategory = b.dataset.poemCat; renderStationDeck(true); });
    });
    body.querySelectorAll('[data-poem-select]').forEach((b) => {
      b.addEventListener('click', () => { state.selectedPoemSlug = b.dataset.poemSelect; playWoodTapSound(); renderStationDeck(true); });
    });
    body.querySelector('#btn-open-poem-dossier')?.addEventListener('click', () => openPoemDossier(state.selectedPoemSlug));
    body.querySelector('#btn-seal-poem')?.addEventListener('click', () => {
      if (!activePoem) return;
      const stamped = togglePoemSeal(activePoem.slug);
      playWoodTapSound();
      showToast(stamped ? `已在《${activePoem.title}》钤下朱砂印` : '已取消当前印记');
      renderStationDeck(true);
    });
    body.querySelector('#btn-fly-poem-city')?.addEventListener('click', () => {
      if (!activePoem?.place) return;
      flyTo(0.75, { cityName: activePoem.place, toast: `沿《${activePoem.title}》山河坐标飞向 ${activePoem.place}` });
    });
  } else if (station.id === 'labs') {
    const labs = archive().labs || [];
    const activeLab = labs.find((l) => l.slug === state.selectedLabSlug) || labs[0];
    const labIntroText = activeLab
      ? (Array.isArray(activeLab.intro) ? activeLab.intro[0] : activeLab.intro) || activeLab.en || ''
      : '';
    const sample = HERBARIUM_SAMPLES[state.selectedSampleIdx] || HERBARIUM_SAMPLES[0];

    body.innerHTML = `
      <div class="deck-chips">
        ${labs.map((l) => `<button type="button" class="deck-chip${l.slug === state.selectedLabSlug ? ' is-active' : ''}" data-lab-tab="${esc(l.slug)}">${esc(l.id)} · ${esc(l.title)}</button>`).join('')}
      </div>
      ${labIntroText ? `<p class="deck-lead" style="margin-bottom:8px;">${esc(labIntroText)}</p>` : ''}
      <div style="font-size:11.5px;color:var(--jade-glow);margin-bottom:5px;">玻匣植物样本检视 (${state.selectedSampleIdx + 1}/4)</div>
      <div class="deck-chips">
        ${HERBARIUM_SAMPLES.map((s, idx) => `<button type="button" class="deck-chip${idx === state.selectedSampleIdx ? ' is-active' : ''}" data-sample-idx="${idx}">${esc(s.tag)}</button>`).join('')}
      </div>
      <div class="specimen-detail">
        <div class="specimen-latin">${esc(sample.latin)} · ${esc(sample.place)}</div>
        <div style="margin-top:4px;font-size:12px;">${esc(sample.note)}</div>
        <div class="specimen-verse">「${esc(sample.verse)}」</div>
      </div>
      <div class="deck-btn-row">
        <button type="button" class="deck-action-btn is-jade" id="btn-open-lab-dossier">打开实验手记与电路图 ↗</button>
        <button type="button" class="deck-action-btn" data-fly-t="0.61">→ 推开雕花木窗</button>
      </div>
    `;

    body.querySelectorAll('[data-lab-tab]').forEach((b) => {
      b.addEventListener('click', () => { state.selectedLabSlug = b.dataset.labTab; playWoodTapSound(); renderStationDeck(true); });
    });
    body.querySelectorAll('[data-sample-idx]').forEach((b) => {
      b.addEventListener('click', () => { state.selectedSampleIdx = Number(b.dataset.sampleIdx); playChimeSound(); renderStationDeck(true); });
    });
    body.querySelector('#btn-open-lab-dossier')?.addEventListener('click', () => openLabDossier(state.selectedLabSlug));
  } else if (station.id === 'traces') {
    const regions = ['全部', '华东', '华南', '西南', '华中', '中原与西北', '华北'];
    const filteredCities = state.cityRegion === '全部' ? PLACES_22 : PLACES_22.filter((p) => p.group === state.cityRegion);
    const activeCity = PLACES_22.find((p) => p.name === state.selectedCityName) || PLACES_22[15];
    const mem = CITY_MEMORIES[activeCity.name] || { hydro: '华夏山河流域', desc: '行旅过往的一处水岸坐标。' };
    const linkedCity = activeCity.hasDirectPoem ? activeCity.name : mem.nearPoemCity;

    body.innerHTML = `
      <div class="city-telemetry-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:15px;">${esc(activeCity.name)} · ${esc(activeCity.group)}</strong>
          <span class="brand-badge">${activeCity.hasDirectPoem ? '直系成诗地' : '水系相邻'}</span>
        </div>
        <div class="city-hydro">${esc(mem.hydro)}</div>
        <div style="font-size:12px;color:var(--ink-muted);">${esc(mem.desc)}</div>
      </div>
      <div class="deck-chips">
        ${regions.map((r) => `<button type="button" class="deck-chip${r === state.cityRegion ? ' is-active' : ''}" data-city-region="${esc(r)}">${esc(r)}</button>`).join('')}
      </div>
      <div class="deck-chips" style="max-height:92px;overflow-y:auto;">
        ${filteredCities.map((p) => `<button type="button" class="deck-chip${p.hasDirectPoem ? ' is-poem-city' : ''}${p.name === activeCity.name ? ' is-active' : ''}" data-city-pick="${esc(p.name)}">${esc(p.name)}</button>`).join('')}
      </div>
      <div class="deck-btn-row">
        ${linkedCity ? `<button type="button" class="deck-action-btn" id="btn-city-to-poem">飞回书房 · 读「${esc(linkedCity)}」之诗 ↗</button>` : ''}
        <button type="button" class="deck-action-btn is-jade" data-fly-t="0.96">↓ 顺长江入人间夜河</button>
      </div>
    `;

    body.querySelectorAll('[data-city-region]').forEach((b) => {
      b.addEventListener('click', () => { state.cityRegion = b.dataset.cityRegion; renderStationDeck(true); });
    });
    body.querySelectorAll('[data-city-pick]').forEach((b) => {
      b.addEventListener('click', () => selectCity(b.dataset.cityPick, true));
    });
    body.querySelector('#btn-city-to-poem')?.addEventListener('click', () => {
      flyTo(0.32, { poemPlace: linkedCity, toast: `携「${activeCity.name}」水系记忆重返二层《墨盐》书案` });
    });
  } else {
    const wishes = getRiverWishes();
    body.innerHTML = `
      <p class="deck-lead">顺山河光瀑滑落江南水乡夜泊处。一只黑猫守在青瓦屋檐上，六盏乌篷小舟灯火浮沉。写一句今夜心事，放进这片水面。</p>
      <form class="wish-form" id="river-wish-form">
        <input class="wish-input" id="wish-input-field" type="text" maxlength="80" placeholder="写一盏河灯寄语…" />
        <button type="submit" class="deck-action-btn is-jade">放灯 🏮</button>
      </form>
      <div class="wish-list">
        ${wishes.map((w) => `
          <div class="wish-item">
            <div>${esc(w.stamp)} ${esc(w.text)}</div>
            <div class="wish-meta"><span>${esc(w.date)}</span><span>微光 ×${esc(w.cheers)}</span></div>
          </div>
        `).join('')}
      </div>
      <div class="deck-btn-row">
        <button type="button" class="deck-action-btn" data-fly-t="0.00">↺ 重新起飞 · 回到苍穹星海</button>
      </div>
    `;

    body.querySelector('#river-wish-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = body.querySelector('#wish-input-field');
      if (!inp || !inp.value.trim()) return;
      addRiverWish(inp.value);
      playWaterSplashSound();
      showToast('一盏新河灯已顺水漂进乌篷舟阵 ✨');
      renderStationDeck(true);
    });
  }

  body.querySelectorAll('[data-fly-t]').forEach((b) => {
    b.addEventListener('click', () => flyTo(Number(b.dataset.flyT)));
  });
}

/* ---------- Dossier Reading Overlay & Lightbox ---------- */
function openDossier(kicker, titleText, html, flyOpts = null) {
  const modal = document.getElementById('dossier-modal');
  const kickerEl = document.getElementById('dossier-kicker');
  const titleEl = document.getElementById('dossier-title');
  const bodyEl = document.getElementById('dossier-body');
  const flyBtn = document.getElementById('dossier-fly-btn');
  if (!modal || !bodyEl) return;

  kickerEl.textContent = kicker;
  titleEl.textContent = titleText;
  bodyEl.innerHTML = html;

  if (flyOpts) {
    flyBtn.hidden = false;
    flyBtn.textContent = flyOpts.label;
    flyBtn.onclick = () => {
      closeDossier();
      flyTo(flyOpts.t, flyOpts.opts || {});
    };
  } else {
    flyBtn.hidden = true;
    flyBtn.onclick = null;
  }

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
}

function closeDossier() {
  const modal = document.getElementById('dossier-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
}

function openLightbox(items, startIdx = 0) {
  state.lightboxItems = items;
  state.lightboxIdx = clamp(startIdx, 0, Math.max(0, items.length - 1));
  const lb = document.getElementById('lightbox');
  if (!lb || !items.length) return;
  updateLightbox();
  lb.hidden = false;
  lb.setAttribute('aria-hidden', 'false');
}

function updateLightbox() {
  const item = state.lightboxItems[state.lightboxIdx];
  const imgEl = document.getElementById('lb-img');
  const capEl = document.getElementById('lb-cap');
  if (!item || !imgEl) return;
  imgEl.src = item.src;
  imgEl.alt = item.cap || '';
  capEl.textContent = item.cap || '';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.hidden = true;
  lb.setAttribute('aria-hidden', 'true');
}

function openWorkDossier(slug) {
  const w = (archive().works || []).find((x) => x.slug === slug) || archive().works[0];
  if (!w) return;
  playChimeSound();
  const photos = (w.photos || []).map((k, idx) => ({
    key: k,
    src: imgSrc(k, 1600),
    thumb: imgSrc(k, 640),
    cap: (w.captions && w.captions[k]) || archive().images[k]?.alt || `${w.title} · No.${idx + 1}`
  }));

  const html = `
    <p style="color:var(--ink-muted);margin-top:0;">${esc(w.en || '')} · ${esc(w.year)} · ${esc(w.medium)}</p>
    ${(w.intro || []).map((p) => `<p>${esc(p)}</p>`).join('')}
    <div class="dossier-gallery">
      ${photos.map((p, idx) => `
        <button type="button" class="dossier-photo-btn" data-lb-idx="${idx}">
          <img src="${esc(p.thumb)}" alt="${esc(p.cap)}" />
          <div class="dossier-photo-cap">${esc(p.cap)}</div>
        </button>
      `).join('')}
    </div>
  `;
  openDossier(`${w.id} · PHOTOGRAPHY EXHIBITION`, w.title, html, { label: '↓ 穿过天窗前往二层书房', t: 0.32 });
  document.querySelectorAll('#dossier-body [data-lb-idx]').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(photos.map((p) => ({ src: p.src, cap: p.cap })), Number(btn.dataset.lbIdx)));
  });
}

function openPoemDossier(slug) {
  const notes = archive().notes || [];
  const p = notes.find((x) => x.slug === slug) || notes[0];
  if (!p) return;
  state.selectedPoemSlug = p.slug;
  const annos = getAnnotationsMap()[p.slug] || {};
  const linesHtml = p.body
    .flatMap((stanza) => stanza.split('\n'))
    .map((line, idx) => {
      const note = annos[idx];
      return `<div class="poem-stanza-line" data-line-idx="${idx}" title="点击添加朱砂批注">${esc(line)}${note ? `<span class="poem-note-badge">${esc(note)}</span>` : ''}</div>`;
    })
    .join('');

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <span style="color:var(--gold-brass);font-family:var(--font-mono);font-size:12px;">${esc(p.id)} · ${esc(p.date || '')}${p.place ? ` · ${esc(p.place)}` : ''} · 点击任意诗行可写朱砂眉批</span>
      <select id="dossier-poem-picker" style="background:rgba(255,255,255,0.06);border:1px solid var(--border-gold);border-radius:8px;padding:4px 8px;color:var(--ink-ivory);">
        ${notes.map((n) => `<option value="${esc(n.slug)}"${n.slug === p.slug ? ' selected' : ''} style="background:#0b121d;color:#f3e6cf;">${esc(n.id)} · ${esc(n.title)}</option>`).join('')}
      </select>
    </div>
    <div style="padding:14px 18px;border-radius:12px;background:rgba(243,230,207,0.04);border:1px solid var(--border-soft);">
      ${linesHtml}
    </div>
  `;

  const flyOpts = p.place ? { label: `飞往山河 · ${p.place} ↗`, t: 0.75, opts: { cityName: p.place } } : null;
  openDossier('《墨盐》全本互动诗卷', p.title, html, flyOpts);

  document.getElementById('dossier-poem-picker')?.addEventListener('change', (e) => {
    openPoemDossier(e.target.value);
    renderStationDeck(true);
  });
  document.querySelectorAll('#dossier-body [data-line-idx]').forEach((lineEl) => {
    lineEl.addEventListener('click', () => {
      const idx = Number(lineEl.dataset.lineIdx);
      const val = window.prompt('写下一句朱砂批注（保存在本地浏览器）：', annos[idx] || '');
      if (val !== null) {
        addPoemAnnotation(p.slug, idx, val.trim());
        playWoodTapSound();
        openPoemDossier(p.slug);
      }
    });
  });
}

function openLabDossier(slug) {
  const mapped = LAB_SLUG_ALIAS[slug] || slug;
  const lab = (archive().labs || []).find((l) => l.slug === mapped) || archive().labs[0];
  if (!lab) return;
  playChimeSound();
  const sampleCards = HERBARIUM_SAMPLES.map((s) => `
    <div style="padding:12px;border-radius:10px;border:1px solid rgba(95,226,204,0.28);background:rgba(95,226,204,0.05);">
      <div style="color:var(--jade-glow);font-family:var(--font-mono);font-size:11px;">${esc(s.latin)}</div>
      <strong style="font-size:15px;">${esc(s.tag)}</strong> · <span style="font-size:12px;color:var(--ink-muted);">${esc(s.place)}</span>
      <p style="margin:6px 0;font-size:13px;">${esc(s.note)}</p>
      <div style="font-style:italic;color:#d6fff6;">「${esc(s.verse)}」</div>
    </div>
  `).join('');

  const asList = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
  const html = `
    <p style="color:var(--jade-glow);font-family:var(--font-mono);font-size:12px;">${esc(lab.en || '')} · 状态：${esc(lab.status || '')}</p>
    ${asList(lab.intro).map((t) => `<p>${esc(t)}</p>`).join('')}
    ${asList(lab.record).map((t) => `<p style="color:var(--ink-muted);">${esc(t)}</p>`).join('')}
    <h4 style="margin:18px 0 10px;color:var(--gold-brass);">月下玻璃标本匣 · 四件植物切片</h4>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
      ${sampleCards}
    </div>
  `;
  openDossier(`${lab.id} · 月下实验桌档案`, lab.title, html, { label: '→ 推开雕花木窗俯瞰山河', t: 0.75 });
}

function openAboutDossier() {
  const html = `
    <p>欢迎光临《清舟的杂货铺》Blender 空间一镜到底剧场版。</p>
    <p>这座立体建筑由 <strong>Blender 4.2.9</strong> 在实体坐标系下构建，全长镜头沿单条连续 <code>CatmullRomCurve3</code> 样条穿越五个空间层次：</p>
    <ul>
      <li><strong>第一境 · 穹顶星海</strong>（摄影展区）：广义相对论爱因斯坦引力环、9,000 颗螺旋星云与三枚作品星轨仪。</li>
      <li><strong>天窗门户 · Skylight</strong>：飞越江南北屋坡顶天窗与青铜风铃，坠入二层暖灯木阁楼。</li>
      <li><strong>第二境 · 墨盐书房</strong>（诗集案左）：打开的线装诗卷、端砚与可真实落印批注的朱砂方章。</li>
      <li><strong>第三境 · 实验暗室</strong>（长案右）：黄铜台灯照耀下的月下玻璃植物标本匣与三块实验蓝图板。</li>
      <li><strong>木窗门户 · Window</strong>：推开六十四度对开雕花苏式格窗，豁然迎面立体华夏山河舆图。</li>
      <li><strong>第四境 · 三维华夏山河舆图</strong>：660+ 采样海岸廓线、五大山脉峰峦、七道荧光江河与廿二城行迹信标，江水化作双股光瀑倾泻入谷。</li>
      <li><strong>第五境 · 屋檐与归舟</strong>：飞檐黑猫静守江南水巷，六盏乌篷船灯在倒影涟漪中载走今夜寄语。</li>
    </ul>
    <p style="color:var(--ink-muted);">原版独立平面多系统档案仍在 <a href="./index.html" style="color:var(--gold-brass);">./index.html</a> 完整保留，互不覆盖。</p>
  `;
  openDossier('COLOPHON · 一镜到底空间志', '关于清舟的立体杂货铺', html);
}

/* ---------- Music Sound Dock ---------- */
function initSoundDock() {
  const dock = document.getElementById('music-dock');
  const audio = document.getElementById('dock-audio');
  const toggle = document.getElementById('dock-toggle');
  const panel = document.getElementById('dock-panel');
  const play = document.getElementById('dock-play');
  const progress = document.getElementById('dock-progress');
  const elapsed = document.getElementById('dock-elapsed');
  const duration = document.getElementById('dock-duration');
  if (!dock || !audio) return;

  const fmt = (t) => (Number.isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '0:00');
  const update = () => {
    play.textContent = audio.paused ? '▶' : 'Ⅱ';
    if (!panel.hidden) {
      elapsed.textContent = fmt(audio.currentTime);
      if (Number.isFinite(audio.duration)) duration.textContent = fmt(audio.duration);
      progress.value = audio.duration > 0 ? String(Math.round((audio.currentTime / audio.duration) * 1000)) : '0';
    }
  };
  toggle.addEventListener('click', () => {
    const next = panel.hidden;
    panel.hidden = !next;
    toggle.setAttribute('aria-expanded', String(next));
    if (next) update();
  });
  document.getElementById('dock-close')?.addEventListener('click', () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  });

  let analyser = null, freqBins = null;
  play.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        if (!analyser && (window.AudioContext || window.webkitAudioContext)) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const actx = new Ctx();
          const src = actx.createMediaElementSource(audio);
          analyser = actx.createAnalyser();
          analyser.fftSize = 128;
          freqBins = new Uint8Array(analyser.frequencyBinCount);
          src.connect(analyser);
          analyser.connect(actx.destination);
        }
        await audio.play();
      } catch { /* user interaction or missing playback blocked */ }
    } else {
      audio.pause();
    }
    update();
  });
  progress.addEventListener('input', () => {
    if (audio.duration > 0 && Number.isFinite(audio.duration)) {
      audio.currentTime = (audio.duration * Number(progress.value)) / 1000;
    }
    update();
  });
  audio.addEventListener('timeupdate', () => {
    update();
    if (analyser && freqBins && !audio.paused) {
      analyser.getByteFrequencyData(freqBins);
      let sum = 0;
      for (let i = 0; i < 16; i++) sum += freqBins[i];
      window.__qzAudioEnergy = sum / (16 * 255);
    } else {
      window.__qzAudioEnergy = 0;
    }
  });
}

function syncAutoPlayButton() {
  const btn = document.getElementById('btn-autoplay');
  const icon = document.getElementById('autoplay-icon');
  const label = document.getElementById('autoplay-label');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(state.autoPlay));
  if (icon) icon.textContent = state.autoPlay ? 'Ⅱ' : '▶';
  if (label) label.textContent = state.autoPlay ? '暂停巡游' : '一镜巡游';
}

/* ---------- HUD, Scrubber, Wheel, Raycast Bindings ---------- */
function syncHudAndTimeline() {
  const t = state.currentT;
  const pct = Math.round(t * 100);
  const fill = document.getElementById('rail-track-fill');
  const thumb = document.getElementById('rail-thumb');
  const pctEl = document.getElementById('rail-pct');
  const telEl = document.getElementById('hud-telemetry');
  const slider = document.getElementById('rail-track-wrap');
  if (fill) fill.style.width = `${t * 100}%`;
  if (thumb) thumb.style.left = `${t * 100}%`;
  if (pctEl) pctEl.textContent = `${String(pct).padStart(2, '0')}%`;
  if (telEl) telEl.textContent = `T ${t.toFixed(2)}`;
  if (slider) slider.setAttribute('aria-valuenow', String(pct));

  const station = getStationByT(t);
  state.activeStationId = station.id;
  document.body.dataset.zone = station.id;
  document.querySelectorAll('.station-pill').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.station === station.id);
  });

  const portal = getPortalByT(t);
  const vignette = document.getElementById('aperture-vignette');
  const portalPill = document.getElementById('hud-portal-pill');
  const portalId = portal ? portal.id : 'none';
  if (portalId !== state.activePortal) {
    state.activePortal = portalId;
    document.body.dataset.portal = portalId;
    if (vignette) vignette.classList.toggle('is-portal', Boolean(portal));
    if (portalPill) {
      portalPill.hidden = !portal;
      if (portal) portalPill.textContent = portal.label;
    }
  }

  if (lastRenderedZone !== station.id) {
    lastRenderedZone = station.id;
    renderStationDeck(true);
  }
}

function bindEvents(canvas) {
  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('wheel', (e) => {
    const scrollable = e.target.closest('.station-deck-body, .dossier-body, .poem-preview-lines, .wish-list');
    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 4) {
      const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
      const atBot = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBot) return;
    }
    const modal = document.getElementById('dossier-modal');
    if (modal && !modal.hidden) return;
    e.preventDefault();
    state.autoPlay = false;
    syncAutoPlayButton();
    state.lastWheelAt = performance.now();
    state.targetT = clamp(state.targetT + e.deltaY * 0.00028, 0, 1);
  }, { passive: false });

  let touchY = null;
  window.addEventListener('touchstart', (e) => {
    if (e.target.closest('#timeline-rail, #station-deck, #dossier-modal, #hud-topbar')) return;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;
    touchY = e.touches[0].clientY;
    state.autoPlay = false;
    syncAutoPlayButton();
    state.lastWheelAt = performance.now();
    state.targetT = clamp(state.targetT + dy * 0.0008, 0, 1);
  }, { passive: true });
  window.addEventListener('touchend', () => { touchY = null; });

  window.addEventListener('pointermove', (e) => {
    state.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    state.pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    if (canvas && clickableRoots.length) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: state.pointerX, y: state.pointerY }, camera);
      const hits = rc.intersectObjects(clickableRoots, true);
      const hitName = hits.length ? resolveClickTargetName(hits[0].object) : null;
      canvas.style.cursor = hitName ? 'pointer' : 'grab';
    }
  });

  if (canvas) {
    let downX = 0, downY = 0;
    canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
    canvas.addEventListener('pointerup', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 }, camera);
      const hits = rc.intersectObjects(clickableRoots, true);
      if (hits.length) {
        const hitName = resolveClickTargetName(hits[0].object);
        if (hitName) handleInteractiveHit(hitName);
      }
    });
  }

  document.querySelectorAll('.station-pill, .rail-tick').forEach((btn) => {
    btn.addEventListener('click', () => flyTo(Number(btn.dataset.t)));
  });

  document.getElementById('btn-home-reset')?.addEventListener('click', () => flyTo(0));
  document.getElementById('btn-deck-about')?.addEventListener('click', openAboutDossier);
  document.getElementById('btn-deck-toggle')?.addEventListener('click', () => toggleDeckCollapse());
  document.getElementById('btn-autoplay')?.addEventListener('click', () => {
    state.autoPlay = !state.autoPlay;
    if (state.autoPlay && state.currentT >= 0.99) state.targetT = state.currentT = 0;
    syncAutoPlayButton();
  });

  // Timeline Scrubber Dragging
  const rail = document.getElementById('rail-track-wrap');
  if (rail) {
    let dragging = false;
    const scrub = (clientX) => {
      const rect = rail.getBoundingClientRect();
      const next = clamp((clientX - rect.left) / rect.width, 0, 1);
      state.autoPlay = false;
      syncAutoPlayButton();
      state.targetT = next;
    };
    rail.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('rail-tick')) return;
      dragging = true;
      rail.setPointerCapture?.(e.pointerId);
      scrub(e.clientX);
    });
    rail.addEventListener('pointermove', (e) => { if (dragging) scrub(e.clientX); });
    rail.addEventListener('pointerup', () => { dragging = false; });
  }

  document.getElementById('dossier-close')?.addEventListener('click', closeDossier);
  document.getElementById('dossier-backdrop')?.addEventListener('click', closeDossier);
  document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lb-prev')?.addEventListener('click', () => {
    state.lightboxIdx = (state.lightboxIdx - 1 + state.lightboxItems.length) % state.lightboxItems.length;
    updateLightbox();
  });
  document.getElementById('lb-next')?.addEventListener('click', () => {
    state.lightboxIdx = (state.lightboxIdx + 1) % state.lightboxItems.length;
    updateLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lb = document.getElementById('lightbox');
      if (lb && !lb.hidden) return closeLightbox();
      const dm = document.getElementById('dossier-modal');
      if (dm && !dm.hidden) return closeDossier();
    } else if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      state.autoPlay = !state.autoPlay;
      syncAutoPlayButton();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      state.autoPlay = false;
      state.targetT = clamp(state.targetT + 0.04, 0, 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      state.autoPlay = false;
      state.targetT = clamp(state.targetT - 0.04, 0, 1);
    }
  });
}

/* ---------- Main Boot & Animation Loop ---------- */
const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

function applyCameraAtT(t, elapsedSec = 0) {
  if (!posCurve || !lookCurve || !camera) return;
  const u = trackToCurveU(t);
  posCurve.getPoint(u, tmpPos);
  lookCurve.getPoint(u, tmpTarget);

  // Parallax look shift + gentle city beacon bias in Zone 4
  tmpTarget.x += state.pointerX * 0.48;
  tmpTarget.y += state.pointerY * 0.28 + Math.sin(elapsedSec * 0.6) * 0.03;

  camera.position.copy(tmpPos);
  camera.fov = sampleFov(t);
  camera.updateProjectionMatrix();
  camera.lookAt(tmpTarget);

  if (pointerLight) {
    pointerLight.position.set(tmpTarget.x, tmpTarget.y + 1.5, tmpTarget.z);
  }
}

function renderOnceAndSync(nowSec = 0) {
  applyCameraAtT(state.currentT, nowSec);
  syncHudAndTimeline();
  updateSpatialMarkers();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

async function bootCinema() {
  updateSolarTermHUD();
  initSoundDock();

  const canvas = document.getElementById('onetake-canvas');
  const statusEl = document.getElementById('loader-status');
  const loaderEl = document.getElementById('cinema-loader');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a14);
  scene.fog = new THREE.FogExp2(0x050a14, 0.0085);

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  setupLighting();
  addProceduralEffects();
  bindEvents(canvas);

  try {
    if (statusEl) statusEl.textContent = '载入长镜头轨线…';
    const camRes = await fetch('./assets/qingzhou-world-camera.json');
    const camJson = await camRes.json();
    cameraTrack = camJson.cameraTrack || [];
    posCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.pos)), false, 'catmullrom', 0.35);
    lookCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.target)), false, 'catmullrom', 0.35);

    if (statusEl) statusEl.textContent = '载入 Blender 实体空间建筑 (GLB)…';
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./assets/qingzhou-world.glb');
    glbRoot = gltf.scene;
    scene.add(glbRoot);

    glbRoot.traverse((obj) => {
      if (!obj.name) return;
      if (!namedObjects.has(obj.name)) {
        namedObjects.set(obj.name, obj);
      }
      if (INTERACTIVE_NAME_RE.test(obj.name)) {
        obj.userData.__qzInteractiveName = obj.name;
        clickableRoots.push(obj);
      }
      const beaconMatch = obj.name.match(/^City_Beacon_(\d+)$/);
      if (beaconMatch) {
        const idx = Number(beaconMatch[1]);
        cityBeaconMeshes.set(idx, { obj, baseScaleY: obj.scale.y || 1 });
      }
      if (/^River_Boat_Lantern_(\d+)$/.test(obj.name)) {
        riverBoats.push({ obj, baseY: obj.position.y, phase: riverBoats.length * 1.15 });
      }
    });

    createWaterRipples();
    window.__glbLoaded = true;
  } catch (err) {
    console.error('One-Take 3D boot error:', err);
    if (statusEl) statusEl.textContent = '3D 资源加载受限：' + (err?.message || err);
  }

  renderStationDeck(true);
  renderOnceAndSync(0);
  window.__onetakeReady = true;

  if (loaderEl) loaderEl.classList.add('is-ready');

  // Expose deterministic test & inspection hooks
  window.__qzSetT = (t, instant = true) => {
    state.autoPlay = false;
    syncAutoPlayButton();
    state.targetT = clamp(Number(t) || 0, 0, 1);
    if (instant) {
      state.currentT = state.targetT;
      renderOnceAndSync(performance.now() * 0.001);
    }
    return window.__qzGetState();
  };
  window.__qzFlyTo = (t, opts) => flyTo(t, opts);
  window.__qzGetState = () => ({
    ready: Boolean(window.__onetakeReady),
    glbLoaded: Boolean(window.__glbLoaded),
    currentT: Number(state.currentT.toFixed(4)),
    targetT: Number(state.targetT.toFixed(4)),
    zone: state.activeStationId,
    portal: state.activePortal,
    selectedCity: state.selectedCityName,
    selectedPoem: state.selectedPoemSlug,
    selectedLab: state.selectedLabSlug,
    glObjects: namedObjects.size
  });

  let prevMs = performance.now();
  function animate(nowMs) {
    requestAnimationFrame(animate);
    const dt = Math.min((nowMs - prevMs) * 0.001, 0.08);
    prevMs = nowMs;
    const elapsed = nowMs * 0.001;

    if (state.autoPlay) {
      state.targetT = Math.min(1, state.targetT + dt * 0.028);
      if (state.targetT >= 0.999) {
        state.autoPlay = false;
        syncAutoPlayButton();
      }
    } else if (nowMs - state.lastWheelAt > 200) {
      for (const st of STATIONS) {
        if (Math.abs(state.targetT - st.t) < 0.012) {
          state.targetT += (st.t - state.targetT) * Math.min(1, dt * 4);
        }
      }
    }

    state.currentT += (state.targetT - state.currentT) * Math.min(1, dt * 6.5);

    // Animate 3D Props & Audio Reactivity
    const energy = Number(window.__qzAudioEnergy || 0);
    if (galaxyPoints) {
      galaxyPoints.rotation.y = elapsed * (0.045 + energy * 0.08);
      galaxyPoints.material.size = 0.28 + energy * 0.18;
    }

    const einstein = namedObjects.get('Einstein_Core');
    if (einstein) einstein.rotation.y = elapsed * 0.25;

    for (let i = 0; i < 3; i++) {
      const orr = namedObjects.get(`Orrery_${i}`);
      if (orr) {
        orr.rotation.y = elapsed * (0.32 + i * 0.08);
        orr.rotation.x = Math.sin(elapsed * 0.4 + i) * 0.14;
      }
    }

    const chime = namedObjects.get('Roof_Windchime');
    if (chime) chime.rotation.z = Math.sin(elapsed * 1.4) * 0.08;

    for (const [idx, entry] of cityBeaconMeshes.entries()) {
      const place = PLACES_22[idx];
      const isSelected = place && place.name === state.selectedCityName;
      const pulse = 1 + (isSelected ? 0.35 + 0.22 * Math.sin(elapsed * 4.5) : 0.08 * Math.sin(elapsed * 2 + idx));
      entry.obj.scale.set(isSelected ? 1.38 : 1.0, pulse, isSelected ? 1.38 : 1.0);
    }

    for (const b of riverBoats) {
      b.obj.position.y = b.baseY + Math.sin(elapsed * 1.5 + b.phase) * 0.06;
      b.obj.rotation.z = Math.sin(elapsed * 1.1 + b.phase) * 0.04;
    }

    for (const rp of rippleRings) {
      const cycle = ((elapsed * 0.42 + rp.phase) % 1);
      const sc = 0.75 + cycle * 1.5;
      rp.ring.scale.set(sc, sc, sc);
      rp.ring.material.opacity = (1 - cycle) * 0.42;
    }

    if (cascadePoints) {
      const posAttr = cascadePoints.geometry.getAttribute('position');
      for (let i = 0; i < cascadeVelocities.length; i++) {
        const meta = cascadeVelocities[i];
        if (meta.isCascade) {
          meta.prog = (meta.prog + dt * meta.speed) % 1;
          const t = meta.prog;
          posAttr.setXYZ(
            i,
            meta.p0x + (meta.p1x - meta.p0x) * t + meta.xOff * 0.65,
            1.56 - 8.04 * Math.pow(t, 1.45),
            meta.p0z + (meta.p1z - meta.p0z) * (0.75 * t + 0.25 * t * t)
          );
        } else {
          posAttr.setY(i, meta.baseY + Math.sin(elapsed * 1.4 + meta.phase) * 0.35);
        }
      }
      posAttr.needsUpdate = true;
    }

    renderOnceAndSync(elapsed);
  }
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => { bootCinema(); });
} else {
  bootCinema();
}
