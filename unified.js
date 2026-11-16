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
  { id: 'w-1', text: '在清舟星的小木屋前看了一会玫瑰，很治愈', stamp: '🌹', date: '昨夜', cheers: 18 },
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
  { id: 'works', t: 0.00, min: 0.00, max: 0.23, eyebrow: 'ZONE 01 · PLANET B-612', title: 'B-612 清舟星 · 星屋与摄影卫星' },
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
  } catch { /* ignore */ }
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
  darkroomWorkSlug: 'still-water',
  darkroomPhotoIdx: 0,
  darkroomZoomed: false,
  darkroomIntroOpen: false
};

let cameraTrack = [];
let posCurve = null;
let lookCurve = null;
let lastRenderedZone = '';
let lastStationKey = '';

let scene, camera, renderer;
let glbRoot = null;
let cosmosGroup = null;
let worldGroup = null;
let pointerLight = null;
const namedObjects = new Map();
const materialsByName = new Map();
const clickableRoots = [];
const cityBeaconMeshes = new Map();
const riverBoats = [];
const rippleRings = [];

let deepStarMat = null;
let b612MistMat = null;
let b612HaloMat = null;
const orreryShaderMats = [];
let waterShaderMat = null;
let cascadePoints = null;
let cascadeVelocities = [];
let bookCanvas = null;
let bookTex = null;

const b612Center = new THREE.Vector3(-1.35, 28.0, 29.0);
const markerElements = new Map();

function showToast(msg) {
  const el = document.getElementById('cinema-toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { el.hidden = true; }, 2900);
}

function trackToCurveU(t) {
  if (!cameraTrack.length) return 0;
  if (t <= cameraTrack[0].t) return 0;
  const last = cameraTrack.length - 1;
  if (t >= cameraTrack[last].t) return 1;
  for (let i = 0; i < last; i++) {
    const a = cameraTrack[i], b = cameraTrack[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      return (i + (t - a.t) / span) / last;
    }
  }
  return clamp(t, 0, 1);
}

function sampleFov(t) {
  if (!cameraTrack.length) return 47;
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
  if (t >= 0.13 && t <= 0.245) return { id: 'skylight', label: '降落清舟星 · 穿过天窗', strength: Math.sin(((t - 0.13) / 0.115) * Math.PI) };
  if (Math.abs(t - 0.61) < 0.05) return { id: 'window', label: '推开雕花木窗 · 见九州山河', strength: 0.7 };
  if (Math.abs(t - 0.86) < 0.045) return { id: 'cascade', label: '顺山河光瀑 · 停泊夜河归舟', strength: 0.65 };
  return null;
}

function makeStarTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 64;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.28, 'rgba(255,240,210,0.85)');
  grad.addColorStop(0.65, 'rgba(130,196,255,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cvs);
}

/* ---------- Refined Multi-Scale Starfield & Planetary Shaders ---------- */
function buildRefinedCosmosEffects() {
  cosmosGroup = new THREE.Group();
  cosmosGroup.name = 'QZ_Cosmos_Group';
  scene.add(cosmosGroup);

  worldGroup = new THREE.Group();
  worldGroup.name = 'QZ_Interior_World_Group';
  scene.add(worldGroup);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // 1. Deep 360-deg Crystal Starfield (fine 1.0px–2.2px dust + sparse twinkling cross-glint jewels)
  const starCount = 5200;
  const sPos = new Float32Array(starCount * 3);
  const sCol = new Float32Array(starCount * 3);
  const sSize = new Float32Array(starCount);
  const sPhase = new Float32Array(starCount);
  const sPalette = [
    new THREE.Color(0xdbe8ff),
    new THREE.Color(0xfff1d6),
    new THREE.Color(0xffd7a4),
    new THREE.Color(0xb6d8ff),
    new THREE.Color(0xa6f2e8)
  ];

  let seed = 314159;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < starCount; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = 34 + Math.pow(rand(), 0.62) * 86;
    sPos[i * 3] = b612Center.x + r * s * Math.cos(phi);
    sPos[i * 3 + 1] = 10 + r * u * 0.85;
    sPos[i * 3 + 2] = -15 + r * s * Math.sin(phi);

    const isBright = i % 16 === 0;
    sSize[i] = isBright ? (1.8 + rand() * 1.3) : (0.75 + Math.pow(rand(), 1.8) * 1.1);
    sPhase[i] = rand() * Math.PI * 2;

    const c = sPalette[i % sPalette.length];
    const lum = isBright ? (0.78 + rand() * 0.22) : (0.28 + rand() * 0.45);
    sCol[i * 3] = c.r * lum;
    sCol[i * 3 + 1] = c.g * lum;
    sCol[i * 3 + 2] = c.b * lum;
  }

  const deepGeo = new THREE.BufferGeometry();
  deepGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  deepGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  deepGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  deepGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPhase, 1));

  deepStarMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { scale: { value: dpr }, time: { value: 0 }, opacity: { value: 1 } },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTw;
      uniform float scale;
      uniform float time;
      void main() {
        vColor = color;
        vTw = 0.72 + 0.28 * sin(time * 2.1 + aPhase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(24.0 * aSize * scale / max(8.0, -mv.z), 1.1, 4.2);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      uniform float opacity;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = length(p);
        if (d > 0.5) discard;
        float core = exp(-d * d * 24.0);
        float glint = max(exp(-abs(p.x) * 16.0) * exp(-abs(p.y) * 5.0), exp(-abs(p.y) * 16.0) * exp(-abs(p.x) * 5.0));
        float a = clamp(core * 0.92 + glint * 0.35, 0.0, 1.0) * vTw * opacity;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  scene.add(new THREE.Points(deepGeo, deepStarMat));

  // 2. B-612 Orbiting Golden Stardust Halo (2,200 fine warm motes)
  const mCount = 2200;
  const mPos = new Float32Array(mCount * 3);
  const mCol = new Float32Array(mCount * 3);
  const mSize = new Float32Array(mCount);
  for (let i = 0; i < mCount; i++) {
    const r = 3.2 + Math.pow(rand(), 0.7) * 12.5;
    const th = rand() * Math.PI * 2;
    const y = (rand() - 0.5) * (1.2 + r * 0.26);
    mPos[i * 3] = Math.cos(th) * r;
    mPos[i * 3 + 1] = y;
    mPos[i * 3 + 2] = Math.sin(th) * r;
    mSize[i] = 0.65 + rand() * 1.1;
    const warm = i % 3 !== 0;
    const col = warm ? new THREE.Color(0xffdfa2) : new THREE.Color(0x9bd4ff);
    const l = 0.35 + rand() * 0.55;
    mCol[i * 3] = col.r * l;
    mCol[i * 3 + 1] = col.g * l;
    mCol[i * 3 + 2] = col.b * l;
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mistGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  mistGeo.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1));
  b612MistMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { scale: { value: dpr }, time: { value: 0 }, opacity: { value: 0.88 } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      varying float vTw;
      uniform float scale;
      uniform float time;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.78 + 0.22 * sin(time * 1.7 + position.x * 2.1 + position.z * 1.9);
        gl_PointSize = clamp(18.0 * aSize * scale / max(4.0, -mv.z), 1.0, 3.4);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      uniform float opacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float a = exp(-d * d * 20.0) * opacity * vTw;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  const mistPts = new THREE.Points(mistGeo, b612MistMat);
  mistPts.position.copy(b612Center);
  mistPts.rotation.x = 0.24;
  mistPts.rotation.z = -0.15;
  mistPts.name = 'B612_Stardust_Mist';
  cosmosGroup.add(mistPts);

  // 3. Soft Fairytale Golden Fresnel Atmosphere Sphere around B-612
  b612HaloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { opacity: { value: 0.78 }, glowColor: { value: new THREE.Color(0xffcb78) } },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      uniform float opacity;
      uniform vec3 glowColor;
      void main() {
        float ndv = abs(dot(normalize(vNormalView), normalize(vViewPos)));
        float glow = pow(smoothstep(0.06, 0.78, ndv), 2.2);
        gl_FragColor = vec4(glowColor, glow * opacity * 0.56);
        #include <colorspace_fragment>
      }
    `
  });
  const haloMesh = new THREE.Mesh(new THREE.SphereGeometry(2.92, 32, 24), b612HaloMat);
  haloMesh.position.copy(b612Center);
  cosmosGroup.add(haloMesh);

  // 4. Waterfall Cascade Sparks & Night River Fireflies in worldGroup
  const wCount = 720;
  const wPos = new Float32Array(wCount * 3);
  const wCol = new Float32Array(wCount * 3);
  cascadeVelocities = [];
  for (let i = 0; i < wCount; i++) {
    const isCascade = i < 360;
    let x, y, z;
    if (isCascade) {
      const east = i % 2 === 1;
      const p0x = east ? 8.1 : 5.4, p1x = east ? 2.2 : -1.8;
      const p0z = east ? -42.2 : -44.2, p1z = -62.5;
      const prog = rand();
      x = p0x + (p1x - p0x) * prog + (rand() - 0.5) * 0.8;
      y = 1.58 - 8.06 * Math.pow(prog, 1.45);
      z = p0z + (p1z - p0z) * (0.75 * prog + 0.25 * prog * prog);
      cascadeVelocities.push({ isCascade: true, prog, p0x, p1x, p0z, p1z, speed: 0.22 + rand() * 0.25, xOff: (rand() - 0.5) * 0.7 });
    } else {
      x = (rand() - 0.5) * 17;
      y = -6.1 + rand() * 7.8;
      z = -62 - rand() * 34;
      cascadeVelocities.push({ isCascade: false, phase: rand() * Math.PI * 2, baseX: x, baseY: y, baseZ: z });
    }
    wPos[i * 3] = x;
    wPos[i * 3 + 1] = y;
    wPos[i * 3 + 2] = z;
    const c = isCascade ? new THREE.Color(0x6df6e4) : new THREE.Color(0xffd280);
    wCol[i * 3] = c.r;
    wCol[i * 3 + 1] = c.g;
    wCol[i * 3 + 2] = c.b;
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
  wGeo.setAttribute('color', new THREE.BufferAttribute(wCol, 3));
  const wMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { scale: { value: dpr }, opacity: { value: 0.86 } },
    vertexShader: `
      varying vec3 vColor;
      uniform float scale;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(24.0 * scale / max(4.0, -mv.z), 1.2, 4.4);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float opacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float a = exp(-d * d * 18.0) * opacity;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  cascadePoints = new THREE.Points(wGeo, wMat);
  worldGroup.add(cascadePoints);
}

function attachOrreryPlanetShaders() {
  const specs = [
    { name: 'Orrery_0', day: 0x9bdcff, night: 0x16314c, rim: 0x62e5d0, ringA: 0x89d9ff, ringB: 0x4db8c8 },
    { name: 'Orrery_1', day: 0xffd28c, night: 0x3f2414, rim: 0xffe4a8, ringA: 0xf4c274, ringB: 0xd47848 },
    { name: 'Orrery_2', day: 0x8ef0bf, night: 0x153629, rim: 0x5fe2cc, ringA: 0x7ae6b8, ringB: 0x4ca6d8 }
  ];
  for (const sp of specs) {
    const orr = namedObjects.get(sp.name);
    if (!orr) continue;
    const lightDir = b612Center.clone().sub(orr.position).normalize();
    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        dayColor: { value: new THREE.Color(sp.day) },
        nightColor: { value: new THREE.Color(sp.night) },
        rimColor: { value: new THREE.Color(sp.rim) },
        lightDir: { value: lightDir }
      },
      vertexShader: `
        varying vec3 vNormalWorld;
        varying vec3 vNormalView;
        varying vec3 vPosLocal;
        void main() {
          vPosLocal = position;
          vNormalWorld = normalize(mat3(modelMatrix) * normal);
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 dayColor;
        uniform vec3 nightColor;
        uniform vec3 rimColor;
        uniform vec3 lightDir;
        varying vec3 vNormalWorld;
        varying vec3 vNormalView;
        varying vec3 vPosLocal;
        void main() {
          float ndl = dot(normalize(vNormalWorld), normalize(lightDir));
          float lit = smoothstep(-0.22, 0.72, ndl);
          float bands = sin(vPosLocal.y * 14.0 + sin(vPosLocal.x * 6.0) * 0.55) * 0.14;
          vec3 surface = mix(nightColor, dayColor * (1.0 + bands), lit);
          float rim = pow(clamp(1.0 - abs(vNormalView.z), 0.0, 1.0), 2.1);
          vec3 col = surface + rimColor * rim * (0.45 + 0.65 * lit);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `
    });
    const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 20), pMat);
    sphereMesh.name = `${sp.name}_CoreShader`;
    sphereMesh.userData.__qzInteractiveName = sp.name;
    orr.add(sphereMesh);
    orreryShaderMats.push(pMat);

    const ringGeo = new THREE.RingGeometry(0.84, 1.38, 64, 1);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        innerR: { value: 0.84 },
        outerR: { value: 1.38 },
        colA: { value: new THREE.Color(sp.ringA) },
        colB: { value: new THREE.Color(sp.ringB) }
      },
      vertexShader: 'varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float innerR; uniform float outerR; uniform vec3 colA; uniform vec3 colB; varying vec3 vPos;
        void main() {
          float r = length(vPos.xz);
          float u = clamp((r - innerR) / (outerR - innerR), 0.0, 1.0);
          float edge = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.86, 1.0, u));
          float cassini = 1.0 - 0.82 * exp(-pow((u - 0.60) / 0.05, 2.0));
          float fine = 0.78 + 0.22 * sin(u * 38.0);
          vec3 col = mix(colA, colB, u) * fine;
          gl_FragColor = vec4(col, edge * cassini * 0.78);
          #include <colorspace_fragment>
        }
      `
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.set(0.44, 0, -0.28);
    orr.add(ringMesh);
  }
}

function attachB612PlanetShader() {
  const body = namedObjects.get('B612_Asteroid_Body');
  if (!body) return;
  const planetMat = new THREE.ShaderMaterial({
    uniforms: {
      sunDir: { value: new THREE.Vector3(-0.45, 0.75, 0.65).normalize() }
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      void main() {
        vLocalPos = position;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDir;
      varying vec3 vLocalPos;
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      void main() {
        vec3 p = vLocalPos;
        vec3 nw = normalize(vNormalWorld);
        float ndl = dot(nw, normalize(sunDir));
        float lit = smoothstep(-0.28, 0.75, ndl);
        float hill = smoothstep(-0.35, 0.55, sin(p.x * 2.4 + 0.6) * cos(p.z * 2.1) + 0.5 * cos(p.y * 3.2));
        float micro = sin(p.x * 8.5 + p.y * 6.0) * cos(p.z * 7.5) * 0.04;
        vec3 honeyOchre = vec3(0.95, 0.76, 0.42);
        vec3 sageMeadow = vec3(0.45, 0.66, 0.42);
        vec3 twilight = vec3(0.26, 0.24, 0.34);
        vec3 daySoil = mix(honeyOchre, sageMeadow, hill * 0.68) + micro;
        vec3 surface = mix(twilight, daySoil, lit);
        float rim = pow(clamp(1.0 - abs(vNormalView.z), 0.0, 1.0), 2.3);
        vec3 col = surface + vec3(1.0, 0.84, 0.48) * rim * (0.28 + 0.42 * lit);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  body.traverse((child) => {
    if (child.isMesh && child.material && child.material.name === 'B612GoldSoil') {
      child.material = planetMat;
      child.userData.__qzInteractiveName = child.userData.__qzInteractiveName || 'B612_Asteroid_Body';
    }
  });
}

/* ---------- High-Res Procedural CanvasTexture Generators ---------- */
function paintXuanPaperBase(ctx, w, h) {
  ctx.fillStyle = '#f3ead7';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper fibers
  let seed = 4201;
  const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(138, 108, 72, 0.045)' : 'rgba(255, 252, 244, 0.08)';
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }

  // Spine fold shadow down the center x = w/2
  const spineGrad = ctx.createLinearGradient(w * 0.44, 0, w * 0.56, 0);
  spineGrad.addColorStop(0, 'rgba(62, 42, 24, 0)');
  spineGrad.addColorStop(0.5, 'rgba(42, 28, 16, 0.34)');
  spineGrad.addColorStop(1, 'rgba(62, 42, 24, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(w * 0.44, 0, w * 0.12, h);

  // Outer vignette edges
  const edgeL = ctx.createLinearGradient(0, 0, 36, 0);
  edgeL.addColorStop(0, 'rgba(78, 55, 32, 0.25)');
  edgeL.addColorStop(1, 'rgba(78, 55, 32, 0)');
  ctx.fillStyle = edgeL;
  ctx.fillRect(0, 0, 36, h);
  const edgeR = ctx.createLinearGradient(w - 36, 0, w, 0);
  edgeR.addColorStop(0, 'rgba(78, 55, 32, 0)');
  edgeR.addColorStop(1, 'rgba(78, 55, 32, 0.25)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(w - 36, 0, 36, h);

  // Classical Red 乌丝栏 Ruling frames for Right Page (544..986) & Left Page (38..480)
  const drawPageFrame = (x0, x1) => {
    const y0 = 62, y1 = h - 62;
    ctx.strokeStyle = 'rgba(166, 54, 42, 0.58)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x0 + 7, y0 + 7, x1 - x0 - 14, y1 - y0 - 14);
    const cols = 6;
    const step = (x1 - x0 - 14) / cols;
    ctx.strokeStyle = 'rgba(166, 54, 42, 0.28)';
    for (let c = 1; c < cols; c++) {
      const cx = x0 + 7 + c * step;
      ctx.beginPath();
      ctx.moveTo(cx, y0 + 7);
      ctx.lineTo(cx, y1 - 7);
      ctx.stroke();
    }
  };
  drawPageFrame(38, 480);
  drawPageFrame(544, 986);

  // Center edition fish-tail 版心 mark
  ctx.fillStyle = 'rgba(166, 54, 42, 0.65)';
  ctx.font = 'bold 26px "Noto Serif SC", "Songti SC", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('墨', w * 0.5, 190);
  ctx.fillText('盐', w * 0.5, 232);
}

function updateBookMoyanTexture() {
  const mat = materialsByName.get('BookSpreadMat');
  if (!mat) return;
  if (!bookCanvas) {
    bookCanvas = document.createElement('canvas');
    bookCanvas.width = 1024;
    bookCanvas.height = 1024;
  }
  const w = bookCanvas.width, h = bookCanvas.height;
  const ctx = bookCanvas.getContext('2d');
  paintXuanPaperBase(ctx, w, h);

  const notes = archive().notes || [];
  const poem = notes.find((n) => n.slug === state.selectedPoemSlug) || notes[0];
  if (poem) {
    const lines = poem.body.flatMap((s) => s.split('\n')).map((s) => s.trim()).filter(Boolean);
    // Prepare right-to-left vertical columns: 6 on Right Page (544..986), then 6 on Left Page (38..480)
    const rightCols = [];
    for (let c = 5; c >= 0; c--) rightCols.push(544 + 7 + (c + 0.5) * ((986 - 544 - 14) / 6));
    const leftCols = [];
    for (let c = 5; c >= 0; c--) leftCols.push(38 + 7 + (c + 0.5) * ((480 - 38 - 14) / 6));
    const allCols = [...rightCols, ...leftCols];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const toVertChar = (ch) => ({ '（': '︵', '(': '︵', '）': '︶', ')': '︶', '—': '丨', '「': '﹁', '」': '﹂' }[ch] || ch);

    // Col 0 (far right): Poem Title & date/place
    const titleChars = [...poem.title.slice(0, 14)];
    ctx.fillStyle = '#1b1713';
    ctx.font = 'bold 34px "Noto Serif SC", "Songti SC", Georgia, serif';
    titleChars.forEach((ch, idx) => {
      ctx.fillText(toVertChar(ch), allCols[0], 118 + idx * 44);
    });
    const metaStr = `${poem.date || ''}${poem.place ? ' · ' + poem.place : ''}`;
    ctx.fillStyle = '#8b2f24';
    ctx.font = '20px "Noto Serif SC", "Songti SC", Georgia, serif';
    [...metaStr.slice(0, 14)].forEach((ch, idx) => {
      ctx.fillText(toVertChar(ch), allCols[1], 122 + idx * 32);
    });

    // Poem body vertical lines across columns 2..11
    ctx.fillStyle = '#241e18';
    ctx.font = '28px "Noto Serif SC", "Songti SC", Georgia, serif';
    let colIdx = 2;
    for (const line of lines) {
      if (colIdx >= allCols.length) break;
      const chars = [...line];
      const maxPerCol = 18;
      for (let i = 0; i < chars.length; i += maxPerCol) {
        if (colIdx >= allCols.length) break;
        const slice = chars.slice(i, i + maxPerCol);
        const cx = allCols[colIdx++];
        slice.forEach((ch, rIdx) => {
          ctx.fillText(toVertChar(ch), cx, 114 + rIdx * 42);
        });
      }
    }

    // Vermilion Seal Stamp if stamped
    const seals = getSealsMap();
    if (seals[poem.slug]) {
      const sx = 94, sy = 760, sz = 78;
      ctx.fillStyle = 'rgba(198, 44, 30, 0.88)';
      ctx.fillRect(sx, sy, sz, sz);
      ctx.strokeStyle = '#f4ead7';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 5, sy + 5, sz - 10, sz - 10);
      ctx.fillStyle = '#f8efe0';
      ctx.font = 'bold 28px "Noto Serif SC", "Songti SC", serif';
      ctx.fillText('清', sx + sz * 0.5, sy + sz * 0.34);
      ctx.fillText('舟', sx + sz * 0.5, sy + sz * 0.72);
    }
  }

  if (!bookTex) {
    bookTex = new THREE.CanvasTexture(bookCanvas);
    bookTex.colorSpace = THREE.SRGBColorSpace;
    bookTex.flipY = false;
    bookTex.anisotropy = 4;
    mat.color.setHex(0xffffff);
    mat.map = bookTex;
    mat.emissive.setHex(0xfff4df);
    mat.emissiveMap = bookTex;
    mat.emissiveIntensity = 0.48;
    mat.needsUpdate = true;
  } else {
    bookTex.needsUpdate = true;
  }
}

function makeWalnutTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 1024;
  cvs.height = 512;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#3d2415';
  ctx.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 512; y += 2) {
    const shade = 22 + Math.sin(y * 0.055) * 10 + Math.cos(y * 0.14) * 5;
    ctx.fillStyle = `rgba(${Math.round(68 + shade)}, ${Math.round(38 + shade * 0.6)}, ${Math.round(20 + shade * 0.35)}, 0.45)`;
    ctx.fillRect(0, y, 1024, 2);
  }
  for (let k = 0; k < 28; k++) {
    ctx.strokeStyle = 'rgba(24, 12, 6, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const y0 = 14 + k * 18;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= 1024; x += 32) {
      ctx.lineTo(x, y0 + Math.sin(x * 0.015 + k) * 6);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

function makeBlueprintTexture(kind) {
  const cvs = document.createElement('canvas');
  cvs.width = 512;
  cvs.height = 384;
  const ctx = cvs.getContext('2d');
  const palettes = [
    { bg: '#0b2236', grid: 'rgba(130, 210, 255, 0.16)', ink: '#9ce6ff', title: 'L—004 · 绒绒', sub: 'RESONANT COMPANION' },
    { bg: '#0b2924', grid: 'rgba(95, 226, 204, 0.18)', ink: '#74f5db', title: 'L—002 · 机器的植物志', sub: 'MACHINE HERBARIUM' },
    { bg: '#261b12', grid: 'rgba(232, 184, 109, 0.20)', ink: '#ffd38a', title: 'L—003 · 记忆的地形', sub: 'TOPOGRAPHIC MEMORY' }
  ];
  const p = palettes[kind % 3];
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  for (let x = 24; x < 512; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke();
  }
  for (let y = 24; y < 384; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 348);

  // Geometric constellation / contour diagram
  ctx.beginPath();
  for (let r = 36; r <= 108; r += 24) {
    ctx.moveTo(310 + r, 198);
    ctx.arc(310, 198, r, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.fillStyle = p.ink;
  ctx.font = 'bold 26px "Noto Serif SC", Georgia, serif';
  ctx.fillText(p.title, 36, 70);
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(p.sub, 36, 100);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

function makeHerbariumSlideTexture(idx) {
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 512;
  const ctx = cvs.getContext('2d');
  const s = HERBARIUM_SAMPLES[idx] || HERBARIUM_SAMPLES[0];
  ctx.fillStyle = '#0e2824';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#6cf0d6';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 228, 484);

  // Draw stylized leaf vein specimen
  ctx.beginPath();
  ctx.moveTo(128, 390);
  ctx.bezierCurveTo(116, 260, 140, 170, 128, 65);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110, 240, 210, 0.25)';
  ctx.beginPath();
  ctx.ellipse(128, 220, 62, 128, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let y = 120; y <= 310; y += 34) {
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.lineTo(80, y - 22);
    ctx.moveTo(128, y);
    ctx.lineTo(176, y - 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#d4fff5';
  ctx.font = 'bold 24px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.tag, 128, 438);
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillText(s.latin.slice(0, 22), 128, 466);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

function applyProceduralPBRTextures() {
  const deskMat = materialsByName.get('DeskTopWood');
  if (deskMat) {
    const tex = makeWalnutTexture();
    deskMat.color.setHex(0xffffff);
    deskMat.map = tex;
    deskMat.bumpMap = tex;
    deskMat.bumpScale = 0.015;
    deskMat.needsUpdate = true;
  }

  for (let i = 0; i < 3; i++) {
    const bp = materialsByName.get(`LabBlueprintMat_${i}`);
    if (bp) {
      const tex = makeBlueprintTexture(i);
      bp.color.setHex(0xffffff);
      bp.map = tex;
      bp.emissive.setHex(0xffffff);
      bp.emissiveMap = tex;
      bp.emissiveIntensity = 0.65;
      bp.needsUpdate = true;
    }
  }

  for (let i = 0; i < 4; i++) {
    const sm = materialsByName.get(`HerbariumSlideMat_${i}`);
    if (sm) {
      const tex = makeHerbariumSlideTexture(i);
      sm.color.setHex(0xffffff);
      sm.map = tex;
      sm.emissive.setHex(0xffffff);
      sm.emissiveMap = tex;
      sm.emissiveIntensity = 0.72;
      sm.needsUpdate = true;
    }
  }

  updateBookMoyanTexture();
}

/* ---------- GLSL Night River Reflection & Ripple Shader ---------- */
function upgradeRiverBedShader() {
  const riverObj = namedObjects.get('River_Bed');
  if (!riverObj) return;
  const boatUniforms = Array.from({ length: 6 }, (_, i) => {
    const b = riverBoats[i];
    return b ? new THREE.Vector3(b.obj.position.x, b.obj.position.y, b.obj.position.z - 1.1) : new THREE.Vector3(0, -6.5, -75);
  });

  waterShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBoats: { value: boatUniforms }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uBoats[6];
      varying vec3 vWorldPos;
      void main() {
        vec2 p = vWorldPos.xz;
        float w1 = sin(p.x * 2.1 + uTime * 1.45) * cos(p.y * 1.7 - uTime * 1.25);
        float w2 = sin((p.x * 0.8 + p.y * 1.3) * 3.4 - uTime * 2.1) * 0.5;
        float wave = (w1 + w2) * 0.5;

        float bankDark = 1.0 - smoothstep(4.5, 11.5, abs(p.x)) * 0.45;
        vec3 baseCol = mix(vec3(0.015, 0.042, 0.068), vec3(0.036, 0.095, 0.128), 0.5 + 0.5 * wave) * bankDark;

        // Jade waterfall inflow glow around z = -62.5
        float cascadeDist = length((p - vec2(0.2, -62.5)) * vec2(0.42, 0.35));
        baseCol += vec3(0.14, 0.56, 0.52) * exp(-cascadeDist * cascadeDist * 0.45) * 0.55;

        // Golden swaying lantern reflection columns from 6 boats
        vec3 refl = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          vec2 b = uBoats[i].xz;
          float dx = abs(p.x - b.x + wave * 0.24);
          float dz = p.y - b.y;
          float spread = 0.26 + 0.08 * abs(dz);
          float core = exp(-(dx * dx) / (spread * spread)) * exp(-(dz * dz) / 7.5);
          float shimmer = 0.62 + 0.38 * sin(p.y * 6.5 + uTime * 3.8 + float(i) * 1.7 + wave * 2.5);
          refl += vec3(1.0, 0.68, 0.24) * core * shimmer * 0.92;
        }

        // Quayside canal house warm window shimmer near x = +-7.6
        for (int k = 0; k < 4; k++) {
          float wz = -67.0 - float(k) * 9.5;
          float dzl = abs(p.y - wz);
          float dxl = abs(abs(p.x) - 7.6 + wave * 0.16);
          float wRef = exp(-dxl * dxl * 0.85) * exp(-dzl * dzl * 0.22);
          refl += vec3(0.95, 0.58, 0.20) * wRef * 0.38;
        }

        vec3 finalCol = baseCol + refl;
        gl_FragColor = vec4(finalCol, 1.0);
        #include <colorspace_fragment>
      }
    `
  });

  riverObj.traverse((child) => {
    if (child.isMesh) {
      child.material = waterShaderMat;
    }
  });
}

function setupLighting() {
  // Chiaroscuro balance: rich nocturnal depth + warm amber focal pools
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x16221e, 0.52));
  scene.add(new THREE.AmbientLight(0x88a4cc, 0.24));

  const moonDir = new THREE.DirectionalLight(0xfff0d2, 1.05);
  moonDir.position.set(-14, 42, 34);
  scene.add(moonDir);

  const rimDir = new THREE.DirectionalLight(0x76e8d6, 0.55);
  rimDir.position.set(16, 18, -56);
  scene.add(rimDir);

  const addBeaconLight = (color, intensity, distance, x, y, z) => {
    const pt = new THREE.PointLight(color, intensity, distance, 1.35);
    pt.position.set(x, y, z);
    scene.add(pt);
    return pt;
  };
  addBeaconLight(0xffcf88, 2.5, 32, -1.35, 31.8, 30.2); // Zone 1 B-612 cottage warm lamp
  addBeaconLight(0xffca82, 2.5, 18, -3.65, 10.6, -5.85); // Zone 2 Study Book_Moyan
  addBeaconLight(0xffb662, 2.6, 18, 5.2, 10.2, -6.2);    // Zone 3 Lab Desk Lamp
  addBeaconLight(0x80f2dc, 2.4, 42, 0.0, 12.2, -42.0);   // Zone 4 China Topo
  addBeaconLight(0xffb45a, 2.7, 36, -3.5, -2.2, -74.0);  // Zone 5 River Eave Lantern
  addBeaconLight(0xffcb78, 2.3, 36, 0.0, -2.5, -86.0);   // Zone 5 Arched Bridge & Canal

  pointerLight = new THREE.PointLight(0xffecc2, 0.75, 16, 1.6);
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
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(boat.position.x, -6.47, boat.position.z);
    worldGroup.add(ring);
    rippleRings.push({ ring, boat, phase: i * 1.1 });
  }
}

const INTERACTIVE_NAME_RE = /^(B612_Asteroid_Body|B612_Cottage|B612_Rose_Cloche|Orrery_\d+|Book_Moyan|ZhuSha_Seal_Block|Herbarium_Specimen_Box|Lab_Plate_\d+|City_Beacon_\d+|River_Boat_Lantern_\d+|Roof_Cat_3D|Roof_Windchime)$/;

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
  if (name === 'B612_Asteroid_Body' || name === 'B612_Cottage') {
    playChimeSound();
    flyTo(0.32, { toast: '穿过清舟星木屋天窗，降落二层《墨盐》书房 ✨' });
    return;
  }
  if (name === 'B612_Rose_Cloche') {
    playChimeSound();
    showToast('小王子在玻璃钟罩下照料着他的玫瑰与微光清晨 🌹');
    return;
  }
  if (name === 'Orrery_0') return openDarkroomViewer('still-water', 0);
  if (name === 'Orrery_1') return openDarkroomViewer('shape-of-light', 0);
  if (name === 'Orrery_2') return openDarkroomViewer('long-afternoon', 0);
  if (name === 'Roof_Windchime') {
    playChimeSound();
    showToast('檐角铜铃清响了一声，星光正在落入阁楼');
    return;
  }
  if (name === 'Book_Moyan') return openPoemDossier(state.selectedPoemSlug);
  if (name === 'ZhuSha_Seal_Block') {
    const stamped = togglePoemSeal(state.selectedPoemSlug);
    playWoodTapSound();
    updateBookMoyanTexture();
    showToast(stamped ? '已在《墨盐》书页钤下「清舟」朱砂印' : '已拭去书页朱砂印记');
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
    if (place) selectCity(place.name, true);
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
  if (t < 0.17) {
    specs.push(
      { id: 'B612_Cottage', label: '清舟星木屋 · 点击降落 ↘', tone: 'gold', dy: 2.55 },
      { id: 'Orrery_0', label: 'P—001 在寂静的岸边', tone: 'gold', dy: 1.35 },
      { id: 'Orrery_1', label: 'P—002 光的形状', tone: 'gold', dy: 1.12 },
      { id: 'Orrery_2', label: 'P—003 漫长的下午', tone: 'jade', dy: 1.30 }
    );
  } else if (t < 0.25) {
    specs.push({ id: 'Roof_Windchime', label: '天窗铜铃', tone: 'gold', dy: 0.45 });
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
      { id: 'Roof_Cat_3D', label: '檐上夜猫', tone: 'gold', dy: 0.90 },
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
    if (!activeIds.has(id)) btn.style.display = 'none';
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

    if (spec.id === 'B612_Cottage') {
      projVec.set(b612Center.x, b612Center.y + spec.dy, b612Center.z);
    } else {
      targetObj.getWorldPosition(projVec);
      projVec.y += spec.dy || 0.8;
    }
    projVec.project(camera);

    const visible = projVec.z >= -1 && projVec.z <= 1;
    const sx = (projVec.x * 0.5 + 0.5) * w;
    const sy = (-projVec.y * 0.5 + 0.5) * h;

    const padX = w < 600 ? 78 : 44;
    const padTop = w < 600 ? 136 : 72;
    const padBot = w < 600 ? 112 : 72;
    if (!visible || sx < padX || sx > w - padX || sy < padTop || sy > h - padBot) {
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
  updateBookMoyanTexture();
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
      <p class="deck-lead">悬浮于暖金星雾中的 B-612 清舟星与三枚摄影卫星。点击任意卫星或摄影卷，即可开启全屏暗房高清观片台；点击星顶木屋，即可降落入阁楼书房。</p>
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
        <button type="button" class="deck-action-btn" data-fly-t="0.32">↓ 降落清舟星 · 走入《墨盐》阁楼</button>
      </div>
    `;
    body.querySelectorAll('[data-open-work]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedWorkSlug = btn.dataset.openWork;
        openDarkroomViewer(btn.dataset.openWork, 0);
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
      b.addEventListener('click', () => {
        state.poemCategory = b.dataset.poemCat;
        const nextList = state.poemCategory === '全部' ? notes : notes.filter((n) => (n.category || '其他作品') === state.poemCategory);
        if (nextList.length && !nextList.some((x) => x.slug === state.selectedPoemSlug)) {
          state.selectedPoemSlug = nextList[0].slug;
        }
        updateBookMoyanTexture();
        renderStationDeck(true);
      });
    });
    body.querySelectorAll('[data-poem-select]').forEach((b) => {
      b.addEventListener('click', () => {
        state.selectedPoemSlug = b.dataset.poemSelect;
        playWoodTapSound();
        updateBookMoyanTexture();
        renderStationDeck(true);
      });
    });
    body.querySelector('#btn-open-poem-dossier')?.addEventListener('click', () => openPoemDossier(state.selectedPoemSlug));
    body.querySelector('#btn-seal-poem')?.addEventListener('click', () => {
      if (!activePoem) return;
      const stamped = togglePoemSeal(activePoem.slug);
      playWoodTapSound();
      updateBookMoyanTexture();
      showToast(stamped ? `已在《${activePoem.title}》书页钤下朱砂印` : '已取消当前印记');
      renderStationDeck(true);
    });
    body.querySelector('#btn-fly-poem-city')?.addEventListener('click', () => {
      if (!activePoem?.place) return;
      flyTo(0.75, { cityName: activePoem.place, toast: `沿《${activePoem.title}》山河坐标飞向 ${activePoem.place}` });
    });
  } else if (station.id === 'labs') {
    const labs = archive().labs || [];
    const activeLab = labs.find((l) => l.slug === state.selectedLabSlug) || labs[0];
    const labIntroText = activeLab ? (Array.isArray(activeLab.intro) ? activeLab.intro[0] : activeLab.intro) || activeLab.en || '' : '';
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
      <p class="deck-lead">顺山河光瀑滑落江南水乡夜泊处。马头墙与雕花夜窗倒映微光，黑猫守在青瓦屋檐上，六盏乌篷小舟浮沉其间。</p>
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
        <button type="button" class="deck-action-btn" data-fly-t="0.00">↺ 重新起飞 · 回到 B-612 清舟星</button>
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

/* ---------- Fullscreen Darkroom Contact-Sheet Photography Viewer ---------- */
function getWorkPhotos(work) {
  const keys = work?.photos || [];
  return keys.map((k, idx) => {
    const meta = archive().images[k] || {};
    const capText = Array.isArray(work.captions)
      ? work.captions[idx]
      : (work.captions && work.captions[k]);
    return {
      key: k,
      src: imgSrc(k, 1600),
      thumb: imgSrc(k, 640),
      cap: capText || meta.alt || `${work.title} · No.${idx + 1}`,
      alt: meta.alt || '',
      credit: meta.credit || ''
    };
  });
}

function renderDarkroomViewer() {
  const modal = document.getElementById('darkroom-modal');
  const tabsEl = document.getElementById('dr-tabs');
  const mainImg = document.getElementById('dr-main-img');
  const counterEl = document.getElementById('dr-counter');
  const capMain = document.getElementById('dr-caption-main');
  const capCredit = document.getElementById('dr-caption-credit');
  const stripEl = document.getElementById('dr-filmstrip');
  const introTitle = document.getElementById('dr-intro-title');
  const introMeta = document.getElementById('dr-intro-meta');
  const introText = document.getElementById('dr-intro-text');
  const imgWrap = document.getElementById('dr-img-wrap');
  const zoomBtn = document.getElementById('dr-zoom-btn');
  if (!modal || !tabsEl || !mainImg) return;

  const works = archive().works || [];
  const activeWork = works.find((w) => w.slug === state.darkroomWorkSlug) || works[0];
  if (!activeWork) return;
  state.darkroomWorkSlug = activeWork.slug;
  state.selectedWorkSlug = activeWork.slug;

  const photos = getWorkPhotos(activeWork);
  state.darkroomPhotoIdx = clamp(state.darkroomPhotoIdx, 0, Math.max(0, photos.length - 1));
  const cur = photos[state.darkroomPhotoIdx];

  tabsEl.innerHTML = works.map((w) => `
    <button type="button" class="dr-tab${w.slug === activeWork.slug ? ' is-active' : ''}" data-dr-work="${esc(w.slug)}" role="tab" aria-selected="${w.slug === activeWork.slug}">
      <span class="dr-tab-id">${esc(w.id)}</span>
      <span>${esc(w.title)}</span>
    </button>
  `).join('');

  tabsEl.querySelectorAll('[data-dr-work]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.darkroomWorkSlug = btn.dataset.drWork;
      state.darkroomPhotoIdx = 0;
      state.darkroomZoomed = false;
      playWoodTapSound();
      renderDarkroomViewer();
    });
  });

  if (cur) {
    mainImg.src = cur.src;
    mainImg.alt = cur.alt || cur.cap;
    capMain.textContent = cur.cap;
    capCredit.textContent = cur.credit ? `摄影致谢：${cur.credit}` : `${activeWork.medium || ''}`;
  }
  counterEl.textContent = `${String(state.darkroomPhotoIdx + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;

  if (imgWrap) imgWrap.classList.toggle('is-zoomed', state.darkroomZoomed);
  if (zoomBtn) zoomBtn.setAttribute('aria-pressed', String(state.darkroomZoomed));

  const introStr = Array.isArray(activeWork.intro) ? activeWork.intro.join('\n') : (activeWork.intro || '');
  if (introMeta) introMeta.textContent = `${activeWork.id} · ${activeWork.en || ''} · ${activeWork.year || ''}`;
  if (introTitle) introTitle.textContent = activeWork.title;
  if (introText) introText.textContent = introStr;

  stripEl.innerHTML = photos.map((p, idx) => `
    <button type="button" class="dr-thumb-btn${idx === state.darkroomPhotoIdx ? ' is-active' : ''}" data-dr-idx="${idx}" title="${esc(p.cap)}">
      <img src="${esc(p.thumb)}" alt="${esc(p.cap)}" />
    </button>
  `).join('');
  stripEl.querySelectorAll('[data-dr-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.darkroomPhotoIdx = Number(btn.dataset.drIdx);
      state.darkroomZoomed = false;
      playWoodTapSound();
      renderDarkroomViewer();
    });
  });
}

function openDarkroomViewer(workSlug, photoIdx = 0) {
  const modal = document.getElementById('darkroom-modal');
  if (!modal) return;
  playChimeSound();
  state.darkroomWorkSlug = workSlug || state.selectedWorkSlug || 'still-water';
  state.darkroomPhotoIdx = photoIdx;
  state.darkroomZoomed = false;
  state.darkroomIntroOpen = false;
  const drawer = document.getElementById('dr-intro-drawer');
  const introBtn = document.getElementById('dr-intro-toggle');
  if (drawer) drawer.hidden = true;
  if (introBtn) introBtn.setAttribute('aria-expanded', 'false');
  renderDarkroomViewer();
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
}

function closeDarkroomViewer() {
  const modal = document.getElementById('darkroom-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  state.darkroomZoomed = false;
}

function stepDarkroomPhoto(delta) {
  const works = archive().works || [];
  const activeWork = works.find((w) => w.slug === state.darkroomWorkSlug) || works[0];
  if (!activeWork || !activeWork.photos?.length) return;
  const n = activeWork.photos.length;
  state.darkroomPhotoIdx = (state.darkroomPhotoIdx + delta + n) % n;
  state.darkroomZoomed = false;
  playWoodTapSound();
  renderDarkroomViewer();
}

/* ---------- Dossier Reading Overlay (Poetry / Labs / About) ---------- */
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

function openPoemDossier(slug) {
  const notes = archive().notes || [];
  const p = notes.find((x) => x.slug === slug) || notes[0];
  if (!p) return;
  state.selectedPoemSlug = p.slug;
  updateBookMoyanTexture();
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
    <p>欢迎光临《清舟的杂货铺》v2.0 一镜到底立体剧场版。</p>
    <p>本版由 <strong>Blender 4.2.9 LTS</strong>（截面放样 Lofting、旋转车床 Lathe、程序化 UV）与 <strong>Three.js Custom GLSL Shaders</strong> 联袂呈现：</p>
    <ul>
      <li><strong>第一境 · B-612 清舟星</strong>（摄影卫星）：悬浮于多尺度闪烁星海中的暖金童话星球，星球上坐落着江南小木屋、屋顶黑猫、玻璃钟罩玫瑰与发光小溪；三枚昼夜晨昏线摄影卫星环绕其旁，点击卫星直入全屏暗房高清观片台。</li>
      <li><strong>降落转场 · Skylight Expansion</strong>：点击星屋或向下滚动，穿入 B-612 天窗光雾，无缝展开为 360° 围合的暖灯木阁楼。</li>
      <li><strong>第二境 · 墨盐书房</strong>（诗集案左）：拱形弯曲玄纸双页《墨盐》随当前所选诗篇与「清舟」朱砂印实时重绘 1024px 竖排书法纹理，配以歙砚、青瓷茶盏与山峦笔搁。</li>
      <li><strong>第三境 · 月下实验桌</strong>（长案右）：黄铜蛇颈台灯、翠绿玻璃灯罩映照下的青花蓝图板与四枚植物学标本玻匣。</li>
      <li><strong>木窗门户 · Dynamic Sash</strong>：苏式雕花对开木窗随镜头临近自动缓缓推开，迎面展开双层台地华夏山河与浑仪罗盘底座。</li>
      <li><strong>第五境 · 屋檐与乌篷归舟</strong>：9 肋放样弧形乌篷灯船在 GLSL 动态水波与金色灯影倒映中轻轻摇曳，马头墙民居与飞檐黑猫静守水乡夜色。</li>
    </ul>
    <p style="color:var(--ink-muted);">原版独立平面多系统档案已完整备份保留于 <a href="./archive.html" style="color:var(--gold-brass);">./archive.html</a>，互不覆盖。</p>
  `;
  openDossier('COLOPHON · 一镜到底空间志 v2.0', '关于清舟的立体杂货铺', html);
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
      } catch { /* ignore */ }
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
  if (vignette && portal) {
    vignette.style.setProperty('--portal-strength', portal.strength.toFixed(3));
  }
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

function updateSceneStageIsolations(t) {
  if (!cosmosGroup || !worldGroup) return;
  // Stage Isolation: ZERO floating roof/floor appears behind B-612 for t <= 0.13!
  const inPureCosmos = t <= 0.135;
  const inDeepInterior = t >= 0.255;

  cosmosGroup.visible = !inDeepInterior;
  worldGroup.visible = !inPureCosmos;

  if (inPureCosmos) {
    cosmosGroup.scale.setScalar(1);
    cosmosGroup.position.set(0, 0, 0);
  } else if (!inDeepInterior) {
    const u = clamp((t - 0.135) / 0.12, 0, 1);
    if (b612MistMat) b612MistMat.uniforms.opacity.value = (1 - u) * 0.88;
    if (b612HaloMat) b612HaloMat.uniforms.opacity.value = (1 - u) * 0.78;
  } else {
    if (b612MistMat) b612MistMat.uniforms.opacity.value = 0.88;
    if (b612HaloMat) b612HaloMat.uniforms.opacity.value = 0.78;
  }

  // Dynamic Window Sash Swing as camera approaches portal-2 (t: 0.50 -> 0.62)
  const winFactor = THREE.MathUtils.smoothstep(t, 0.50, 0.62);
  const swingAngle = 0.04 + winFactor * 1.22;
  const sashL = namedObjects.get('Window_Sash_L');
  const sashR = namedObjects.get('Window_Sash_R');
  if (sashL) sashL.rotation.y = swingAngle;
  if (sashR) sashR.rotation.y = -swingAngle;
}

function bindEvents(canvas) {
  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('wheel', (e) => {
    const dr = document.getElementById('darkroom-modal');
    if (dr && !dr.hidden) return;
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
    if (e.target.closest('#timeline-rail, #station-deck, #dossier-modal, #darkroom-modal, #hud-topbar')) return;
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
      const hits = rc.intersectObjects(clickableRoots, true).filter((h) => {
        let p = h.object;
        while (p) { if (p.visible === false) return false; p = p.parent; }
        return true;
      });
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
      const hits = rc.intersectObjects(clickableRoots, true).filter((h) => {
        let p = h.object;
        while (p) { if (p.visible === false) return false; p = p.parent; }
        return true;
      });
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

  // Darkroom Modal Bindings
  document.getElementById('dr-close')?.addEventListener('click', closeDarkroomViewer);
  document.getElementById('dr-prev')?.addEventListener('click', () => stepDarkroomPhoto(-1));
  document.getElementById('dr-next')?.addEventListener('click', () => stepDarkroomPhoto(1));
  document.getElementById('dr-zoom-btn')?.addEventListener('click', () => {
    state.darkroomZoomed = !state.darkroomZoomed;
    renderDarkroomViewer();
  });
  document.getElementById('dr-main-img')?.addEventListener('click', () => {
    state.darkroomZoomed = !state.darkroomZoomed;
    renderDarkroomViewer();
  });
  document.getElementById('dr-intro-toggle')?.addEventListener('click', () => {
    state.darkroomIntroOpen = !state.darkroomIntroOpen;
    const drawer = document.getElementById('dr-intro-drawer');
    const btn = document.getElementById('dr-intro-toggle');
    if (drawer) drawer.hidden = !state.darkroomIntroOpen;
    if (btn) btn.setAttribute('aria-expanded', String(state.darkroomIntroOpen));
  });
  document.getElementById('dr-fly-study-btn')?.addEventListener('click', () => {
    closeDarkroomViewer();
    flyTo(0.32, { toast: '穿过星屋天窗，步入二层《墨盐》阁楼' });
  });

  window.addEventListener('keydown', (e) => {
    const dr = document.getElementById('darkroom-modal');
    if (dr && !dr.hidden) {
      if (e.key === 'Escape') return closeDarkroomViewer();
      if (e.key === 'ArrowLeft') return stepDarkroomPhoto(-1);
      if (e.key === 'ArrowRight') return stepDarkroomPhoto(1);
      return;
    }
    if (e.key === 'Escape') {
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

  tmpTarget.x += state.pointerX * 0.42;
  tmpTarget.y += state.pointerY * 0.24 + Math.sin(elapsedSec * 0.6) * 0.025;

  const portrait = camera.aspect < 0.85;
  if (portrait && t < 0.24) {
    const b612W = 1 - THREE.MathUtils.smoothstep(t, 0.12, 0.24);
    const narrow = clamp((0.85 - camera.aspect) / 0.39, 0, 1.35);
    tmpPos.x -= 0.45 * b612W * narrow;
    tmpPos.y += 1.15 * b612W * narrow;
    tmpPos.z += 9.6 * b612W * narrow;
    tmpTarget.x -= 0.65 * b612W * narrow;
    tmpTarget.y -= 1.10 * b612W * narrow;
  }
  camera.position.copy(tmpPos);
  camera.fov = sampleFov(t) + (portrait ? (0.85 - camera.aspect) * 32 : 0);
  camera.updateProjectionMatrix();
  camera.lookAt(tmpTarget);

  if (pointerLight) {
    pointerLight.position.set(tmpTarget.x, tmpTarget.y + 1.5, tmpTarget.z);
  }
}

function renderOnceAndSync(nowSec = 0) {
  updateSceneStageIsolations(state.currentT);
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
  scene.background = new THREE.Color(0x040812);
  scene.fog = new THREE.FogExp2(0x040812, 0.0072);

  camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.1, 240);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  setupLighting();
  buildRefinedCosmosEffects();
  bindEvents(canvas);

  try {
    if (statusEl) statusEl.textContent = '载入 B-612 长镜头轨线…';
    const camRes = await fetch('./assets/qingzhou-world-camera.json');
    const camJson = await camRes.json();
    cameraTrack = camJson.cameraTrack || [];
    posCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.pos)), false, 'catmullrom', 0.35);
    lookCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.target)), false, 'catmullrom', 0.35);

    if (statusEl) statusEl.textContent = '载入 Blender 实体空间建筑 (GLB)…';
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./assets/qingzhou-world.glb');
    glbRoot = gltf.scene;

    // Partition top-level GLB nodes into cosmosGroup (B612_* / Orrery_*) vs worldGroup
    const topNodes = [...glbRoot.children];
    for (const node of topNodes) {
      if (/^(B612_|Orrery_)/.test(node.name || '')) {
        cosmosGroup.add(node);
      } else {
        worldGroup.add(node);
      }
    }

    scene.traverse((obj) => {
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m.name && !materialsByName.has(m.name)) {
            materialsByName.set(m.name, m);
          }
        }
      }
      if (!obj.name) return;
      if (!namedObjects.has(obj.name)) namedObjects.set(obj.name, obj);
      if (INTERACTIVE_NAME_RE.test(obj.name)) {
        obj.userData.__qzInteractiveName = obj.name;
        clickableRoots.push(obj);
      }
      const beaconMatch = obj.name.match(/^City_Beacon_(\d+)$/);
      if (beaconMatch) {
        cityBeaconMeshes.set(Number(beaconMatch[1]), { obj, baseScaleY: obj.scale.y || 1 });
      }
      if (/^River_Boat_Lantern_(\d+)$/.test(obj.name)) {
        riverBoats.push({ obj, baseY: obj.position.y, phase: riverBoats.length * 1.15 });
      }
    });

    attachOrreryPlanetShaders();
    attachB612PlanetShader();
    applyProceduralPBRTextures();
    upgradeRiverBedShader();
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
  window.__qzOpenDarkroom = (workSlug, photoIdx = 0) => openDarkroomViewer(workSlug, photoIdx);
  window.__qzSetPoem = (slug) => {
    state.selectedPoemSlug = slug;
    updateBookMoyanTexture();
    renderStationDeck(true);
  };
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
    cosmosVisible: Boolean(cosmosGroup?.visible),
    worldVisible: Boolean(worldGroup?.visible),
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

    if (deepStarMat) deepStarMat.uniforms.time.value = elapsed;
    if (b612MistMat) b612MistMat.uniforms.time.value = elapsed;

    const starRing = namedObjects.get('B612_Star_Ring');
    if (starRing) starRing.rotation.y = elapsed * 0.20;

    for (let i = 0; i < 3; i++) {
      const orr = namedObjects.get(`Orrery_${i}`);
      if (orr) {
        orr.rotation.y = elapsed * (0.28 + i * 0.06);
        orr.rotation.x = Math.sin(elapsed * 0.4 + i) * 0.12;
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

    for (let i = 0; i < riverBoats.length; i++) {
      const b = riverBoats[i];
      b.obj.position.y = b.baseY + Math.sin(elapsed * 1.5 + b.phase) * 0.055;
      b.obj.rotation.z = Math.sin(elapsed * 1.1 + b.phase) * 0.038;
      if (waterShaderMat && waterShaderMat.uniforms.uBoats.value[i]) {
        waterShaderMat.uniforms.uBoats.value[i].set(b.obj.position.x, b.obj.position.y, b.obj.position.z - 1.1);
      }
    }
    if (waterShaderMat) waterShaderMat.uniforms.uTime.value = elapsed;

    for (const rp of rippleRings) {
      const cycle = ((elapsed * 0.42 + rp.phase) % 1);
      const sc = 0.75 + cycle * 1.5;
      rp.ring.scale.set(sc, sc, sc);
      rp.ring.material.opacity = (1 - cycle) * 0.38;
    }

    if (cascadePoints && worldGroup?.visible) {
      const posAttr = cascadePoints.geometry.getAttribute('position');
      for (let i = 0; i < cascadeVelocities.length; i++) {
        const meta = cascadeVelocities[i];
        if (meta.isCascade) {
          meta.prog = (meta.prog + dt * meta.speed) % 1;
          const t = meta.prog;
          posAttr.setXYZ(
            i,
            meta.p0x + (meta.p1x - meta.p0x) * t + meta.xOff * 0.65,
            1.58 - 8.06 * Math.pow(t, 1.45),
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
