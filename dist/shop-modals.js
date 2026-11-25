import {
  HERBARIUM_SAMPLES,
  PLACES_22,
  CITY_MEMORIES,
  LAB_SLUG_ALIAS,
  esc,
  clamp,
  archive,
  imgSrc,
  ensureSfx,
  playChimeSound,
  playWoodTapSound,
  playWaterSplashSound,
  getSealsMap,
  togglePoemSeal,
  getAnnotationsMap,
  addPoemAnnotation,
  getRiverWishes,
  addRiverWish
} from './shop-data.js';
import { getExhibitById } from './room-act.js';

export function createShopModals(ctx) {
  const { state, onUpdateBookMoyan, onTriggerSealStamp, onSpawnWishLantern, onFocusExhibit, onSelectCity, onSelectAtlasRegion } = ctx;

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function showToast(msg, ms = 2600) {
    const el = document.getElementById('cinema-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  /* ---------- Accessible Modal Focus Trap ---------- */
  const focusStack = [];
  function openModalFocus(modalEl) {
    focusStack.push(document.activeElement);
    const first = modalEl?.querySelector('button:not([hidden]):not([disabled]), input:not([disabled]), select:not([disabled]), a[href]');
    if (first) setTimeout(() => first.focus(), 20);
  }
  function closeModalFocus() {
    const prev = focusStack.pop();
    if (prev && typeof prev.focus === 'function') prev.focus();
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
  function openDossier(kicker, titleText, html, actionOpts = null) {
    const modal = document.getElementById('dossier-modal');
    const kickerEl = document.getElementById('dossier-kicker');
    const titleEl = document.getElementById('dossier-title');
    const bodyEl = document.getElementById('dossier-body');
    const flyBtn = document.getElementById('dossier-fly-btn');
    if (!modal || !bodyEl) return;

    kickerEl.textContent = kicker;
    titleEl.textContent = titleText;
    bodyEl.innerHTML = html;

    if (actionOpts) {
      flyBtn.hidden = false;
      flyBtn.textContent = actionOpts.label;
      flyBtn.onclick = () => {
        closeDossier();
        if (actionOpts.exhibitId) onFocusExhibit?.(actionOpts.exhibitId);
        if (actionOpts.cityName) onSelectCity?.(actionOpts.cityName);
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
    onUpdateBookMoyan?.();
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

    const actionOpts = p.place ? { label: `前往沙盘 · ${p.place} ↗`, exhibitId: 'atlas', cityName: p.place } : null;
    openDossier('《墨盐》全本互动诗卷', p.title, html, actionOpts);

    document.getElementById('dossier-poem-picker')?.addEventListener('change', (e) => {
      openPoemDossier(e.target.value);
      renderExhibitDeck(true);
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
    openDossier(`${lab.id} · 月下实验桌档案`, lab.title, html, { label: '→ 前往中央青绿山河沙盘', exhibitId: 'atlas' });
  }

  function openAboutDossier() {
    const html = `
      <p>欢迎光临《清舟的杂货铺》v3.0 三幕立体奇珍阁。</p>
      <p>本版采用 <strong>2D × 2.5D × 3D 混合叙事架构</strong>，由 <strong>Three.js Custom GLSL Shaders</strong> 与 <strong>Blender 4.2.9 LTS</strong> 联袂呈现：</p>
      <ul>
        <li><strong>第一幕 · 旋臂银河与大气行星</strong>：26,000 颗恒星与星云尘埃织就的双旋臂银河，外臂悬停着拥有海洋、金色原野、流动云层与瑞利大气辉光的「清舟星」。点击行星即可穿云降落。</li>
        <li><strong>第二幕 · 紫金黄昏向日葵花海</strong>：穿破 GLSL 体积云层，落入紫罗兰暮色与熔金落日交织的 2.5D/3D 混合向日葵花海；1,450 株迎风摇曳的向日葵让出一条石板小径，五只引路萤火虫将你带向暖灯木屋。</li>
        <li><strong>第三幕 · 一屋五座可拖拽微缩世界</strong>：推门进入清澈高对比的深夜暖木杂货铺（零灰雾！），一屋陈列五座可拖拽旋转、滚轮拉近端详的微缩世界：复古胶片暗箱、宣纸《墨盐》诗卷与真实落印的朱砂印章、掀盖玻璃植物标本匣、桌面 360° 宋元青绿山河沙盘，以及临窗玻璃箱内的微缩江南夜河与放灯归舟。</li>
      </ul>
      <p style="color:var(--ink-muted);">原版独立平面多系统档案已完整备份保留于 <a href="./archive.html" style="color:var(--gold-brass);">./archive.html</a>，互不覆盖。</p>
    `;
    openDossier('COLOPHON · 银河、花海与微缩奇珍阁', '关于清舟的杂货铺', html);
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
        } catch {
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

  /* ---------- Right Floating Exhibit Inspection Deck ---------- */
  let lastDeckKey = '';
  function renderExhibitDeck(force = false) {
    const deck = document.getElementById('station-deck');
    const eyebrow = document.getElementById('deck-eyebrow');
    const title = document.getElementById('deck-title');
    const body = document.getElementById('station-deck-body');
    if (!deck || !body) return;

    const ex = state.act === 'room' ? getExhibitById(state.focusedExhibit) : null;
    if (!ex) {
      deck.hidden = true;
      return;
    }
    deck.hidden = false;
    eyebrow.textContent = ex.eyebrow;
    title.textContent = ex.title;

    const deckKey = `${ex.id}|${state.selectedWorkSlug}|${state.selectedPoemSlug}|${state.selectedLabSlug}|${state.selectedSampleIdx}|${state.selectedCityName}|${state.selectedAtlasRegion}`;
    if (!force && deckKey === lastDeckKey) return;
    lastDeckKey = deckKey;

    if (ex.id === 'photo') {
      const works = archive().works || [];
      body.innerHTML = `
        <p class="deck-lead">暖光灯箱已滑出底片匣。可拖拽端详复古相机与胶片灯台，或点击下方任意作品直入全屏暗房高清观片台（支持 1.8× 细节拖拽）。</p>
        <div class="work-grid">
          ${works.map((w) => `
            <button type="button" class="work-card${w.slug === state.selectedWorkSlug ? ' is-active' : ''}" data-open-work="${esc(w.slug)}">
              <img src="${esc(imgSrc(w.cover, 640))}" alt="${esc(w.title)}" loading="lazy" />
              <div class="work-card-meta">
                <span>${esc(w.id)} · ${esc(w.year || '')}</span>
                <strong>${esc(w.title)}</strong>
              </div>
            </button>
          `).join('')}
        </div>
        <div class="deck-actions">
          <button type="button" class="hud-btn hud-btn-primary" id="btn-open-darkroom-now">开启高清暗房看片台 ↗</button>
        </div>
      `;
      body.querySelectorAll('[data-open-work]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.selectedWorkSlug = btn.dataset.openWork;
          openDarkroomViewer(btn.dataset.openWork, 0);
        });
      });
      body.querySelector('#btn-open-darkroom-now')?.addEventListener('click', () => openDarkroomViewer(state.selectedWorkSlug, 0));
      return;
    }

    if (ex.id === 'moyan') {
      const notes = archive().notes || [];
      const cur = notes.find((p) => p.slug === state.selectedPoemSlug) || notes[0];
      const sealed = !!getSealsMap()[cur?.slug];
      const excerpt = (cur?.body?.[0] || '').split('\n').slice(0, 4).join('\n');
      body.innerHTML = `
        <p class="deck-lead">桌面拱页宣纸随所选诗篇实时重绘竖排墨迹。点击「加盖朱砂印」可看桌旁寿山石印章抬起落印。</p>
        <select class="poem-select" id="deck-poem-select" aria-label="切换《墨盐》三十首诗篇">
          ${notes.map((p) => `<option value="${esc(p.slug)}"${p.slug === cur?.slug ? ' selected' : ''}>${esc(p.id)} · ${esc(p.title)}${p.place ? `（${esc(p.place)}）` : ''}</option>`).join('')}
        </select>
        <div class="poem-preview-card">
          <div class="poem-preview-head">
            <strong>${esc(cur?.title || '')}</strong>
            <span>${esc(cur?.date || '')}${cur?.place ? ` · ${esc(cur.place)}` : ''}</span>
          </div>
          <pre class="poem-preview-lines">${esc(excerpt)}</pre>
        </div>
        <div class="deck-actions">
          <button type="button" class="hud-btn hud-btn-primary" id="btn-open-poem-book">展开全本与朱砂眉批 ↗</button>
          <button type="button" class="hud-btn" id="btn-toggle-seal">${sealed ? '已盖「清舟」朱印 ✓' : '抬印加盖朱砂印'}</button>
        </div>
      `;
      body.querySelector('#deck-poem-select')?.addEventListener('change', (e) => {
        state.selectedPoemSlug = e.target.value;
        playWoodTapSound();
        onUpdateBookMoyan?.();
        renderExhibitDeck(true);
      });
      body.querySelector('#btn-open-poem-book')?.addEventListener('click', () => openPoemDossier(state.selectedPoemSlug));
      body.querySelector('#btn-toggle-seal')?.addEventListener('click', () => {
        const next = togglePoemSeal(state.selectedPoemSlug);
        playWoodTapSound();
        onTriggerSealStamp?.();
        setTimeout(() => onUpdateBookMoyan?.(), 260);
        showToast(next ? '寿山石印落纸，已盖「清舟」朱砂印 ✨' : '已轻拭朱砂印记');
        renderExhibitDeck(true);
      });
      return;
    }

    if (ex.id === 'lab') {
      const labs = archive().labs || [];
      const curLab = labs.find((l) => l.slug === state.selectedLabSlug) || labs[0];
      const curSample = HERBARIUM_SAMPLES[state.selectedSampleIdx] || HERBARIUM_SAMPLES[0];
      body.innerHTML = `
        <p class="deck-lead">月下玻璃标本匣已自动掀开 42°。切换标本切片可看对应玻片轻轻浮起，点击下方展开蓝晒原理图与完整实验档案。</p>
        <div class="pill-row">
          ${labs.map((l) => `
            <button type="button" class="chip-btn${l.slug === curLab?.slug ? ' is-active' : ''}" data-lab-slug="${esc(l.slug)}">${esc(l.id)} ${esc(l.title)}</button>
          `).join('')}
        </div>
        <div class="pill-row" style="margin-top:8px;">
          ${HERBARIUM_SAMPLES.map((s, idx) => `
            <button type="button" class="chip-btn${idx === state.selectedSampleIdx ? ' is-active' : ''}" data-sample-idx="${idx}">${esc(s.tag)}</button>
          `).join('')}
        </div>
        <div class="sample-readout">
          <div class="sample-latin">${esc(curSample.latin)}</div>
          <strong>${esc(curSample.tag)}</strong> · <span>${esc(curSample.place)}</span>
          <p>${esc(curSample.note)}</p>
          <div class="sample-verse">「${esc(curSample.verse)}」</div>
        </div>
        <div class="deck-actions">
          <button type="button" class="hud-btn hud-btn-primary" id="btn-open-lab-dossier">展开蓝晒原理图与档案 ↗</button>
        </div>
      `;
      body.querySelectorAll('[data-lab-slug]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.selectedLabSlug = btn.dataset.labSlug;
          playWoodTapSound();
          renderExhibitDeck(true);
        });
      });
      body.querySelectorAll('[data-sample-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.selectedSampleIdx = Number(btn.dataset.sampleIdx);
          playChimeSound();
          renderExhibitDeck(true);
        });
      });
      body.querySelector('#btn-open-lab-dossier')?.addEventListener('click', () => openLabDossier(state.selectedLabSlug));
      return;
    }

    if (ex.id === 'atlas') {
      const regionList = ['all', ...new Set(PLACES_22.map((p) => p.group))];
      const activeRegion = state.selectedAtlasRegion || 'all';
      const city = PLACES_22.find((p) => p.name === state.selectedCityName) || PLACES_22[15];
      const mem = CITY_MEMORIES[city.name] || { hydro: '', desc: '' };
      const shownPlaces = activeRegion === 'all' ? PLACES_22 : PLACES_22.filter((p) => p.group === activeRegion);
      body.innerHTML = `
        <p class="deck-lead">中央八角木座上的宋元青绿山河沙盘支持 <strong>360° 自由拖拽与缩放</strong>。廿二城之间以淡淡金色光流相连，切换大区或点击城标可聚焦查看。</p>
        <div class="region-tabs" role="tablist" aria-label="大区筛选">
          ${regionList.map((r) => `
            <button type="button" class="chip-btn region-tab${r === activeRegion ? ' is-active' : ''}" data-region="${esc(r)}" role="tab" aria-selected="${r === activeRegion}">${r === 'all' ? '全部廿二城' : esc(r)}</button>
          `).join('')}
        </div>
        <div class="city-card">
          <div class="city-head">
            <strong>${esc(city.name)}</strong>
            <span class="city-group">${esc(city.group)}</span>
          </div>
          <div class="city-hydro">${esc(mem.hydro)}</div>
          <p class="city-desc">${esc(mem.desc)}</p>
        </div>
        <div class="city-pills">
          ${shownPlaces.map((p) => `
            <button type="button" class="chip-btn${p.name === city.name ? ' is-active' : ''}" data-city="${esc(p.name)}">${esc(p.name)}</button>
          `).join('')}
        </div>
      `;
      body.querySelectorAll('[data-region]').forEach((btn) => {
        btn.addEventListener('click', () => {
          playWoodTapSound();
          onSelectAtlasRegion?.(btn.dataset.region);
        });
      });
      body.querySelectorAll('[data-city]').forEach((btn) => {
        btn.addEventListener('click', () => {
          playWoodTapSound();
          onSelectCity?.(btn.dataset.city);
        });
      });
      return;
    }

    if (ex.id === 'river') {
      const wishes = getRiverWishes();
      body.innerHTML = `
        <p class="deck-lead">临窗黄铜玻璃景箱里藏着一条永夜不熄的江南水乡。写下一句寄语，一盏新的暖光河灯会立刻顺着玻璃箱里的微缩运河缓缓漂出。</p>
        <form id="river-wish-form" class="wish-form">
          <input type="text" id="river-wish-input" maxlength="96" placeholder="写下一句寄语，放出一盏微缩河灯…" aria-label="河灯寄语" />
          <button type="submit" class="hud-btn hud-btn-primary">放灯 ✨</button>
        </form>
        <div class="wish-list">
          ${wishes.slice(0, 6).map((w) => `
            <div class="wish-item">
              <span class="wish-stamp">${esc(w.stamp || '🏮')}</span>
              <div class="wish-text">
                <p>${esc(w.text)}</p>
                <span>${esc(w.date || '')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      body.querySelector('#river-wish-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = body.querySelector('#river-wish-input');
        if (!inp || !inp.value.trim()) {
          showToast('请先写下一句想放进夜河的话 ✨');
          return;
        }
        addRiverWish(inp.value);
        playWaterSplashSound();
        onSpawnWishLantern?.();
        showToast('一盏新河灯已飘进微缩江南夜河 ✨');
        renderExhibitDeck(true);
      });
    }
  }

  /* ---------- Bind Static Modal Buttons & Darkroom 1.8× Drag-Pan ---------- */
  function bindModalEvents() {
    document.getElementById('dossier-close')?.addEventListener('click', closeDossier);
    document.getElementById('dossier-backdrop')?.addEventListener('click', closeDossier);
    document.getElementById('btn-deck-about')?.addEventListener('click', openAboutDossier);

    document.getElementById('dr-close')?.addEventListener('click', closeDarkroomViewer);
    document.getElementById('dr-prev')?.addEventListener('click', () => stepDarkroomPhoto(-1));
    document.getElementById('dr-next')?.addEventListener('click', () => stepDarkroomPhoto(1));
    document.getElementById('dr-intro-toggle')?.addEventListener('click', () => {
      const drawer = document.getElementById('dr-intro-drawer');
      const btn = document.getElementById('dr-intro-toggle');
      if (!drawer || !btn) return;
      const next = drawer.hidden;
      drawer.hidden = !next;
      btn.setAttribute('aria-expanded', String(next));
    });
    document.getElementById('dr-zoom-btn')?.addEventListener('click', () => {
      state.darkroomZoomed = !state.darkroomZoomed;
      state.darkroomPanX = 0;
      state.darkroomPanY = 0;
      const imgWrap = document.getElementById('dr-img-wrap');
      if (imgWrap) imgWrap.classList.toggle('is-zoomed', state.darkroomZoomed);
      document.getElementById('dr-zoom-btn')?.setAttribute('aria-pressed', String(state.darkroomZoomed));
      applyDarkroomTransform();
    });
    document.getElementById('dr-fly-study-btn')?.addEventListener('click', () => {
      closeDarkroomViewer();
      onFocusExhibit?.('moyan');
    });

    const imgWrap = document.getElementById('dr-img-wrap');
    if (imgWrap) {
      let panning = false, px = 0, py = 0;
      imgWrap.addEventListener('pointerdown', (e) => {
        if (!state.darkroomZoomed) return;
        panning = true;
        px = e.clientX;
        py = e.clientY;
        imgWrap.setPointerCapture?.(e.pointerId);
      });
      imgWrap.addEventListener('pointermove', (e) => {
        if (!panning || !state.darkroomZoomed) return;
        state.darkroomPanX += e.clientX - px;
        state.darkroomPanY += e.clientY - py;
        px = e.clientX;
        py = e.clientY;
        applyDarkroomTransform();
      });
      const endPan = () => { panning = false; };
      imgWrap.addEventListener('pointerup', endPan);
      imgWrap.addEventListener('pointercancel', endPan);
    }

    initSoundDock();
  }

  return {
    showToast,
    openModalFocus,
    closeModalFocus,
    openDarkroomViewer,
    closeDarkroomViewer,
    stepDarkroomPhoto,
    openDossier,
    closeDossier,
    openPoemDossier,
    openLabDossier,
    openAboutDossier,
    renderExhibitDeck,
    bindModalEvents
  };
}
