import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { EffectComposer } from './vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/postprocessing/OutputPass.js';
import {
  B612_CENTER,
  B612_AIM_POINT,
  B612_WINDOW_WORLD,
  B612_LANDING_POS_DESKTOP,
  B612_LANDING_POS_PORTRAIT,
  COSMOS_CENTER,
  COSMOS_R_MAX,
  COSMOS_R_HARD,
  ROAM_HOME_POS,
  ROAM_HOME_YAW,
  ROAM_HOME_PITCH,
  shortestAngleDelta,
  computeAimYawPitch,
  hideOrreryNodes,
  sculptB612TwilightLook,
  createScatteredPhotoFrames,
  updatePhotoFrames,
  updateStarGuidePip
} from './cosmos-slice.js';

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
const prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const state = {
  mode: 'roam',
  targetT: 0.0,
  currentT: 0.0,
  autoPlay: false,
  lastWheelAt: 0,
  pointerX: 0,
  pointerY: 0,
  activeStationId: 'works',
  activePortal: 'none',
  deckCollapsed: typeof window !== 'undefined' && window.innerWidth <= 900,
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
  darkroomPanX: 0,
  darkroomPanY: 0,
  darkroomLoadingToken: 0,
  darkroomIntroOpen: false
};

const BASE_BLOOM_STRENGTH = 0.52;
const STATION_BLOOM_STRENGTH = 0.24;
const BASE_BLOOM_RADIUS = 0.58;
const BASE_BLOOM_THRESHOLD = 0.78;
const STATION_BLOOM_THRESHOLD = 0.85;
const BASE_EXPOSURE = 1.18;

const roamState = {
  position: ROAM_HOME_POS.clone(),
  velocity: new THREE.Vector3(),
  yaw: ROAM_HOME_YAW,
  pitch: ROAM_HOME_PITCH,
  targetYaw: ROAM_HOME_YAW,
  targetPitch: ROAM_HOME_PITCH,
  flight: null,
  keys: new Set(),
  glidePadActive: false
};

let matchCutState = null;
let photoFrames = [];

let activeModalEl = null;
let lastFocusBeforeModal = null;

function openModalFocus(modal) {
  if (!modal) return;
  if (!activeModalEl) lastFocusBeforeModal = document.activeElement;
  activeModalEl = modal;
  requestAnimationFrame(() => {
    const first = modal.querySelector('button:not([hidden]):not([disabled]), a[href], input, select, [tabindex="0"]');
    first?.focus({ preventScroll: true });
  });
}

function closeModalFocus() {
  activeModalEl = null;
  if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === 'function' && lastFocusBeforeModal.isConnected) {
    lastFocusBeforeModal.focus({ preventScroll: true });
  }
  lastFocusBeforeModal = null;
}

function handleModalTabTrap(e) {
  if (e.key !== 'Tab' || !activeModalEl || activeModalEl.hidden) return;
  const focusables = [...activeModalEl.querySelectorAll('button:not([hidden]):not([disabled]), a[href]:not([hidden]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

let cameraTrack = [];
let posCurve = null;
let lookCurve = null;
let lastRenderedZone = '';
let lastStationKey = '';
let lastHudT = -1;
let hoveredTargetName = null;
const hoverMaterials = new Map();

let scene, camera, renderer;
let composer = null;
let renderPass = null;
let bloomPass = null;
let outputPass = null;
let hemiLight = null;
let ambientLight = null;
let moonDirLight = null;
let rimDirLight = null;
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
let midDustMat = null;
let b612MistMat = null;
let b612HaloMat = null;
let waterShaderMat = null;
let cascadePoints = null;
let cascadeVelocities = [];
let bookCanvas = null;
let bookTex = null;

const b612Center = B612_CENTER;
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
    const r = 95 + Math.pow(rand(), 0.75) * 125;
    sPos[i * 3] = COSMOS_CENTER.x + r * s * Math.cos(phi);
    sPos[i * 3 + 1] = COSMOS_CENTER.y + r * u;
    sPos[i * 3 + 2] = COSMOS_CENTER.z + r * s * Math.sin(phi);

    const isBright = i % 22 === 0;
    sSize[i] = isBright ? (1.85 + rand() * 1.35) : (0.72 + Math.pow(rand(), 1.9) * 1.05);
    sPhase[i] = rand() * Math.PI * 2;

    const c = sPalette[i % sPalette.length];
    const lum = isBright ? (0.82 + rand() * 0.18) : (0.24 + rand() * 0.42);
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
    fog: false,
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
        gl_PointSize = clamp(140.0 * aSize * scale / max(32.0, -mv.z), 1.0, 4.4);
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

  // 1b. Mid-Space Drifting Parallax Embers inside cosmosGroup
  const dustCount = 720;
  const dPos = new Float32Array(dustCount * 3);
  const dCol = new Float32Array(dustCount * 3);
  const dSize = new Float32Array(dustCount);
  const dPhase = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = 10 + Math.pow(rand(), 0.7) * 44;
    dPos[i * 3] = COSMOS_CENTER.x + r * s * Math.cos(phi);
    dPos[i * 3 + 1] = COSMOS_CENTER.y + r * u * 0.78;
    dPos[i * 3 + 2] = COSMOS_CENTER.z + r * s * Math.sin(phi);
    dSize[i] = 0.75 + rand() * 1.15;
    dPhase[i] = rand() * Math.PI * 2;
    const c = i % 3 === 0 ? new THREE.Color(0x9bc8ff) : new THREE.Color(0xffd79c);
    const l = 0.25 + rand() * 0.42;
    dCol[i * 3] = c.r * l;
    dCol[i * 3 + 1] = c.g * l;
    dCol[i * 3 + 2] = c.b * l;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
  dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dPhase, 1));
  midDustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { scale: { value: dpr }, time: { value: 0 }, opacity: { value: 0.45 } },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTw;
      uniform float scale;
      uniform float time;
      void main() {
        vColor = color;
        vTw = 0.6 + 0.4 * sin(time * 1.2 + aPhase);
        vec3 p = position + vec3(sin(time * 0.18 + aPhase), cos(time * 0.14 + aPhase * 1.3), sin(time * 0.16 - aPhase)) * 0.28;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(24.0 * aSize * scale / max(5.0, -mv.z), 0.9, 3.8);
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
        float a = exp(-d * d * 20.0) * vTw * opacity;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  cosmosGroup.add(new THREE.Points(dustGeo, midDustMat));

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

    const toVertChar = (ch) => ({
      '（': '︵', '(': '︵', '）': '︶', ')': '︶',
      '「': '﹁', '」': '﹂', '『': '﹃', '』': '﹄',
      '《': '︽', '》': '︾', '〈': '︿', '〉': '﹀',
      '“': '﹁', '”': '﹂', '‘': '﹃', '’': '﹄',
      '—': '丨', '–': '丨', '…': '⋮'
    }[ch] || ch);
    const drawVertGlyph = (ch, x, y) => {
      const mapped = toVertChar(ch);
      if ('，。、：；？！'.includes(mapped)) {
        ctx.fillText(mapped, x + 9, y - 7);
      } else {
        ctx.fillText(mapped, x, y);
      }
    };

    // Col 0 (far right): Poem Title & date/place
    const titleChars = [...poem.title.slice(0, 14)];
    ctx.fillStyle = '#1b1713';
    ctx.font = 'bold 34px "Noto Serif SC", "Songti SC", Georgia, serif';
    titleChars.forEach((ch, idx) => {
      drawVertGlyph(ch, allCols[0], 118 + idx * 44);
    });
    const metaStr = `${poem.date || ''}${poem.place ? ' · ' + poem.place : ''}`;
    ctx.fillStyle = '#8b2f24';
    ctx.font = '20px "Noto Serif SC", "Songti SC", Georgia, serif';
    [...metaStr.slice(0, 14)].forEach((ch, idx) => {
      drawVertGlyph(ch, allCols[1], 122 + idx * 32);
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
          drawVertGlyph(ch, cx, 114 + rIdx * 42);
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
    mat.color.setHex(0xe8dac2);
    mat.map = bookTex;
    mat.emissive.setHex(0xfff4df);
    mat.emissiveMap = bookTex;
    mat.emissiveIntensity = 0.08;
    mat.roughness = 0.92;
    mat.envMapIntensity = 0.16;
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
    { bg: '#0b2236', grid: 'rgba(130, 210, 255, 0.16)', ink: '#9ce6ff', accent: '#62e5d0', title: 'L—004 · 绒绒', sub: 'RESONANT COMPANION' },
    { bg: '#0b2924', grid: 'rgba(95, 226, 204, 0.18)', ink: '#74f5db', accent: '#f3e6cf', title: 'L—002 · 机器的植物志', sub: 'MACHINE HERBARIUM' },
    { bg: '#261b12', grid: 'rgba(232, 184, 109, 0.20)', ink: '#ffd38a', accent: '#7cf2da', title: 'L—003 · 记忆的地形', sub: 'TOPOGRAPHIC MEMORY' }
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

  const plateKind = kind % 3;
  if (plateKind === 0) {
    // L-004 绒绒: Dual-node resonant companion & harmonic acoustic waveform
    ctx.strokeStyle = 'rgba(156, 230, 255, 0.35)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(306, 178, 72 + k * 28, 34 + k * 14, -0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let x = 44; x <= 468; x += 4) {
      const f = (x - 44) / 424;
      const env = Math.sin(f * Math.PI);
      const y = 296 - env * (26 * Math.sin(f * 26) + 12 * Math.cos(f * 13));
      if (x === 44) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Companion dual resonance nodes
    ctx.fillStyle = p.accent;
    for (const [nx, ny, r] of [[256, 174, 8], [356, 182, 6]]) {
      ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('RESONANCE 432Hz · DIALOGUE KERNEL', 36, 342);
  } else if (plateKind === 1) {
    // L-002 机器的植物志: Botanical venation topology graph & landmark nodes
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(220, 324);
    ctx.bezierCurveTo(255, 255, 310, 170, 368, 92);
    ctx.stroke();
    const veins = [
      [[264, 248], [218, 206], [198, 176]],
      [[292, 206], [238, 162], [220, 134]],
      [[322, 164], [274, 124], [262, 102]],
      [[272, 238], [336, 224], [378, 202]],
      [[304, 192], [372, 174], [408, 150]],
      [[336, 146], [392, 128], [418, 106]]
    ];
    ctx.lineWidth = 1.8;
    for (const [a, b, c] of veins) {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]);
      ctx.stroke();
      ctx.fillStyle = p.accent;
      ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(116, 245, 219, 0.35)';
    ctx.strokeRect(184, 78, 252, 248);
    ctx.fillStyle = p.ink;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('VEIN NODES: 12 · CONFIDENCE 0.94', 36, 342);
  } else {
    // L-003 记忆的地形: Irregular organic elevation contours & survey azimuth grid
    ctx.strokeStyle = p.ink;
    for (let lvl = 0; lvl < 6; lvl++) {
      const baseR = 26 + lvl * 18;
      ctx.lineWidth = lvl % 2 === 0 ? 2.4 : 1.3;
      ctx.beginPath();
      for (let s = 0; s <= 48; s++) {
        const a = (s / 48) * Math.PI * 2;
        const wob = 1 + 0.18 * Math.sin(a * 3 + lvl * 0.7) + 0.10 * Math.cos(a * 2 - 0.5);
        const rx = 312 + Math.cos(a) * baseR * 1.24 * wob;
        const ry = 212 + Math.sin(a) * baseR * 0.88 * wob;
        if (s === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(190, 290); ctx.lineTo(426, 128);
    ctx.moveTo(312, 108); ctx.lineTo(312, 316);
    ctx.stroke();
    ctx.fillStyle = p.ink;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('AZIMUTH N28°E · CONTOUR Δ 50m', 36, 342);
  }

  ctx.fillStyle = p.ink;
  ctx.font = 'bold 26px "Noto Serif SC", Georgia, serif';
  ctx.fillText(p.title, 36, 68);
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(p.sub, 36, 98);
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
  const bgPalettes = [
    { bg: '#0e2824', stroke: '#6cf0d6', fill: 'rgba(108, 240, 214, 0.24)', ink: '#d4fff5' },
    { bg: '#261e12', stroke: '#f0cb7e', fill: 'rgba(240, 203, 126, 0.24)', ink: '#fff0d1' },
    { bg: '#281a14', stroke: '#ffbe7d', fill: 'rgba(255, 190, 125, 0.24)', ink: '#ffe8d2' },
    { bg: '#102230', stroke: '#86d6ff', fill: 'rgba(134, 214, 255, 0.22)', ink: '#dff4ff' }
  ];
  const pal = bgPalettes[idx % 4];
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 228, 484);
  ctx.fillStyle = pal.fill;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (idx === 0) {
    // 1. 雨后青苔 Bryophyta: cushion moss mound + slender nodding sporophyte setae & capsules
    ctx.beginPath();
    ctx.ellipse(128, 355, 76, 32, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let k = -3; k <= 3; k++) {
      const bx = 128 + k * 18;
      const topY = 125 + Math.abs(k) * 26;
      const cx = bx + k * 6;
      ctx.beginPath();
      ctx.moveTo(bx, 340);
      ctx.quadraticCurveTo(bx - k * 3, 240, cx, topY);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, topY);
      ctx.rotate(k * 0.22 + 0.35);
      ctx.beginPath();
      ctx.ellipse(0, -10, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (idx === 1) {
    // 2. 九月梧桐 Firmiana: 5-lobed palmate leaf + palmate veins
    ctx.beginPath();
    ctx.moveTo(128, 385);
    ctx.lineTo(128, 305);
    ctx.lineTo(64, 305);
    ctx.quadraticCurveTo(48, 265, 76, 246);
    ctx.lineTo(44, 185);
    ctx.quadraticCurveTo(68, 175, 92, 198);
    ctx.lineTo(128, 86);
    ctx.lineTo(164, 198);
    ctx.quadraticCurveTo(188, 175, 212, 185);
    ctx.lineTo(180, 246);
    ctx.quadraticCurveTo(208, 265, 192, 305);
    ctx.lineTo(128, 305);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const [vx, vy] of [[128, 96], [52, 192], [204, 192], [68, 294], [188, 294]]) {
      ctx.beginPath();
      ctx.moveTo(128, 302);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    }
  } else if (idx === 2) {
    // 3. 晚霞与桂子 Osmanthus: twig with opposite elliptical leaves + dense 4-petal floret clusters
    ctx.beginPath();
    ctx.moveTo(128, 388);
    ctx.bezierCurveTo(118, 285, 138, 180, 124, 72);
    ctx.stroke();
    for (const [lx, ly, ang] of [[84, 300, -0.55], [172, 274, 0.52], [86, 178, -0.48], [168, 152, 0.5]]) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(0, 42);
      ctx.stroke();
      ctx.restore();
    }
    for (const [fx, fy] of [[112, 232], [142, 224], [126, 206], [108, 128], [144, 118], [126, 102]]) {
      for (let p = 0; p < 4; p++) {
        const a = (p * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    // 4. 山谷雾松 Cedrus: branched twig with radiating pine needle fascicles & ovoid pinecone
    ctx.beginPath();
    ctx.moveTo(128, 388);
    ctx.lineTo(128, 105);
    ctx.moveTo(128, 285);
    ctx.lineTo(74, 215);
    ctx.moveTo(128, 225);
    ctx.lineTo(182, 162);
    ctx.stroke();
    for (const [nx, ny] of [[74, 215], [182, 162], [128, 118], [96, 245], [160, 186]]) {
      for (let k = -5; k <= 5; k++) {
        const a = -Math.PI / 2 + k * 0.24;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + Math.cos(a) * 40, ny + Math.sin(a) * 44);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.ellipse(128, 326, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = pal.ink;
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

function heightCanvasToNormalTexture(srcCanvas, strength = 2.0, repeatX = 1, repeatY = 1) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const outCvs = document.createElement('canvas');
  outCvs.width = w;
  outCvs.height = h;
  const outCtx = outCvs.getContext('2d');
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;
  const lumaAt = (x, y) => {
    const cx = (x + w) % w;
    const cy = (y + h) % h;
    const i = (cy * w + cx) * 4;
    return (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (lumaAt(x + 1, y) - lumaAt(x - 1, y)) * strength;
      const dy = (lumaAt(x, y + 1) - lumaAt(x, y - 1)) * strength;
      let nx = -dx, ny = -dy, nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen; ny *= invLen; nz *= invLen;
      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  const tex = new THREE.CanvasTexture(outCvs);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

function makeLinearRoughNormalMaps(w, h, drawHeightFn, strength = 1.8, repeatX = 1, repeatY = 1) {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d');
  drawHeightFn(ctx, w, h);
  const roughTex = new THREE.CanvasTexture(cvs);
  roughTex.colorSpace = THREE.NoColorSpace;
  roughTex.flipY = false;
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(repeatX, repeatY);
  const normalTex = heightCanvasToNormalTexture(cvs, strength, repeatX, repeatY);
  return { roughTex, normalTex };
}

function applyProceduralPBRTextures() {
  const deskTex = makeWalnutTexture();
  const deskNormal = heightCanvasToNormalTexture(deskTex.image, 1.8, 1, 1);
  const deskRough = new THREE.CanvasTexture(deskTex.image);
  deskRough.colorSpace = THREE.NoColorSpace;
  deskRough.flipY = false;

  const deskMat = materialsByName.get('DeskTopWood');
  if (deskMat) {
    deskMat.color.setHex(0xffffff);
    deskMat.map = deskTex;
    deskMat.normalMap = deskNormal;
    deskMat.normalScale = new THREE.Vector2(0.45, 0.45);
    deskMat.roughnessMap = deskRough;
    deskMat.roughness = 0.52;
    deskMat.envMapIntensity = 0.65;
    deskMat.needsUpdate = true;
  }

  // Shared wood grain micro-maps on WarmOak & DarkWood
  const woodNormal = heightCanvasToNormalTexture(deskTex.image, 1.6, 2.5, 2.5);
  for (const wName of ['WarmOak', 'DarkWood']) {
    const wm = materialsByName.get(wName);
    if (wm) {
      wm.normalMap = woodNormal;
      wm.normalScale = new THREE.Vector2(0.32, 0.32);
      wm.envMapIntensity = 0.55;
      wm.needsUpdate = true;
    }
  }

  // Concentric groove normalMap & roughnessMap on vinyl/ink platter (InkPoolGloss) & brass dials
  const concentricMaps = makeLinearRoughNormalMaps(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.5;
    for (let r = 8; r < 126; r += 2) {
      const lum = Math.round(42 + 48 * (0.5 + 0.5 * Math.sin(r * 1.8)));
      ctx.strokeStyle = `rgb(${lum},${lum},${lum})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, 2.4, 1, 1);

  const inkPoolMat = materialsByName.get('InkPoolGloss');
  if (inkPoolMat) {
    inkPoolMat.normalMap = concentricMaps.normalTex;
    inkPoolMat.normalScale = new THREE.Vector2(0.42, 0.42);
    inkPoolMat.roughnessMap = concentricMaps.roughTex;
    inkPoolMat.roughness = 0.24;
    inkPoolMat.envMapIntensity = 1.25;
    inkPoolMat.needsUpdate = true;
  }

  // Roof Slate Tile vertical flute normal & damp roughness maps
  const slateMaps = makeLinearRoughNormalMaps(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const flute = Math.round(135 + 48 * Math.sin((x / w) * Math.PI * 16));
      ctx.fillStyle = `rgb(${flute},${flute},${flute})`;
      ctx.fillRect(x, 0, 1, h);
    }
    for (let y = 0; y < h; y += 32) {
      ctx.fillStyle = 'rgba(40,40,40,0.45)';
      ctx.fillRect(0, y, w, 3);
    }
  }, 2.2, 4, 4);
  const slateMat = materialsByName.get('SlateTile');
  if (slateMat) {
    slateMat.normalMap = slateMaps.normalTex;
    slateMat.normalScale = new THREE.Vector2(0.45, 0.45);
    slateMat.roughnessMap = slateMaps.roughTex;
    slateMat.roughness = 0.72;
    slateMat.envMapIntensity = 0.6;
    slateMat.needsUpdate = true;
  }

  // Mineral trowel plaster roughness & normal maps for LimeWall
  const limeMaps = makeLinearRoughNormalMaps(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cfcfcf';
    ctx.fillRect(0, 0, w, h);
    let seed = 8817;
    const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 650; i++) {
      const g = Math.round(175 + rnd() * 55);
      ctx.fillStyle = `rgba(${g},${g},${g},0.35)`;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 4 + rnd() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 1.35, 3, 3);
  const limeMat = materialsByName.get('LimeWall');
  if (limeMat) {
    limeMat.normalMap = limeMaps.normalTex;
    limeMat.normalScale = new THREE.Vector2(0.28, 0.28);
    limeMat.roughnessMap = limeMaps.roughTex;
    limeMat.roughness = 0.88;
    limeMat.needsUpdate = true;
  }

  // Balance metallics & glazed ceramics against procedural PMREM environment
  const envTune = [
    ['WarmBrass', 1.35, 0.22],
    ['ChinaGoldRim', 1.25, 0.42],
    ['CeladonCup', 1.20, 0.25],
    ['EmeraldShade', 1.15, 0.72],
    ['InkStone', 1.05, 0.28],
    ['TeaLiquid', 1.15, 0.35]
  ];
  for (const [mName, envInt, emInt] of envTune) {
    const m = materialsByName.get(mName);
    if (m) {
      m.envMapIntensity = envInt;
      if (m.emissiveIntensity !== undefined) m.emissiveIntensity = emInt;
      m.needsUpdate = true;
    }
  }

  // Upgrade GlassCase (rose cloche + herbarium glass + lab frame covers) to Fresnel MeshPhysicalMaterial
  const physGlassMat = new THREE.MeshPhysicalMaterial({
    name: 'GlassCase',
    color: new THREE.Color(0xcff6ef),
    transparent: true,
    opacity: 0.24,
    roughness: 0.08,
    metalness: 0.04,
    ior: 1.5,
    reflectivity: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.45,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  scene?.traverse((child) => {
    if (child.isMesh && child.material && child.material.name === 'GlassCase') {
      child.material = physGlassMat;
    }
  });
  materialsByName.set('GlassCase', physGlassMat);

  for (let i = 0; i < 3; i++) {
    const bp = materialsByName.get(`LabBlueprintMat_${i}`);
    if (bp) {
      const tex = makeBlueprintTexture(i);
      bp.color.setHex(0xffffff);
      bp.map = tex;
      bp.emissive.setHex(0xffffff);
      bp.emissiveMap = tex;
      bp.emissiveIntensity = 0.28;
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
      sm.emissiveIntensity = 0.30;
      sm.needsUpdate = true;
    }
  }

  updateBookMoyanTexture();
}

function buildProceduralEnvMap() {
  if (!renderer || !scene) return;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 deep = vec3(0.03, 0.06, 0.11);
        vec3 mid = vec3(0.08, 0.16, 0.22);
        vec3 warm = vec3(0.55, 0.36, 0.16);
        vec3 col = mix(deep, mid, smoothstep(0.15, 0.85, h));
        float keySpot = pow(max(0.0, dot(vDir, normalize(vec3(-0.4, 0.7, 0.6)))), 6.0);
        float jadeSpot = pow(max(0.0, dot(vDir, normalize(vec3(0.6, 0.4, -0.7)))), 5.0);
        col += warm * keySpot * 1.15 + vec3(0.18, 0.58, 0.52) * jadeSpot * 0.75;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), domeMat);
  envScene.add(dome);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.88;
  dome.geometry.dispose();
  domeMat.dispose();
  pmrem.dispose();
}

function addContactShadowDecals() {
  if (!worldGroup) return;
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 256;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
  grad.addColorStop(0.0, 'rgba(6, 10, 15, 0.56)');
  grad.addColorStop(0.45, 'rgba(8, 12, 18, 0.30)');
  grad.addColorStop(0.80, 'rgba(10, 14, 20, 0.08)');
  grad.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(cvs);
  shadowTex.colorSpace = THREE.SRGBColorSpace;

  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });

  // Desk props contact shadows on Long_Desk_Table top (y = 8.404)
  const deskShadows = [
    [-3.65, 8.404, -5.85, 2.55, 1.85],   // Book_Moyan
    [-5.35, 8.404, -6.25, 1.18, 0.90],   // Study_Inkstone
    [-4.80, 8.404, -5.53, 0.45, 0.80],   // Brush rest
    [-2.05, 8.404, -5.25, 0.52, 0.52],   // ZhuSha_Seal_Block
    [-1.53, 8.404, -5.47, 0.62, 0.62],   // Seal paste box
    [-2.37, 8.404, -6.50, 0.64, 0.64],   // Celadon teacup
    [0.15,  8.404, -5.90, 1.32, 1.22],   // Loft_Compass_Tray
    [5.85,  8.404, -6.65, 1.05, 1.05],   // Lab_Desk_Lamp
    [4.05,  8.404, -6.20, 2.25, 1.52],   // Herbarium_Specimen_Box
    [2.25,  8.404, -5.05, 1.24, 0.92],   // Lab_Plate_0
    [4.05,  8.404, -4.90, 1.24, 0.92],   // Lab_Plate_1
    [5.80,  8.404, -5.12, 1.24, 0.92]    // Lab_Plate_2
  ];
  for (const [sx, sy, sz, w, d] of deskShadows) {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, shadowMat);
    m.position.set(sx, sy, sz);
    worldGroup.add(m);
  }

  // B-612 surface contact shadows under cottage, tree & rose cloche
  if (cosmosGroup) {
    const b612Shadows = [
      [b612Center.x, b612Center.y + 2.34, b612Center.z + 0.08, 1.85, 1.55, 0.14, 0.0, -0.18],
      [b612Center.x - 1.48, b612Center.y + 1.63, b612Center.z + 0.62, 0.72, 0.72, 0.18, 0.0, 0.68],
      [b612Center.x + 1.48, b612Center.y + 1.66, b612Center.z + 0.65, 0.82, 0.82, 0.20, 0.0, -0.58]
    ];
    for (const [px, py, pz, w, d, rx, ry, rz] of b612Shadows) {
      const geo = new THREE.PlaneGeometry(w, d);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, shadowMat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      cosmosGroup.add(m);
    }
  }
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
  // Chiaroscuro balance: sculpted twilight in roam mode, warm pools in station interior
  hemiLight = new THREE.HemisphereLight(0xcfe0ff, 0x16221e, 0.52);
  scene.add(hemiLight);

  ambientLight = new THREE.AmbientLight(0x88a4cc, 0.24);
  scene.add(ambientLight);

  moonDirLight = new THREE.DirectionalLight(0xfff0d2, 1.05);
  moonDirLight.position.set(-14, 42, 34);
  scene.add(moonDirLight);

  rimDirLight = new THREE.DirectionalLight(0x76e8d6, 0.55);
  rimDirLight.position.set(16, 18, -56);
  scene.add(rimDirLight);

  const addBeaconLight = (color, intensity, distance, x, y, z) => {
    const pt = new THREE.PointLight(color, intensity, distance, 1.35);
    pt.position.set(x, y, z);
    worldGroup.add(pt);
    return pt;
  };
  addBeaconLight(0xffca82, 1.45, 18, -3.65, 10.6, -5.85); // Zone 2 Study Book_Moyan
  addBeaconLight(0xffb662, 1.85, 18, 5.2, 10.2, -6.2);    // Zone 3 Lab Desk Lamp
  addBeaconLight(0x80f2dc, 2.2, 42, 0.0, 12.2, -42.0);   // Zone 4 China Topo
  addBeaconLight(0xffb45a, 2.5, 36, -3.5, -2.2, -74.0);  // Zone 5 River Eave Lantern
  addBeaconLight(0xffcb78, 2.1, 36, 0.0, -2.5, -86.0);   // Zone 5 Arched Bridge & Canal

  pointerLight = new THREE.PointLight(0xffecc2, 0.75, 16, 1.6);
  worldGroup.add(pointerLight);
}

function applyLightingMode(mode) {
  if (!hemiLight || !ambientLight || !moonDirLight || !rimDirLight) return;
  if (mode === 'roam') {
    hemiLight.color.setHex(0x3a568e);
    hemiLight.groundColor.setHex(0x060912);
    hemiLight.intensity = 0.22;
    ambientLight.intensity = 0.08;
    moonDirLight.intensity = 0.14;
    rimDirLight.intensity = 0.08;
    if (scene) scene.environmentIntensity = 0.26;
    if (scene?.fog) scene.fog.density = 0.0085;
    if (bloomPass) {
      bloomPass.strength = BASE_BLOOM_STRENGTH;
      bloomPass.threshold = BASE_BLOOM_THRESHOLD;
    }
  } else {
    hemiLight.color.setHex(0xcfe0ff);
    hemiLight.groundColor.setHex(0x16221e);
    hemiLight.intensity = 0.46;
    ambientLight.intensity = 0.20;
    moonDirLight.intensity = 0.88;
    rimDirLight.intensity = 0.50;
    if (scene) scene.environmentIntensity = 0.76;
    if (bloomPass) {
      bloomPass.strength = STATION_BLOOM_STRENGTH;
      bloomPass.threshold = STATION_BLOOM_THRESHOLD;
    }
  }
}

function makeRippleTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 128;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(128, 128);
  const d = img.data;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const dx = (x - 64) / 64;
      const dy = (y - 64) / 56;
      const theta = Math.atan2(dy, dx);
      const noise = 0.055 * Math.sin(theta * 5 + 0.4) + 0.032 * Math.cos(theta * 9 - 0.7);
      const r = Math.hypot(dx, dy) + noise;
      let a = 0;
      if (r > 0.34 && r < 0.98) {
        const ring1 = Math.exp(-Math.pow((r - 0.76) / 0.11, 2));
        const ring2 = Math.exp(-Math.pow((r - 0.56) / 0.08, 2)) * 0.45;
        const fade = 1 - Math.max(0, (r - 0.86) / 0.12);
        a = Math.min(1, (ring1 + ring2) * fade) * 0.62;
      }
      const idx = (y * 128 + x) * 4;
      d[idx] = 140;
      d[idx + 1] = 242;
      d[idx + 2] = 224;
      d[idx + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWaterRipples() {
  const rippleTex = makeRippleTexture();
  for (let i = 0; i < riverBoats.length; i++) {
    const boat = riverBoats[i].obj;
    const geo = new THREE.PlaneGeometry(2.65, 2.65);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(boat.position.x, -6.47, boat.position.z);
    worldGroup.add(ring);
    rippleRings.push({ ring, boat, phase: i * 1.1 });
  }
}

const INTERACTIVE_NAME_RE = /^(B612_Cottage|B612_Rose_Cloche|Book_Moyan|ZhuSha_Seal_Block|Herbarium_Specimen_Box|Lab_Plate_\d+|City_Beacon_\d+|River_Boat_Lantern_\d+|Roof_Cat_3D|Roof_Windchime)$/;

function registerInteractiveHoverMeshes(targetName, obj) {
  if (!hoverMaterials.has(targetName)) hoverMaterials.set(targetName, []);
  const bucket = hoverMaterials.get(targetName);
  obj.traverse((child) => {
    if (!child.isMesh || !child.material || child.material.name === 'HitProxyMat') return;
    if (targetName === 'B612_Cottage' && child.material.name !== 'LanternGlow') return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = mats.map((m) => {
      if (m.userData && m.userData.__qzHoverTracked) return m;
      const c = m.clone();
      c.userData = { ...(m.userData || {}), __qzHoverTracked: true, __baseEmissive: c.emissiveIntensity ?? 0.5 };
      return c;
    });
    child.material = Array.isArray(child.material) ? cloned : cloned[0];
    for (const c of cloned) {
      if (c.isMeshStandardMaterial || c.isMeshPhysicalMaterial) {
        bucket.push(c);
      }
    }
  });
}

function setHoveredInteractiveTarget(nextName) {
  if (hoveredTargetName === nextName) return;
  if (hoveredTargetName) {
    if (hoveredTargetName.startsWith('PhotoFrame_')) {
      const idx = Number(hoveredTargetName.replace('PhotoFrame_', ''));
      if (photoFrames[idx]) photoFrames[idx].hovered = false;
    }
    const oldMarker = markerElements.get(hoveredTargetName);
    if (oldMarker) oldMarker.classList.remove('is-hovered');
    const oldMats = hoverMaterials.get(hoveredTargetName) || [];
    for (const m of oldMats) {
      m.emissiveIntensity = m.userData.__baseEmissive ?? 0.5;
    }
  }
  hoveredTargetName = nextName || null;
  if (hoveredTargetName) {
    if (hoveredTargetName.startsWith('PhotoFrame_')) {
      const idx = Number(hoveredTargetName.replace('PhotoFrame_', ''));
      if (photoFrames[idx]) photoFrames[idx].hovered = true;
    }
    const newMarker = markerElements.get(hoveredTargetName);
    if (newMarker) newMarker.classList.add('is-hovered');
    const newMats = hoverMaterials.get(hoveredTargetName) || [];
    for (const m of newMats) {
      m.emissiveIntensity = (m.userData.__baseEmissive ?? 0.5) + 0.45;
    }
  }
}

function resolveClickTargetName(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData && cur.userData.__qzInteractiveName) {
      return cur.userData.__qzInteractiveName;
    }
    if (cur.userData && cur.userData.hitTarget) {
      return cur.userData.hitTarget;
    }
    cur = cur.parent;
  }
  return null;
}

function handleInteractiveHit(name) {
  if (!name) return;
  if (name === 'B612_Cottage') {
    enterStudyMatchCut();
    return;
  }
  if (name === 'B612_Rose_Cloche') {
    playChimeSound();
    showToast('小王子在玻璃钟罩下照料着他的玫瑰与微光清晨 🌹');
    return;
  }
  if (name.startsWith('PhotoFrame_')) {
    const idx = Number(name.replace('PhotoFrame_', ''));
    const f = photoFrames[idx];
    if (f) openDarkroomViewer(f.workSlug, f.photoIdx);
    return;
  }
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
      { id: 'B612_Cottage', label: '清舟星木屋 · 降落', tone: 'gold', dy: 4.35, dx: -0.45 },
      { id: 'B612_Rose_Cloche', label: '玻璃罩玫瑰', tone: 'seal', dy: 0.65 },
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
const markerAnchorBox = new THREE.Box3();
const markerAnchorCenter = new THREE.Vector3();

function updateSpatialMarkers() {
  const container = document.getElementById('spatial-markers');
  if (!container || !glbRoot) return;
  if (state.mode !== 'station') {
    for (const btn of markerElements.values()) btn.style.display = 'none';
    return;
  }

  const activeSpecs = getActiveMarkerSpecs();
  const activeIds = new Set(activeSpecs.map((s) => s.id));

  for (const [id, btn] of markerElements.entries()) {
    if (!activeIds.has(id)) btn.style.display = 'none';
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const topRect = document.getElementById('hud-topbar')?.getBoundingClientRect();
  const railRect = document.getElementById('timeline-rail')?.getBoundingClientRect();
  const deckEl = document.getElementById('station-deck');
  const deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

  const safeTop = (topRect ? topRect.bottom : 64) + 10;
  let safeBot = (railRect ? railRect.top : h - 64) - 10;
  if (w <= 900 && deckRect && deckRect.height > 0) {
    safeBot = Math.min(safeBot, deckRect.top - 10);
  }
  const sideMargin = w < 600 ? 16 : 48;
  const safeLeft = sideMargin;
  const safeRight = (w > 900 && deckRect && !state.deckCollapsed) ? Math.min(w - 48, deckRect.left - 14) : w - sideMargin;

  const visibleItems = [];
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

    const anchorObj = namedObjects.get(`Anchor_${spec.id}`);
    if (anchorObj) {
      anchorObj.getWorldPosition(projVec);
    } else if (spec.id === 'B612_Cottage') {
      projVec.set(b612Center.x + (spec.dx || 0), b612Center.y + spec.dy, b612Center.z);
    } else if (spec.id === 'B612_Rose_Cloche' || targetObj.position.lengthSq() < 1e-4) {
      markerAnchorBox.setFromObject(targetObj);
      markerAnchorBox.getCenter(markerAnchorCenter);
      projVec.copy(markerAnchorCenter);
      projVec.y += spec.dy || 0.7;
    } else {
      targetObj.getWorldPosition(projVec);
      projVec.y += spec.dy || 0.8;
    }
    projVec.project(camera);

    const visible = projVec.z >= -1 && projVec.z <= 1;
    let sx = (projVec.x * 0.5 + 0.5) * w;
    let sy = (-projVec.y * 0.5 + 0.5) * h;

    if (!visible || sx < 8 || sx > w - 8 || sy < 36 || sy > h - 24) {
      btn.style.display = 'none';
      continue;
    }
    if (spec.id === 'B612_Rose_Cloche' && w < 600) {
      sx += 26;
      sy += 62;
    }

    const hovCls = hoveredTargetName === spec.id ? ' is-hovered' : '';
    const nextCls = `spatial-marker is-${spec.tone}${spec.selected ? ' is-highlighted' : ''}${hovCls}`;
    if (btn.className !== nextCls) btn.className = nextCls;
    const textEl = btn.querySelector('.spatial-text');
    if (textEl && textEl.textContent !== spec.label) textEl.textContent = spec.label;
    if (btn.style.display !== 'inline-flex') btn.style.display = 'inline-flex';
    const bw = Math.max(btn.offsetWidth || 100, 84);
    const bh = Math.max(btn.offsetHeight || 30, 30);

    sx = clamp(sx, safeLeft + bw * 0.5, Math.max(safeLeft + bw * 0.5, safeRight - bw * 0.5));
    sy = clamp(sy, safeTop + bh, Math.max(safeTop + bh, safeBot));
    visibleItems.push({ spec, btn, sx, sy, bw, bh });
  }

  // Screen-space de-collision pass: falls back to vertical separation whenever X clamps against margins
  visibleItems.sort((a, b) => a.sy - b.sy || a.sx - b.sx);
  for (let pass = 0; pass < 8; pass++) {
    let anyMoved = false;
    for (let i = 0; i < visibleItems.length; i++) {
      for (let j = i + 1; j < visibleItems.length; j++) {
        const a = visibleItems[i], b = visibleItems[j];
        const minDX = (a.bw + b.bw) * 0.5 + 8;
        const minDY = (a.bh + b.bh) * 0.5 + 6;
        let dx = b.sx - a.sx;
        let dy = b.sy - a.sy;
        if (Math.abs(dx) < minDX && Math.abs(dy) < minDY) {
          anyMoved = true;
          const crowdedBottom = Math.max(a.sy, b.sy) >= safeBot - 16 || (w < 600 && safeRight - safeLeft < a.bw + b.bw + 18);
          const preferX = !crowdedBottom && Math.abs(dx) >= Math.abs(dy) * 0.85;
          if (preferX) {
            const push = (minDX - Math.abs(dx)) * 0.55 * (dx >= 0 ? 1 : -1);
            a.sx = clamp(a.sx - push, safeLeft + a.bw * 0.5, Math.max(safeLeft + a.bw * 0.5, safeRight - a.bw * 0.5));
            b.sx = clamp(b.sx + push, safeLeft + b.bw * 0.5, Math.max(safeLeft + b.bw * 0.5, safeRight - b.bw * 0.5));
            dx = b.sx - a.sx;
          }
          if (Math.abs(dx) < minDX && Math.abs(dy) < minDY) {
            const neededY = minDY - Math.abs(dy) + 3;
            const upper = a.sy <= b.sy ? a : b;
            const lower = upper === a ? b : a;
            if (lower.sy >= safeBot - 18) {
              upper.sy -= neededY;
            } else if (upper.sy <= safeTop + upper.bh + 14) {
              lower.sy += neededY;
            } else {
              upper.sy -= neededY * 0.54;
              lower.sy += neededY * 0.54;
            }
            upper.sy = clamp(upper.sy, safeTop + upper.bh, Math.max(safeTop + upper.bh, safeBot));
            lower.sy = clamp(lower.sy, safeTop + lower.bh, Math.max(safeTop + lower.bh, safeBot));
          }
        }
      }
    }
    if (!anyMoved) break;
  }

  for (const item of visibleItems) {
    const px = Math.round(item.sx);
    const py = Math.round(item.sy);
    const posKey = `${px},${py}`;
    if (item.btn.dataset.lastPos !== posKey) {
      item.btn.dataset.lastPos = posKey;
      item.btn.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -100%)`;
    }
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
  const nextT = clamp(Number(targetT) || 0, 0, 1);
  if (nextT < 0.24) {
    enterRoamMode({ target: nextT <= 0.05 ? 'home' : 'b612', instant: Boolean(opts.instant) });
    if (opts.toast) showToast(opts.toast);
    return;
  }
  if (state.mode !== 'station') {
    syncBodyMode('station');
    state.currentT = clamp(nextT, 0.26, 1);
  }
  state.targetT = clamp(nextT, 0.26, 1);
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
  const portal = getPortalByT(state.currentT);
  const deckKey = `${station.id}:${portal ? portal.id : 'none'}`;
  if (!force && lastStationKey === deckKey) return;
  lastStationKey = deckKey;

  const eyebrow = document.getElementById('deck-eyebrow');
  const title = document.getElementById('deck-title');
  const body = document.getElementById('station-deck-body');
  if (!eyebrow || !title || !body) return;

  eyebrow.textContent = station.eyebrow;
  title.textContent = portal ? portal.label : station.title;

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
      <div class="deck-chips" style="max-height:92px;overflow-y:auto;">
        ${filtered.map((n) => `<button type="button" class="deck-chip${n.slug === state.selectedPoemSlug ? ' is-active' : ''}" data-poem-select="${esc(n.slug)}">${esc(n.title.replace(/^墨檐（其[一二三四五六七]）·?/, ''))}</button>`).join('')}
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
        ${linkedCity ? `<button type="button" class="deck-action-btn" id="btn-city-to-poem">${activeCity.hasDirectPoem ? `飞回书房 · 读「${esc(linkedCity)}」之诗 ↗` : `${esc(activeCity.name)}暂无直系诗作 · 顺访邻近「${esc(linkedCity)}」之诗 ↗`}</button>` : ''}
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
      if (!inp || !inp.value.trim()) {
        if (inp) {
          inp.classList.remove('is-invalid');
          void inp.offsetWidth;
          inp.classList.add('is-invalid');
          inp.focus();
          setTimeout(() => inp.classList.remove('is-invalid'), 480);
        }
        showToast('请先写下一句心愿寄语再放灯 🏮');
        return;
      }
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

function applyDarkroomTransform() {
  const imgWrap = document.getElementById('dr-img-wrap');
  if (!imgWrap) return;
  const maxPanX = Math.round(imgWrap.clientWidth * 0.42);
  const maxPanY = Math.round(imgWrap.clientHeight * 0.42);
  state.darkroomPanX = state.darkroomZoomed ? clamp(state.darkroomPanX, -maxPanX, maxPanX) : 0;
  state.darkroomPanY = state.darkroomZoomed ? clamp(state.darkroomPanY, -maxPanY, maxPanY) : 0;
  imgWrap.style.setProperty('--pan-x', `${Math.round(state.darkroomPanX)}px`);
  imgWrap.style.setProperty('--pan-y', `${Math.round(state.darkroomPanY)}px`);
  imgWrap.style.setProperty('--dr-scale', state.darkroomZoomed ? '1.8' : '1');
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
  const loadingEl = document.getElementById('dr-loading');
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
      state.darkroomPanX = 0;
      state.darkroomPanY = 0;
      playWoodTapSound();
      renderDarkroomViewer();
    });
  });

  if (cur) {
    const token = ++state.darkroomLoadingToken;
    mainImg.alt = cur.alt || cur.cap;
    capMain.textContent = cur.cap;
    capCredit.textContent = cur.credit ? `摄影致谢：${cur.credit}` : `${activeWork.medium || ''}`;
    if (mainImg.dataset.loadedSrc === cur.src) {
      if (imgWrap) imgWrap.classList.remove('is-loading');
      if (loadingEl) loadingEl.hidden = true;
      if (mainImg.getAttribute('src') !== cur.src) mainImg.src = cur.src;
    } else {
      if (mainImg.getAttribute('src') !== cur.thumb) mainImg.src = cur.thumb;
      if (imgWrap) imgWrap.classList.add('is-loading');
      if (loadingEl) loadingEl.hidden = false;
      const hi = new Image();
      hi.onload = () => {
        if (token !== state.darkroomLoadingToken) return;
        mainImg.src = cur.src;
        mainImg.dataset.loadedSrc = cur.src;
        if (imgWrap) imgWrap.classList.remove('is-loading');
        if (loadingEl) loadingEl.hidden = true;
      };
      hi.onerror = () => {
        if (token !== state.darkroomLoadingToken) return;
        if (imgWrap) imgWrap.classList.remove('is-loading');
        if (loadingEl) loadingEl.hidden = true;
      };
      hi.src = cur.src;
    }
  }
  counterEl.textContent = `${String(state.darkroomPhotoIdx + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;

  if (imgWrap) imgWrap.classList.toggle('is-zoomed', state.darkroomZoomed);
  if (zoomBtn) zoomBtn.setAttribute('aria-pressed', String(state.darkroomZoomed));
  applyDarkroomTransform();

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
      state.darkroomPanX = 0;
      state.darkroomPanY = 0;
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
  state.darkroomPanX = 0;
  state.darkroomPanY = 0;
  state.darkroomIntroOpen = false;
  const drawer = document.getElementById('dr-intro-drawer');
  const introBtn = document.getElementById('dr-intro-toggle');
  if (drawer) drawer.hidden = true;
  if (introBtn) introBtn.setAttribute('aria-expanded', 'false');
  renderDarkroomViewer();
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  openModalFocus(modal);
}

function closeDarkroomViewer() {
  const modal = document.getElementById('darkroom-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  state.darkroomZoomed = false;
  state.darkroomPanX = 0;
  state.darkroomPanY = 0;
  closeModalFocus();
}

function stepDarkroomPhoto(delta) {
  const works = archive().works || [];
  const activeWork = works.find((w) => w.slug === state.darkroomWorkSlug) || works[0];
  if (!activeWork || !activeWork.photos?.length) return;
  const n = activeWork.photos.length;
  state.darkroomPhotoIdx = (state.darkroomPhotoIdx + delta + n) % n;
  state.darkroomZoomed = false;
  state.darkroomPanX = 0;
  state.darkroomPanY = 0;
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
  openModalFocus(modal);
}

function closeDossier() {
  const modal = document.getElementById('dossier-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  closeModalFocus();
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
      return `<button type="button" class="poem-stanza-line" data-line-idx="${idx}" title="点击添加或修改朱砂批注"><span>${esc(line)}</span>${note ? `<span class="poem-note-badge">${esc(note)}</span>` : ''}</button>`;
    })
    .join('');

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <span style="color:var(--gold-brass);font-family:var(--font-mono);font-size:12px;">${esc(p.id)} · ${esc(p.date || '')}${p.place ? ` · ${esc(p.place)}` : ''} · 点击任意诗行可写朱砂眉批</span>
      <select id="dossier-poem-picker" aria-label="选择诗作" style="background:rgba(255,255,255,0.06);border:1px solid var(--border-gold);border-radius:8px;padding:4px 8px;color:var(--ink-ivory);">
        ${notes.map((n) => `<option value="${esc(n.slug)}"${n.slug === p.slug ? ' selected' : ''} style="background:#0b121d;color:#f3e6cf;">${esc(n.id)} · ${esc(n.title)}</option>`).join('')}
      </select>
    </div>
    <div class="poem-sheet-xuan">
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
      document.querySelectorAll('#dossier-body .poem-anno-editor').forEach((ed) => ed.remove());
      const ed = document.createElement('form');
      ed.className = 'poem-anno-editor';
      ed.innerHTML = `
        <input type="text" maxlength="64" placeholder="写下一句朱砂眉批…" value="${esc(annos[idx] || '')}" aria-label="朱砂批注内容" />
        <button type="submit" class="hud-btn hud-btn-primary">保存批注</button>
        ${annos[idx] ? '<button type="button" class="hud-btn" data-clear-anno>清除</button>' : ''}
        <button type="button" class="hud-btn" data-cancel-anno>取消</button>
      `;
      lineEl.after(ed);
      const inp = ed.querySelector('input');
      inp?.focus();
      inp?.select();
      ed.addEventListener('submit', (ev) => {
        ev.preventDefault();
        addPoemAnnotation(p.slug, idx, (inp?.value || '').trim());
        playWoodTapSound();
        showToast('朱砂眉批已保存 ✨');
        openPoemDossier(p.slug);
      });
      ed.querySelector('[data-clear-anno]')?.addEventListener('click', () => {
        addPoemAnnotation(p.slug, idx, '');
        playWoodTapSound();
        openPoemDossier(p.slug);
      });
      ed.querySelector('[data-cancel-anno]')?.addEventListener('click', () => {
        ed.remove();
        lineEl.focus();
      });
      inp?.addEventListener('keydown', (ke) => {
        if (ke.key === 'Escape') {
          ke.stopPropagation();
          ed.remove();
          lineEl.focus();
        }
      });
    });
  });
}

function getLabSchematicSvg(slug) {
  if (slug === 'rongrong') {
    return `<svg class="lab-schematic-svg" viewBox="0 0 420 110" aria-label="L-004 共鸣回路示意图"><rect x="8" y="8" width="404" height="94" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.25"/><path d="M26 55 C85 18, 130 92, 190 55 C240 22, 295 88, 394 55" fill="none" stroke="#5fe2cc" stroke-width="2"/><circle cx="210" cy="55" r="22" fill="none" stroke="currentColor" stroke-dasharray="4 4"/><circle cx="210" cy="55" r="7" fill="currentColor"/><text x="20" y="26" fill="currentColor" font-size="10" opacity="0.8">FIG.01 · DIALOGUE &amp; MEMORY KERNEL</text></svg>`;
  }
  if (slug === 'machine-herbarium') {
    return `<svg class="lab-schematic-svg" viewBox="0 0 420 110" aria-label="L-002 机器植物志感知矩阵"><rect x="8" y="8" width="404" height="94" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.25"/><g stroke="#5fe2cc" fill="none" stroke-width="1.5"><rect x="44" y="28" width="60" height="62" rx="4"/><rect x="134" y="28" width="60" height="62" rx="4"/><rect x="224" y="28" width="60" height="62" rx="4"/><rect x="314" y="28" width="60" height="62" rx="4"/><path d="M74 78 V40 M60 54 L74 44 L88 54 M164 78 V40 M148 56 Q164 38 180 56 M254 78 V40 M344 78 V40"/></g><text x="20" y="22" fill="currentColor" font-size="10" opacity="0.8">FIG.02 · 4-CHANNEL CYANOTYPE SENSOR ARRAY</text></svg>`;
  }
  return `<svg class="lab-schematic-svg" viewBox="0 0 420 110" aria-label="L-003 地形声场等高线"><rect x="8" y="8" width="404" height="94" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.25"/><g fill="none" stroke="currentColor" stroke-opacity="0.65"><ellipse cx="210" cy="58" rx="140" ry="30"/><ellipse cx="210" cy="58" rx="95" ry="20" stroke="#5fe2cc"/><ellipse cx="210" cy="58" rx="46" ry="10"/></g><circle cx="210" cy="58" r="4" fill="#d44d38"/><text x="20" y="24" fill="currentColor" font-size="10" opacity="0.8">FIG.03 · TOPOGRAPHIC ACOUSTIC CONTOUR</text></svg>`;
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
    <div class="lab-schematic-box">${getLabSchematicSvg(lab.slug)}</div>
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
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration) && duration) duration.textContent = fmt(audio.duration);
  });
  play.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        if (!analyser) {
          const actx = ensureSfx();
          if (actx) {
            const src = actx.createMediaElementSource(audio);
            analyser = actx.createAnalyser();
            analyser.fftSize = 128;
            freqBins = new Uint8Array(analyser.frequencyBinCount);
            src.connect(analyser);
            analyser.connect(actx.destination);
          }
        }
        await audio.play();
      } catch (err) {
        showToast('声音暂时无法播放，请检查浏览器音频权限 ♪');
      }
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
  if (Math.abs(t - lastHudT) > 0.0003) {
    lastHudT = t;
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
  }

  const station = getStationByT(t);
  if (state.activeStationId !== station.id) {
    state.activeStationId = station.id;
    document.body.dataset.zone = station.id;
    document.querySelectorAll('.station-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.station === station.id);
    });
  }

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

  lastRenderedZone = station.id;
  renderStationDeck(false);
}

const _roamForward = new THREE.Vector3();
const _roamEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _roamOffset = new THREE.Vector3();

function isOverlayBlockingScene() {
  const dr = document.getElementById('darkroom-modal');
  const ds = document.getElementById('dossier-modal');
  const atlas = document.getElementById('ink-atlas');
  return Boolean((dr && !dr.hidden) || (ds && !ds.hidden) || (atlas && !atlas.hidden));
}

function openInkAtlas() {
  const atlas = document.getElementById('ink-atlas');
  if (!atlas) return;
  const dockPanel = document.getElementById('dock-panel');
  const dockToggle = document.getElementById('dock-toggle');
  if (dockPanel && !dockPanel.hidden) {
    dockPanel.hidden = true;
    dockToggle?.setAttribute('aria-expanded', 'false');
  }
  atlas.hidden = false;
  atlas.setAttribute('aria-hidden', 'false');
  document.getElementById('btn-menu-open')?.setAttribute('aria-expanded', 'true');
  document.getElementById('btn-atlas-open')?.setAttribute('aria-expanded', 'true');
  openModalFocus(atlas);
}

function closeInkAtlas() {
  const atlas = document.getElementById('ink-atlas');
  if (!atlas || atlas.hidden) return;
  atlas.hidden = true;
  atlas.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-menu-open')?.setAttribute('aria-expanded', 'false');
  document.getElementById('btn-atlas-open')?.setAttribute('aria-expanded', 'false');
  closeModalFocus();
}

function syncBodyMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  if (cosmosGroup) cosmosGroup.visible = (mode === 'roam');
  if (worldGroup) worldGroup.visible = (mode === 'station');
  applyLightingMode(mode);
}

function startRoamFlight(endPos, endYaw, endPitch, duration = 1.45) {
  const startPos = roamState.position.clone();
  const dist = startPos.distanceTo(endPos);
  if (prefersReducedMotion || dist < 0.25) {
    roamState.position.copy(endPos);
    roamState.yaw = roamState.targetYaw = endYaw;
    roamState.pitch = roamState.targetPitch = clamp(endPitch, -1.25, 1.25);
    roamState.velocity.set(0, 0, 0);
    roamState.flight = null;
    return;
  }
  const mid = startPos.clone().lerp(endPos, 0.5);
  const lateral = new THREE.Vector3().subVectors(endPos, startPos).cross(new THREE.Vector3(0, 1, 0));
  if (lateral.lengthSq() > 0.001) {
    lateral.normalize();
    mid.addScaledVector(lateral, Math.min(3.5, dist * 0.14));
  }
  mid.y += Math.min(2.2, dist * 0.08);
  const curve = new THREE.CatmullRomCurve3([startPos, mid, endPos.clone()]);
  roamState.velocity.set(0, 0, 0);
  roamState.flight = {
    curve,
    startYaw: roamState.yaw,
    endYaw,
    startPitch: roamState.pitch,
    endPitch: clamp(endPitch, -1.25, 1.25),
    startMs: performance.now(),
    durationMs: clamp(duration, 0.7, 2.0) * 1000
  };
}

function getB612LandingPose() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const pos = (aspect < 0.85 ? B612_LANDING_POS_PORTRAIT : B612_LANDING_POS_DESKTOP).clone();
  const aim = computeAimYawPitch(pos, B612_AIM_POINT);
  return { pos, yaw: aim.yaw, pitch: aim.pitch };
}

function enterRoamMode({ target = 'home', instant = false } = {}) {
  const wasStation = state.mode !== 'roam';
  const snapInstant = instant || wasStation;
  matchCutState = null;
  roamState.flight = null;
  roamState.velocity.set(0, 0, 0);
  roamState.keys.clear();
  roamState.glidePadActive = false;
  document.getElementById('mobile-glide-pad')?.classList.remove('is-active');

  const veil = document.getElementById('matchcut-veil');
  if (veil) veil.style.setProperty('--mc-flash', '0');
  if (bloomPass) bloomPass.strength = BASE_BLOOM_STRENGTH;
  if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE;

  state.autoPlay = false;
  syncAutoPlayButton();
  state.currentT = state.targetT = 0.0;
  state.activePortal = 'none';
  state.activeStationId = 'works';
  document.body.dataset.zone = 'works';
  document.body.dataset.portal = 'none';

  syncBodyMode('roam');
  setHoveredInteractiveTarget(null);

  if (target === 'b612') {
    const landing = getB612LandingPose();
    if (snapInstant) {
      roamState.position.copy(landing.pos);
      roamState.yaw = roamState.targetYaw = landing.yaw;
      roamState.pitch = roamState.targetPitch = landing.pitch;
    } else {
      startRoamFlight(landing.pos, landing.yaw, landing.pitch, 1.45);
    }
  } else {
    if (snapInstant) {
      roamState.position.copy(ROAM_HOME_POS);
      roamState.yaw = roamState.targetYaw = ROAM_HOME_YAW;
      roamState.pitch = roamState.targetPitch = ROAM_HOME_PITCH;
    } else {
      startRoamFlight(ROAM_HOME_POS, ROAM_HOME_YAW, ROAM_HOME_PITCH, 1.1);
    }
  }

  renderOnceAndSync(performance.now() * 0.001, true);
}

function enterStationAtT(t, opts = {}) {
  const clampedT = clamp(Number(t) || 0.32, 0.26, 1.0);
  matchCutState = null;
  roamState.flight = null;
  roamState.velocity.set(0, 0, 0);
  roamState.keys.clear();
  roamState.glidePadActive = false;

  const veil = document.getElementById('matchcut-veil');
  if (veil) veil.style.setProperty('--mc-flash', '0');
  if (bloomPass) {
    bloomPass.strength = STATION_BLOOM_STRENGTH;
    bloomPass.threshold = STATION_BLOOM_THRESHOLD;
  }
  if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE;

  syncBodyMode('station');
  state.autoPlay = false;
  syncAutoPlayButton();
  state.targetT = clampedT;
  if (opts.instant !== false) state.currentT = clampedT;
  if (opts.poemSlug) state.selectedPoemSlug = opts.poemSlug;
  if (opts.cityName) state.selectedCityName = opts.cityName;
  if (opts.labSlug) state.selectedLabSlug = opts.labSlug;
  updateBookMoyanTexture();
  renderOnceAndSync(performance.now() * 0.001);
  if (opts.toast) showToast(opts.toast);
}

function enterStudyMatchCut() {
  closeInkAtlas();
  if (matchCutState) return window.__qzGetState();
  if (state.mode === 'station') {
    flyTo(0.32, { toast: '回到二层《墨盐》书房' });
    return window.__qzGetState();
  }
  playChimeSound();
  roamState.flight = null;
  roamState.velocity.set(0, 0, 0);
  roamState.keys.clear();
  roamState.glidePadActive = false;
  setHoveredInteractiveTarget(null);

  const startPos = camera.position.clone();
  const targetOutsideWin = new THREE.Vector3(-1.38, 30.72, 31.35);
  const d = startPos.distanceTo(targetOutsideWin);
  const approachPos = startPos.clone().lerp(targetOutsideWin, d > 12 ? 0.45 : 0.65);
  const aimWin = computeAimYawPitch(approachPos, B612_WINDOW_WORLD);

  matchCutState = {
    phase: 'in',
    phaseStartMs: performance.now(),
    durInMs: prefersReducedMotion ? 70 : 400,
    durOutMs: prefersReducedMotion ? 70 : 460,
    startPos,
    approachPos,
    startYaw: roamState.yaw,
    startPitch: roamState.pitch,
    endYaw: aimWin.yaw,
    endPitch: aimWin.pitch
  };
  return window.__qzGetState();
}

function updateRoamCamera(dt, nowMs = performance.now()) {
  if (!camera) return;
  if (roamState.flight) {
    const fl = roamState.flight;
    const p = clamp((nowMs - fl.startMs) / fl.durationMs, 0, 1);
    const u = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    fl.curve.getPoint(u, roamState.position);
    roamState.yaw = roamState.targetYaw = fl.startYaw + shortestAngleDelta(fl.startYaw, fl.endYaw) * u;
    roamState.pitch = roamState.targetPitch = clamp(fl.startPitch + (fl.endPitch - fl.startPitch) * u, -1.25, 1.25);
    if (p >= 1) {
      roamState.flight = null;
      roamState.velocity.set(0, 0, 0);
    }
  } else {
    const rotDamp = prefersReducedMotion ? 1 : Math.min(1, dt * 11);
    roamState.targetPitch = clamp(roamState.targetPitch, -1.25, 1.25);
    roamState.yaw += (roamState.targetYaw - roamState.yaw) * rotDamp;
    roamState.pitch = clamp(roamState.pitch + (roamState.targetPitch - roamState.pitch) * rotDamp, -1.25, 1.25);

    if (roamState.keys.has('KeyA') || roamState.keys.has('ArrowLeft')) roamState.targetYaw += 1.25 * dt;
    if (roamState.keys.has('KeyD') || roamState.keys.has('ArrowRight')) roamState.targetYaw -= 1.25 * dt;

    _roamEuler.set(roamState.pitch, roamState.yaw, 0, 'YXZ');
    _roamForward.set(0, 0, -1).applyEuler(_roamEuler);

    let thrust = 0;
    if (roamState.keys.has('KeyW') || roamState.keys.has('ArrowUp') || roamState.glidePadActive) thrust += 1;
    if (roamState.keys.has('KeyS') || roamState.keys.has('ArrowDown')) thrust -= 1;
    if (thrust !== 0) {
      roamState.velocity.addScaledVector(_roamForward, thrust * 18.0 * dt);
    }

    roamState.velocity.multiplyScalar(Math.exp(-3.5 * dt));
    if (roamState.velocity.lengthSq() > 256) {
      roamState.velocity.setLength(16);
    }
    roamState.position.addScaledVector(roamState.velocity, dt);

    _roamOffset.subVectors(roamState.position, COSMOS_CENTER);
    const distCenter = _roamOffset.length();
    if (distCenter > COSMOS_R_MAX && distCenter > 0.001) {
      const dirOut = _roamOffset.divideScalar(distCenter);
      const excess = distCenter - COSMOS_R_MAX;
      const radialVel = roamState.velocity.dot(dirOut);
      if (radialVel > 0) {
        roamState.velocity.addScaledVector(dirOut, -radialVel * clamp(excess * 0.25, 0, 1));
      }
      roamState.velocity.addScaledVector(dirOut, -excess * 2.4 * dt);
      if (distCenter > COSMOS_R_HARD) {
        roamState.position.copy(COSMOS_CENTER).addScaledVector(dirOut, COSMOS_R_HARD);
      }
    }
  }

  camera.position.copy(roamState.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(roamState.pitch, roamState.yaw, 0, 'YXZ');
  camera.fov = camera.aspect < 0.85 ? 58 : 50;
  camera.updateProjectionMatrix();
}

function updateSceneStageIsolations(t) {
  if (!cosmosGroup || !worldGroup) return;
  if (state.mode === 'roam') {
    cosmosGroup.visible = true;
    worldGroup.visible = false;
    return;
  }

  cosmosGroup.visible = false;
  worldGroup.visible = true;

  // Dynamic Window Sash Swing as camera approaches portal-2 (t: 0.50 -> 0.62)
  const winFactor = THREE.MathUtils.smoothstep(t, 0.50, 0.62);
  const swingAngle = 0.04 + winFactor * 1.22;
  const sashL = namedObjects.get('Window_Sash_L');
  const sashR = namedObjects.get('Window_Sash_R');
  if (sashL) sashL.rotation.y = swingAngle;
  if (sashR) sashR.rotation.y = -swingAngle;
}

function pickInteractiveHits(ndcX, ndcY) {
  if (!camera || !clickableRoots.length) return [];
  const rc = new THREE.Raycaster();
  rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
  return rc.intersectObjects(clickableRoots, true).filter((h) => {
    if (h.object.userData?.__qzIsPhotoFrame) {
      const f = photoFrames[h.object.userData.__qzFrameIdx];
      if (!f || f.reveal < 0.35) return false;
    }
    let p = h.object;
    while (p) {
      if (p.visible === false) return false;
      p = p.parent;
    }
    return true;
  });
}

function bindEvents(canvas) {
  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) {
      composer.setPixelRatio(pr);
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  window.addEventListener('wheel', (e) => {
    if (isOverlayBlockingScene()) return;
    const scrollable = e.target.closest('.station-deck-body, .dossier-body, .poem-preview-lines, .wish-list');
    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 4) {
      const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
      const atBot = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBot) return;
    }
    e.preventDefault();
    if (state.mode === 'roam') {
      if (matchCutState) return;
      roamState.flight = null;
      _roamEuler.set(roamState.pitch, roamState.yaw, 0, 'YXZ');
      _roamForward.set(0, 0, -1).applyEuler(_roamEuler);
      const impulse = clamp(e.deltaY * 0.016, -6.5, 6.5);
      roamState.velocity.addScaledVector(_roamForward, impulse);
      return;
    }
    state.autoPlay = false;
    syncAutoPlayButton();
    state.lastWheelAt = performance.now();
    state.targetT = clamp(state.targetT + e.deltaY * 0.00028, 0.26, 1);
  }, { passive: false });

  let stationTouchY = null;
  window.addEventListener('touchstart', (e) => {
    if (state.mode !== 'station') return;
    if (e.target.closest('#timeline-rail, #station-deck, #dossier-modal, #darkroom-modal, #ink-atlas, #hud-topbar')) return;
    stationTouchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (state.mode !== 'station' || stationTouchY === null) return;
    const dy = stationTouchY - e.touches[0].clientY;
    stationTouchY = e.touches[0].clientY;
    state.autoPlay = false;
    syncAutoPlayButton();
    state.lastWheelAt = performance.now();
    state.targetT = clamp(state.targetT + dy * 0.0008, 0.26, 1);
  }, { passive: true });
  window.addEventListener('touchend', () => { stationTouchY = null; });

  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragMoved = false;
  let lastRaycastAt = 0;

  window.addEventListener('pointermove', (e) => {
    state.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    state.pointerY = -(e.clientY / window.innerHeight) * 2 + 1;

    if (dragPointerId === e.pointerId && state.mode === 'roam' && !matchCutState) {
      const dx = e.clientX - dragLastX;
      const dy = e.clientY - dragLastY;
      dragLastX = e.clientX;
      dragLastY = e.clientY;
      if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 5) {
        dragMoved = true;
        roamState.flight = null;
      }
      roamState.targetYaw += dx * 0.0036;
      roamState.targetPitch = clamp(roamState.targetPitch + dy * 0.0032, -1.25, 1.25);
      if (canvas) canvas.style.cursor = 'grabbing';
      return;
    }

    if (isOverlayBlockingScene() || (activeModalEl && !activeModalEl.hidden)) {
      setHoveredInteractiveTarget(null);
      if (canvas) canvas.style.cursor = 'default';
      return;
    }
    const now = performance.now();
    if (now - lastRaycastAt < 40) return;
    lastRaycastAt = now;
    if (canvas && clickableRoots.length) {
      const hits = pickInteractiveHits(state.pointerX, state.pointerY);
      const hitName = hits.length ? resolveClickTargetName(hits[0].object) : null;
      canvas.style.cursor = hitName ? 'pointer' : 'default';
      setHoveredInteractiveTarget(hitName);
    }
  });

  if (canvas) {
    canvas.style.cursor = 'default';
    canvas.addEventListener('pointerleave', () => {
      canvas.style.cursor = 'default';
      setHoveredInteractiveTarget(null);
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (isOverlayBlockingScene() || matchCutState) return;
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      dragPointerId = e.pointerId;
      dragStartX = dragLastX = e.clientX;
      dragStartY = dragLastY = e.clientY;
      dragMoved = false;
      if (state.mode === 'roam') {
        canvas.setPointerCapture?.(e.pointerId);
      }
    });
    const endPointerDrag = (e) => {
      if (dragPointerId !== e.pointerId) return;
      const wasDrag = dragMoved;
      dragPointerId = null;
      dragMoved = false;
      canvas.style.cursor = 'default';
      if (e.type === 'pointerup' && !wasDrag && !matchCutState && !isOverlayBlockingScene()) {
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        const hits = pickInteractiveHits(ndcX, ndcY);
        if (hits.length) {
          const hitName = resolveClickTargetName(hits[0].object);
          if (hitName) handleInteractiveHit(hitName);
        }
      }
    };
    canvas.addEventListener('pointerup', endPointerDrag);
    canvas.addEventListener('pointercancel', endPointerDrag);
  }

  // Mobile Glide Pad (<=900px roam forward drift)
  const glidePad = document.getElementById('mobile-glide-pad');
  if (glidePad) {
    const startGlide = (e) => {
      if (state.mode !== 'roam' || matchCutState) return;
      e.preventDefault();
      e.stopPropagation();
      roamState.flight = null;
      roamState.glidePadActive = true;
      glidePad.classList.add('is-active');
      if (e.pointerId !== undefined) glidePad.setPointerCapture?.(e.pointerId);
    };
    const stopGlide = () => {
      roamState.glidePadActive = false;
      glidePad.classList.remove('is-active');
    };
    glidePad.addEventListener('pointerdown', startGlide);
    glidePad.addEventListener('pointerup', stopGlide);
    glidePad.addEventListener('pointercancel', stopGlide);
    glidePad.addEventListener('lostpointercapture', stopGlide);
    glidePad.addEventListener('touchstart', startGlide, { passive: false });
    glidePad.addEventListener('touchend', stopGlide);
    glidePad.addEventListener('touchcancel', stopGlide);
    window.addEventListener('blur', stopGlide);
  }

  // Edge Star-Guide Pip -> smooth damped arc flight to B-612 silhouette
  document.getElementById('star-guide-btn')?.addEventListener('click', () => {
    if (state.mode !== 'roam' || matchCutState) return;
    playChimeSound();
    const landing = getB612LandingPose();
    startRoamFlight(landing.pos, landing.yaw, landing.pitch, 1.5);
  });

  // Ink Atlas Overlay & Top HUD Navigation
  document.getElementById('btn-menu-open')?.addEventListener('click', openInkAtlas);
  document.getElementById('btn-atlas-open')?.addEventListener('click', openInkAtlas);
  document.getElementById('atlas-close')?.addEventListener('click', closeInkAtlas);
  document.getElementById('atlas-backdrop')?.addEventListener('click', closeInkAtlas);
  document.getElementById('btn-roam-return')?.addEventListener('click', () => {
    enterRoamMode({ target: 'home', instant: false });
  });

  document.querySelectorAll('#ink-atlas [data-atlas-action="roam"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeInkAtlas();
      enterRoamMode({ target: 'home', instant: true });
    });
  });
  document.querySelectorAll('#ink-atlas [data-atlas-t]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = Number(btn.dataset.atlasT);
      closeInkAtlas();
      enterStationAtT(t, { instant: true });
    });
  });

  document.querySelectorAll('.station-pill, .rail-tick').forEach((btn) => {
    btn.addEventListener('click', () => flyTo(Number(btn.dataset.t)));
  });

  document.getElementById('btn-deck-about')?.addEventListener('click', openAboutDossier);
  document.getElementById('btn-deck-toggle')?.addEventListener('click', () => toggleDeckCollapse());
  document.getElementById('btn-autoplay')?.addEventListener('click', () => {
    if (state.mode !== 'station') return;
    state.autoPlay = !state.autoPlay;
    if (state.autoPlay && state.currentT >= 0.99) state.targetT = state.currentT = 0.26;
    syncAutoPlayButton();
  });

  const rail = document.getElementById('rail-track-wrap');
  if (rail) {
    let dragging = false;
    const scrub = (clientX) => {
      const rect = rail.getBoundingClientRect();
      const next = clamp((clientX - rect.left) / rect.width, 0.26, 1);
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
    rail.addEventListener('keydown', (e) => {
      const k = e.key;
      let next = null;
      if (k === 'Home') next = 0.26;
      else if (k === 'End') next = 1;
      else if (k === 'PageUp') next = clamp(state.targetT + 0.1, 0.26, 1);
      else if (k === 'PageDown') next = clamp(state.targetT - 0.1, 0.26, 1);
      else if (k === 'ArrowRight' || k === 'ArrowUp') next = clamp(state.targetT + 0.02, 0.26, 1);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') next = clamp(state.targetT - 0.02, 0.26, 1);
      if (next !== null) {
        e.preventDefault();
        e.stopPropagation();
        state.autoPlay = false;
        syncAutoPlayButton();
        state.targetT = next;
      }
    });
  }

  document.getElementById('dossier-close')?.addEventListener('click', closeDossier);
  document.getElementById('dossier-backdrop')?.addEventListener('click', closeDossier);

  // Darkroom Modal Bindings (zoom + drag-to-pan)
  document.getElementById('dr-close')?.addEventListener('click', closeDarkroomViewer);
  document.getElementById('dr-prev')?.addEventListener('click', () => stepDarkroomPhoto(-1));
  document.getElementById('dr-next')?.addEventListener('click', () => stepDarkroomPhoto(1));
  document.getElementById('dr-zoom-btn')?.addEventListener('click', () => {
    state.darkroomZoomed = !state.darkroomZoomed;
    if (!state.darkroomZoomed) {
      state.darkroomPanX = 0;
      state.darkroomPanY = 0;
    }
    renderDarkroomViewer();
  });

  const drImgWrap = document.getElementById('dr-img-wrap');
  const drMainImg = document.getElementById('dr-main-img');
  if (drImgWrap && drMainImg) {
    let panDragging = false, panMoved = false, startX = 0, startY = 0, basePanX = 0, basePanY = 0;
    drImgWrap.addEventListener('pointerdown', (e) => {
      if (!state.darkroomZoomed) {
        startX = e.clientX;
        startY = e.clientY;
        panMoved = false;
        return;
      }
      panDragging = true;
      panMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      basePanX = state.darkroomPanX;
      basePanY = state.darkroomPanY;
      drImgWrap.classList.add('is-dragging');
      drImgWrap.setPointerCapture?.(e.pointerId);
    });
    drImgWrap.addEventListener('pointermove', (e) => {
      if (!panDragging || !state.darkroomZoomed) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 4) panMoved = true;
      state.darkroomPanX = basePanX + dx;
      state.darkroomPanY = basePanY + dy;
      applyDarkroomTransform();
    });
    const finishPan = () => {
      if (!panDragging) return;
      panDragging = false;
      drImgWrap.classList.remove('is-dragging');
    };
    drImgWrap.addEventListener('pointerup', finishPan);
    drImgWrap.addEventListener('pointercancel', finishPan);
    drMainImg.addEventListener('click', () => {
      if (panMoved) {
        panMoved = false;
        return;
      }
      state.darkroomZoomed = !state.darkroomZoomed;
      if (!state.darkroomZoomed) {
        state.darkroomPanX = 0;
        state.darkroomPanY = 0;
      }
      renderDarkroomViewer();
    });
  }

  document.getElementById('dr-intro-toggle')?.addEventListener('click', () => {
    state.darkroomIntroOpen = !state.darkroomIntroOpen;
    const drawer = document.getElementById('dr-intro-drawer');
    const btn = document.getElementById('dr-intro-toggle');
    if (drawer) drawer.hidden = !state.darkroomIntroOpen;
    if (btn) btn.setAttribute('aria-expanded', String(state.darkroomIntroOpen));
  });
  document.getElementById('dr-fly-study-btn')?.addEventListener('click', () => {
    closeDarkroomViewer();
    if (state.mode === 'roam') {
      enterStudyMatchCut();
    } else {
      flyTo(0.32, { toast: '步入二层《墨盐》阁楼书房' });
    }
  });

  window.addEventListener('blur', () => { roamState.keys.clear(); });
  window.addEventListener('keyup', (e) => { roamState.keys.delete(e.code); });
  window.addEventListener('keydown', (e) => {
    handleModalTabTrap(e);
    const dr = document.getElementById('darkroom-modal');
    if (dr && !dr.hidden) {
      if (e.key === 'Escape') return closeDarkroomViewer();
      if (e.key === 'ArrowLeft') return stepDarkroomPhoto(-1);
      if (e.key === 'ArrowRight') return stepDarkroomPhoto(1);
      return;
    }
    const atlas = document.getElementById('ink-atlas');
    if (atlas && !atlas.hidden) {
      if (e.key === 'Escape') return closeInkAtlas();
      return;
    }
    if (e.key === 'Escape') {
      const dm = document.getElementById('dossier-modal');
      if (dm && !dm.hidden) return closeDossier();
      return;
    }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    if (state.mode === 'roam') {
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        roamState.flight = null;
        roamState.keys.add(e.code);
      }
      return;
    }

    if (e.key === ' ' && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      state.autoPlay = !state.autoPlay;
      syncAutoPlayButton();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      state.autoPlay = false;
      state.targetT = clamp(state.targetT + 0.04, 0.26, 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      state.autoPlay = false;
      state.targetT = clamp(state.targetT - 0.04, 0.26, 1);
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

  const motionScale = prefersReducedMotion ? 0 : 1;
  tmpTarget.x += state.pointerX * 0.42 * motionScale;
  tmpTarget.y += state.pointerY * 0.24 * motionScale + Math.sin(elapsedSec * 0.6) * 0.025 * motionScale;

  const portrait = camera.aspect < 0.85;
  let extraFov = 0;
  if (portrait) {
    const narrow = clamp((0.85 - camera.aspect) / 0.39, 0, 1.35);
    extraFov = (0.85 - camera.aspect) * 38;
    if (t >= 0.42 && t <= 0.62) {
      const labW = Math.sin(THREE.MathUtils.smoothstep(t, 0.42, 0.62) * Math.PI);
      tmpPos.x -= 1.25 * labW * narrow;
      tmpPos.y += 1.65 * labW * narrow;
      tmpPos.z += 2.95 * labW * narrow;
      tmpTarget.x -= 1.35 * labW * narrow;
      extraFov += 12 * labW * narrow;
    } else if (t >= 0.84) {
      const riverW = THREE.MathUtils.smoothstep(t, 0.84, 0.96);
      tmpPos.x -= 0.4 * riverW * narrow;
      tmpPos.y += 1.15 * riverW * narrow;
      tmpPos.z += 4.6 * riverW * narrow;
      tmpTarget.x -= 1.65 * riverW * narrow;
      tmpTarget.y += 0.55 * riverW * narrow;
      extraFov += 10 * riverW * narrow;
    }
  }
  camera.rotation.order = 'XYZ';
  camera.position.copy(tmpPos);
  camera.fov = Math.min(68, sampleFov(t) + extraFov);
  camera.updateProjectionMatrix();
  camera.lookAt(tmpTarget);

  if (scene?.fog) {
    const riverMist = THREE.MathUtils.smoothstep(t, 0.78, 0.96);
    const interiorEase = THREE.MathUtils.smoothstep(t, 0.20, 0.32);
    scene.fog.density = 0.0038 + 0.0014 * interiorEase + 0.0063 * riverMist;
  }

  if (pointerLight) {
    pointerLight.position.set(tmpTarget.x, tmpTarget.y + 1.5, tmpTarget.z);
  }
}

function renderFrame() {
  if (composer) composer.render();
  else if (renderer && scene && camera) renderer.render(scene, camera);
}

function renderOnceAndSync(nowSec = 0, instantPhotoSnap = false) {
  updateSceneStageIsolations(state.currentT);
  const starGuideBtn = document.getElementById('star-guide-btn');
  if (state.mode === 'roam') {
    updateRoamCamera(0);
    updatePhotoFrames(photoFrames, camera, nowSec, 0.016, prefersReducedMotion, instantPhotoSnap);
    updateStarGuidePip(starGuideBtn, camera, 'roam');
    updateSpatialMarkers();
  } else {
    if (starGuideBtn) starGuideBtn.hidden = true;
    applyCameraAtT(state.currentT, nowSec);
    syncHudAndTimeline();
    updateSpatialMarkers();
  }
  renderFrame();
}

async function bootCinema() {
  updateSolarTermHUD();
  initSoundDock();

  const canvas = document.getElementById('onetake-canvas');
  const statusEl = document.getElementById('loader-status');
  const loaderEl = document.getElementById('cinema-loader');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040812);
  scene.fog = new THREE.FogExp2(0x040812, 0.0085);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 480);
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = BASE_EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  renderPass = new RenderPass(scene, camera);
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BASE_BLOOM_STRENGTH,
    BASE_BLOOM_RADIUS,
    BASE_BLOOM_THRESHOLD
  );
  outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  buildRefinedCosmosEffects();
  setupLighting();
  buildProceduralEnvMap();
  syncBodyMode('roam');
  bindEvents(canvas);

  let loadedOk = false;
  try {
    if (statusEl) statusEl.textContent = '载入星海与五境轨线…';
    const camRes = await fetch('./assets/qingzhou-world-camera.json');
    if (!camRes.ok) throw new Error(`HTTP ${camRes.status} camera.json`);
    const camJson = await camRes.json();
    cameraTrack = camJson.cameraTrack || [];
    posCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.pos)), false, 'catmullrom', 0.35);
    lookCurve = new THREE.CatmullRomCurve3(cameraTrack.map((k) => new THREE.Vector3(...k.target)), false, 'catmullrom', 0.35);

    if (statusEl) statusEl.textContent = '载入 Blender 实体空间建筑 (GLB)…';
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./assets/qingzhou-world.glb');
    glbRoot = gltf.scene;

    // Partition top-level GLB nodes (including Anchor_* & HitProxy_*) into cosmosGroup vs worldGroup
    const topNodes = [...glbRoot.children];
    for (const node of topNodes) {
      if (/^(B612_|Orrery_|Anchor_(?:B612|Orrery)|HitProxy_(?:B612|Orrery))/.test(node.name || '')) {
        cosmosGroup.add(node);
      } else {
        worldGroup.add(node);
      }
    }

    scene.traverse((obj) => {
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m.name === 'HitProxyMat') {
            m.transparent = true;
            m.opacity = 0;
            m.colorWrite = false;
            m.depthWrite = false;
          }
          if (m.name && !materialsByName.has(m.name)) {
            materialsByName.set(m.name, m);
          }
        }
      }
      if (!obj.name) return;
      if (!namedObjects.has(obj.name)) namedObjects.set(obj.name, obj);
      if (obj.userData && obj.userData.isHitProxy && obj.userData.hitTarget && !/^HitProxy_Orrery_/.test(obj.name)) {
        obj.userData.__qzInteractiveName = obj.userData.hitTarget;
        clickableRoots.push(obj);
      } else if (INTERACTIVE_NAME_RE.test(obj.name)) {
        obj.userData.__qzInteractiveName = obj.name;
        clickableRoots.push(obj);
      } else if (obj.name === 'B612_Asteroid_Body') {
        // Occludes clicks through the planet sphere without triggering landing
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

    hideOrreryNodes(namedObjects);
    applyProceduralPBRTextures();
    sculptB612TwilightLook({ namedObjects, b612HaloMat, b612MistMat, cosmosGroup });
    photoFrames = createScatteredPhotoFrames(cosmosGroup, archive());
    for (const f of photoFrames) {
      clickableRoots.push(f.photoMesh);
    }

    for (const objName of namedObjects.keys()) {
      if (INTERACTIVE_NAME_RE.test(objName)) {
        registerInteractiveHoverMeshes(objName, namedObjects.get(objName));
      }
    }
    addContactShadowDecals();
    upgradeRiverBedShader();
    createWaterRipples();
    document.fonts?.ready?.then(() => {
      for (let i = 0; i < 3; i++) {
        const bp = materialsByName.get(`LabBlueprintMat_${i}`);
        if (bp) {
          const tex = makeBlueprintTexture(i);
          bp.map = tex; bp.emissiveMap = tex; bp.needsUpdate = true;
        }
      }
      for (let i = 0; i < 4; i++) {
        const sm = materialsByName.get(`HerbariumSlideMat_${i}`);
        if (sm) {
          const tex = makeHerbariumSlideTexture(i);
          sm.map = tex; sm.emissiveMap = tex; sm.needsUpdate = true;
        }
      }
      updateBookMoyanTexture();
    });
    window.__glbLoaded = true;
    loadedOk = true;
  } catch (err) {
    console.error('One-Take 3D boot error:', err);
    const titleEl = document.getElementById('loader-title');
    const actionsEl = document.getElementById('loader-actions');
    if (loaderEl) loaderEl.classList.add('is-error');
    if (titleEl) titleEl.textContent = '3D 空间资源未能顺利显影';
    if (statusEl) statusEl.textContent = `可能由于网络波动或浏览器 WebGL 受限（${err?.message || err}），你可以重试或直接浏览原版平面档案。`;
    if (actionsEl) actionsEl.hidden = false;
    document.getElementById('btn-loader-retry')?.addEventListener('click', () => window.location.reload());
  }

  toggleDeckCollapse(state.deckCollapsed);
  renderStationDeck(true);
  renderOnceAndSync(0, true);
  window.__onetakeReady = loadedOk;
  if (loadedOk && loaderEl) loaderEl.classList.add('is-ready');

  window.__qzSetT = (t, instant = true) => {
    const numT = clamp(Number(t) || 0, 0, 1);
    if (numT < 0.24) {
      enterRoamMode({ target: numT <= 0.05 ? 'home' : 'b612', instant });
    } else {
      enterStationAtT(numT, { instant });
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
  window.__qzFocusTarget = (id, opts = {}) => {
    const instant = typeof opts === 'boolean' ? opts : (opts?.instant !== false);
    closeInkAtlas();
    matchCutState = null;
    const veil = document.getElementById('matchcut-veil');
    if (veil) veil.style.setProperty('--mc-flash', '0');
    if (bloomPass) bloomPass.strength = BASE_BLOOM_STRENGTH;
    if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE;

    if (id === 'b612') {
      enterRoamMode({ target: 'b612', instant });
      return window.__qzGetState();
    }
    const m = String(id || '').match(/^frame-(\d+)$/);
    if (m) {
      const idx = Number(m[1]);
      const f = photoFrames[idx];
      if (f) {
        syncBodyMode('roam');
        const dir = new THREE.Vector3().subVectors(ROAM_HOME_POS, f.basePos);
        if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
        dir.normalize();
        const camPos = f.basePos.clone().addScaledVector(dir, 8.2);
        const aim = computeAimYawPitch(camPos, f.basePos);
        if (instant) {
          roamState.flight = null;
          roamState.velocity.set(0, 0, 0);
          roamState.position.copy(camPos);
          roamState.yaw = roamState.targetYaw = aim.yaw;
          roamState.pitch = roamState.targetPitch = aim.pitch;
          renderOnceAndSync(performance.now() * 0.001, true);
        } else {
          startRoamFlight(camPos, aim.yaw, aim.pitch, 1.35);
        }
      }
    }
    return window.__qzGetState();
  };
  window.__qzEnterStudyMatchCut = () => enterStudyMatchCut();
  window.__qzGetState = () => {
    const sgBtn = document.getElementById('star-guide-btn');
    const orreryVisible = ['Orrery_0', 'Orrery_1', 'Orrery_2', 'B612_Star_Ring']
      .some((n) => Boolean(namedObjects.get(n)?.visible));
    return {
      ready: Boolean(window.__onetakeReady),
      glbLoaded: Boolean(window.__glbLoaded),
      mode: state.mode,
      currentT: Number(state.currentT.toFixed(4)),
      targetT: Number(state.targetT.toFixed(4)),
      zone: state.mode === 'roam' ? 'works' : state.activeStationId,
      portal: state.activePortal,
      selectedCity: state.selectedCityName,
      selectedPoem: state.selectedPoemSlug,
      selectedLab: state.selectedLabSlug,
      cosmosVisible: Boolean(cosmosGroup?.visible),
      worldVisible: Boolean(worldGroup?.visible),
      orreryVisible,
      bloomStrength: Number((bloomPass?.strength ?? 0).toFixed(3)),
      bloomThreshold: Number((bloomPass?.threshold ?? 0).toFixed(3)),
      matchCutActive: Boolean(matchCutState),
      cameraPos: [
        Number(camera.position.x.toFixed(3)),
        Number(camera.position.y.toFixed(3)),
        Number(camera.position.z.toFixed(3))
      ],
      pitch: Number(roamState.pitch.toFixed(4)),
      yaw: Number(roamState.yaw.toFixed(4)),
      starGuideVisible: Boolean(sgBtn && !sgBtn.hidden),
      photoFrames: photoFrames.map((f, i) => ({
        id: `frame-${i}`,
        workSlug: f.workSlug,
        photoIdx: f.photoIdx,
        reveal: Number(f.reveal.toFixed(3)),
        distance: Number(camera.position.distanceTo(f.group.position).toFixed(2))
      })),
      glObjects: namedObjects.size
    };
  };

  let prevMs = performance.now();
  function animate(nowMs) {
    requestAnimationFrame(animate);
    const dt = Math.min((nowMs - prevMs) * 0.001, 0.08);
    prevMs = nowMs;
    const elapsed = prefersReducedMotion ? 0 : nowMs * 0.001;

    if (deepStarMat) deepStarMat.uniforms.time.value = elapsed;
    if (midDustMat) midDustMat.uniforms.time.value = elapsed;
    if (b612MistMat) b612MistMat.uniforms.time.value = elapsed;

    if (isOverlayBlockingScene()) return;

    if (matchCutState) {
      const veil = document.getElementById('matchcut-veil');
      if (matchCutState.phase === 'in') {
        const p = clamp((nowMs - matchCutState.phaseStartMs) / matchCutState.durInMs, 0, 1);
        const ease = p * p;
        roamState.position.lerpVectors(matchCutState.startPos, matchCutState.approachPos, ease);
        roamState.yaw = matchCutState.startYaw + shortestAngleDelta(matchCutState.startYaw, matchCutState.endYaw) * ease;
        roamState.pitch = clamp(matchCutState.startPitch + (matchCutState.endPitch - matchCutState.startPitch) * ease, -1.25, 1.25);
        camera.position.copy(roamState.position);
        camera.rotation.order = 'YXZ';
        camera.rotation.set(roamState.pitch, roamState.yaw, 0, 'YXZ');
        if (bloomPass) bloomPass.strength = BASE_BLOOM_STRENGTH + 2.35 * ease;
        if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE + 0.42 * ease;
        if (veil) veil.style.setProperty('--mc-flash', Math.pow(p, 1.15).toFixed(4));
        updatePhotoFrames(photoFrames, camera, elapsed, dt, prefersReducedMotion, false);
        const sgBtn = document.getElementById('star-guide-btn');
        if (sgBtn) sgBtn.hidden = true;
        renderFrame();

        if (p >= 1) {
          syncBodyMode('station');
          state.currentT = state.targetT = 0.32;
          state.activePortal = 'none';
          document.body.dataset.portal = 'none';
          applyCameraAtT(0.32, elapsed);
          syncHudAndTimeline();
          renderStationDeck(true);
          updateSpatialMarkers();
          if (veil) veil.style.setProperty('--mc-flash', '1');
          renderFrame();
          matchCutState.phase = 'out';
          matchCutState.phaseStartMs = nowMs;
        }
        return;
      }

      const q = clamp((nowMs - matchCutState.phaseStartMs) / matchCutState.durOutMs, 0, 1);
      const decay = Math.pow(1 - q, 3);
      if (bloomPass) bloomPass.strength = STATION_BLOOM_STRENGTH + (BASE_BLOOM_STRENGTH + 2.35 - STATION_BLOOM_STRENGTH) * decay;
      if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE + 0.42 * decay;
      if (veil) veil.style.setProperty('--mc-flash', decay.toFixed(4));
      applyCameraAtT(0.32, elapsed);
      syncHudAndTimeline();
      updateSpatialMarkers();
      renderFrame();

      if (q >= 1) {
        if (bloomPass) {
          bloomPass.strength = STATION_BLOOM_STRENGTH;
          bloomPass.threshold = STATION_BLOOM_THRESHOLD;
        }
        if (renderer) renderer.toneMappingExposure = BASE_EXPOSURE;
        if (veil) veil.style.setProperty('--mc-flash', '0');
        matchCutState = null;
        showToast('窗灯余晖渐散 · 步入二层《墨盐》书房 ✨');
      }
      return;
    }

    if (state.mode === 'roam') {
      updateSceneStageIsolations(0);
      updateRoamCamera(dt, nowMs);
      updatePhotoFrames(photoFrames, camera, elapsed, dt, prefersReducedMotion, false);
      updateStarGuidePip(document.getElementById('star-guide-btn'), camera, 'roam');
      renderFrame();
      return;
    }

    // Station mode (02~05)
    if (state.autoPlay) {
      state.targetT = Math.min(1, state.targetT + dt * 0.028);
      if (state.targetT >= 0.999) {
        state.autoPlay = false;
        syncAutoPlayButton();
      }
    } else if (nowMs - state.lastWheelAt > 200) {
      for (const st of STATIONS) {
        if (st.t >= 0.26 && Math.abs(state.targetT - st.t) < 0.012) {
          state.targetT += (st.t - state.targetT) * Math.min(1, dt * 4);
        }
      }
    }

    state.currentT += (state.targetT - state.currentT) * Math.min(1, dt * 6.5);

    const chime = namedObjects.get('Roof_Windchime');
    if (chime && worldGroup?.visible && !prefersReducedMotion && state.currentT < 0.35) {
      chime.rotation.z = Math.sin(elapsed * 1.4) * 0.08;
    }

    if (worldGroup?.visible && state.currentT >= 0.50) {
      for (const [idx, entry] of cityBeaconMeshes.entries()) {
        const place = PLACES_22[idx];
        const isSelected = place && place.name === state.selectedCityName;
        const pulse = 1 + (isSelected ? (prefersReducedMotion ? 0.25 : 0.35 + 0.22 * Math.sin(elapsed * 4.5)) : (prefersReducedMotion ? 0 : 0.08 * Math.sin(elapsed * 2 + idx)));
        entry.obj.scale.set(isSelected ? 1.38 : 1.0, pulse, isSelected ? 1.38 : 1.0);
      }

      if (state.currentT >= 0.68) {
        for (let i = 0; i < riverBoats.length; i++) {
          const b = riverBoats[i];
          if (!prefersReducedMotion) {
            b.obj.position.y = b.baseY + Math.sin(elapsed * 1.5 + b.phase) * 0.055;
            b.obj.rotation.z = Math.sin(elapsed * 1.1 + b.phase) * 0.038;
          }
          if (waterShaderMat && waterShaderMat.uniforms.uBoats.value[i]) {
            waterShaderMat.uniforms.uBoats.value[i].set(b.obj.position.x, b.obj.position.y, b.obj.position.z - 1.1);
          }
        }
        if (waterShaderMat) waterShaderMat.uniforms.uTime.value = elapsed;

        for (const rp of rippleRings) {
          const cycle = ((elapsed * 0.42 + rp.phase) % 1);
          const sc = prefersReducedMotion ? 1.1 : (0.75 + cycle * 1.5);
          rp.ring.scale.set(sc, sc, sc);
          rp.ring.material.opacity = prefersReducedMotion ? 0.35 : ((1 - cycle) * 0.52);
        }
      }
    }

    if (cascadePoints && worldGroup?.visible && !prefersReducedMotion && state.currentT >= 0.48) {
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
