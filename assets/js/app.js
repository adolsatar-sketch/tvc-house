/* ============================================================
   DAQEEQA / دقيقة — مسكن: الباب يعرف طريقه للحياة
   Presentation controller
   ============================================================ */
(function(){
  "use strict";

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const deckEl        = document.getElementById("deck");
  const progressFill  = document.getElementById("progress-fill");
  const counterCur    = document.getElementById("counter-cur");
  const counterTotal  = document.getElementById("counter-total");
  const chaptersEl    = document.getElementById("chapters");
  const btnPrev       = document.getElementById("nav-prev");
  const btnNext       = document.getElementById("nav-next");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const sweepEl       = document.getElementById("sweep");
  const menuToggle    = document.getElementById("menu-toggle");
  const chapterSheet  = document.getElementById("chapter-sheet");
  const sheetBackdrop = document.getElementById("sheet-backdrop");
  const loadingVeil   = document.getElementById("loading-veil");

  let current = 0;
  const total = SLIDES.length;
  const slideEls = [];

  /* ---------------- helpers ---------------- */
  function esc(str){
    if(str == null) return "";
    return String(str);
  }

  function metaBlock(meta){
    let html = "";
    Object.keys(SCENE_META_LABELS).forEach(function(key){
      if(meta && meta[key]){
        html += '<h4>' + SCENE_META_LABELS[key] + '</h4><p>' + esc(meta[key]) + '</p>';
      }
    });
    return html;
  }

  const chevronSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const downSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  /* ---------------- slide builders per type ---------------- */
  function buildCover(s){
    const el = document.createElement("section");
    el.className = "slide slide-cover";
    el.innerHTML =
      '<div class="cover-frame" style="background-image:url(' + s.image + ')"></div>' +
      '<div class="cover-veil"></div>' +
      '<div class="slide-inner">' +
        '<div class="cover-content">' +
          '<div class="cover-brand">' + esc(s.brand) + '</div>' +
          '<h1 class="cover-title-ar">' + esc(s.titleAr) + '</h1>' +
          '<p class="cover-title-sub">' + esc(s.subtitle) + '</p>' +
          '<div class="cover-line"></div>' +
          '<div class="cover-tag">' + esc(s.tag) + '</div>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildText(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    if(s.sub) inner += '<p class="slide-sub">' + esc(s.sub) + '</p>';
    if(s.body){
      inner += '<div class="body-text">';
      s.body.forEach(function(p){ inner += '<p>' + p + '</p>'; });
      inner += '</div>';
    }
    if(s.twoCol){
      inner += '<div class="two-col">';
      s.twoCol.forEach(function(col){
        inner += '<div class="col-card' + (col.weak ? ' weak' : '') + '"><h3>' + esc(col.heading) + '</h3><ul>';
        col.items.forEach(function(it){ inner += '<li>' + esc(it) + '</li>'; });
        inner += '</ul></div>';
      });
      inner += '</div>';
    }
    inner += '</div>';
    el.innerHTML = inner;
    return el;
  }

  function buildArc(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    inner += '<p class="quote-line">' + esc(s.centralIdea) + '</p>';
    inner += '<div class="arc-row">';
    s.arc.forEach(function(a){
      inner += '<div class="arc-card' + (a.mid ? ' mid' : '') + '"><div class="arc-num">' + esc(a.num) + '</div><h4>' + esc(a.title) + '</h4><p>' + esc(a.desc) + '</p></div>';
    });
    inner += '</div>';
    if(s.note) inner += '<p class="slide-sub" style="margin-top:22px">' + esc(s.note) + '</p>';
    inner += '</div>';
    el.innerHTML = inner;
    return el;
  }

  function buildVisual(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    inner += '<div class="two-col">';
    inner += '<div class="col-card"><h3>الفورمات</h3><ul>';
    s.format.forEach(function(f){ inner += '<li>' + esc(f) + '</li>'; });
    inner += '</ul></div>';
    inner += '<div class="col-card"><h3>اللوكيشن المرجعي</h3><p style="color:var(--ivory-dim);font-size:14.5px;line-height:1.8;margin:0">' + esc(s.location) + '</p></div>';
    inner += '</div>';
    inner += '<div class="palette-row">';
    s.palette.forEach(function(p){
      inner += '<div class="swatch"><i style="background:' + p.hex + '"></i>' + esc(p.name) + '</div>';
    });
    inner += '</div>';
    inner += '<p class="slide-sub" style="margin-top:14px;color:var(--cyan)">' + esc(s.banned) + '</p>';
    inner += '</div>';
    el.innerHTML = inner;
    return el;
  }

  function buildInfo(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    inner += '<div class="info-grid">';
    s.cards.forEach(function(c){
      inner += '<div class="info-card"><h4>' + esc(c.heading) + '</h4><ul>';
      c.lines.forEach(function(l){ inner += '<li>' + esc(l) + '</li>'; });
      inner += '</ul></div>';
    });
    inner += '</div></div>';
    el.innerHTML = inner;
    return el;
  }

  function buildReelCover(s){
    const el = document.createElement("section");
    el.className = "slide slide-reelcover" + (s.variant === 2 ? " reel-cover-2" : "");
    el.innerHTML =
      '<div class="reel-bg" style="background-image:url(' + s.image + ')"></div>' +
      '<div class="reel-veil"></div>' +
      '<div class="slide-inner">' +
        '<div class="reel-content">' +
          '<div class="reel-index">' + esc(s.index) + '</div>' +
          '<h2 class="reel-title">' + esc(s.title) + '</h2>' +
          '<div class="reel-meta"><span>' + esc(s.duration) + '</span><span>' + esc(s.role) + '</span></div>' +
          '<p class="slide-sub" style="margin-top:22px">' + esc(s.rule) + '</p>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildScene(s, globalIndex){
    const el = document.createElement("section");
    el.className = "slide slide-scene";
    const tagClass = s.reel === 2 ? " r2" : "";
    let inner =
      '<div class="scene-frame">' +
        '<div class="scene-media" style="background-image:url(' + s.image + ')"></div>' +
        '<div class="scene-top">' +
          '<div class="scene-heading">' +
            '<div class="scene-reel-tag' + tagClass + '">' + esc(s.reelLabel) + '</div>' +
            '<h3 class="scene-title">' + esc(s.title) + '</h3>' +
          '</div>' +
          '<div class="scene-duration">' + esc(s.duration) + '</div>' +
        '</div>' +
        '<div class="scene-bottom">' +
          '<div class="scene-num">' + esc(s.num) + '</div>';
    if(s.vo){
      inner += '<div class="scene-vo"><span class="lbl">التعليق الصوتي</span>' + esc(s.vo) + '</div>';
    } else {
      inner += '<div class="scene-vo"></div>';
    }
    inner +=
          '<button type="button" class="details-toggle" aria-expanded="false" data-role="toggle-details">' +
            '<span>تفاصيل المشهد</span>' + downSvg +
          '</button>' +
        '</div>' +
        '<div class="details-panel" data-role="panel">' +
          '<button type="button" class="close-panel" data-role="close-details" aria-label="إغلاق">×</button>' +
          metaBlock(s.meta) +
        '</div>' +
      '</div>';
    el.innerHTML = inner;
    return el;
  }

  function buildSound(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    inner += '<div class="info-grid">';
    inner += '<div class="info-card"><h4>الرمز الصوتي الموحّد للباب</h4><ul>';
    s.doorSound.forEach(function(l){ inner += '<li>' + esc(l) + '</li>'; });
    inner += '</ul></div>';
    inner += '<div class="info-card"><h4>الموسيقى</h4><ul>';
    s.music.forEach(function(l){ inner += '<li>' + esc(l) + '</li>'; });
    inner += '</ul></div>';
    inner += '<div class="info-card"><h4>أداء الصوت</h4><ul>';
    s.voice.forEach(function(l){ inner += '<li>' + esc(l) + '</li>'; });
    inner += '</ul></div>';
    inner += '</div>';
    inner += '<h3 style="font-family:var(--font-head);font-size:15px;color:var(--brick-pale);margin:26px 0 10px">الانتقالات الرئيسية</h3>';
    inner += '<div class="col-card" style="max-width:820px"><ul>';
    s.transitions.forEach(function(l){ inner += '<li>' + esc(l) + '</li>'; });
    inner += '</ul></div>';
    inner += '</div>';
    el.innerHTML = inner;
    return el;
  }

  function buildList(s){
    const el = document.createElement("section");
    el.className = "slide slide-text";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="eyebrow">' + esc(s.eyebrow) + '</div>';
    inner += '<h2 class="slide-title">' + esc(s.title) + '</h2>';
    inner += '<div class="list-grid' + (s.cols3 ? ' cols-3' : '') + '">';
    s.groups.forEach(function(g){
      inner += '<div class="info-card"><h4>' + esc(g.heading) + '</h4><ul>';
      g.items.forEach(function(it){ inner += '<li>' + esc(it) + '</li>'; });
      inner += '</ul></div>';
    });
    inner += '</div></div>';
    el.innerHTML = inner;
    return el;
  }

  function buildPricing(s){
    const el = document.createElement("section");
    el.className = "slide slide-pricing";
    el.innerHTML =
      '<div class="tex-bg"></div>' +
      '<div class="pricing-ambient"></div>' +
      '<div class="slide-inner">' +
        '<div class="pricing-content">' +
          '<div class="eyebrow" style="justify-content:center">' + esc(s.eyebrow) + '</div>' +
          '<h2 class="slide-title">' + esc(s.title) + '</h2>' +
          '<div class="price-figure" dir="ltr">' + esc(s.price) + '</div>' +
          '<div class="cover-line"></div>' +
          '<p class="pricing-desc">' + esc(s.desc) + '</p>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildEnd(s){
    const el = document.createElement("section");
    el.className = "slide slide-end";
    let inner = '<div class="tex-bg"></div><div class="slide-inner">';
    inner += '<div class="end-mark">' + esc(s.mark) + '</div>';
    inner += '<h2 class="end-brand">' + esc(s.brand) + '</h2>';
    inner += '<p class="end-sub">' + esc(s.sub) + '</p>';
    inner += '<div class="end-contact">';
    s.contact.forEach(function(c){ inner += '<span>' + esc(c) + '</span>'; });
    inner += '</div></div>';
    el.innerHTML = inner;
    return el;
  }

  function buildSlide(s, i){
    switch(s.type){
      case "cover":     return buildCover(s);
      case "text":      return buildText(s);
      case "arc":       return buildArc(s);
      case "visual":    return buildVisual(s);
      case "info":      return buildInfo(s);
      case "reelcover": return buildReelCover(s);
      case "scene":     return buildScene(s, i);
      case "sound":     return buildSound(s);
      case "list":      return buildList(s);
      case "pricing":   return buildPricing(s);
      case "end":       return buildEnd(s);
      default:          return document.createElement("section");
    }
  }

  /* ---------------- render deck ---------------- */
  SLIDES.forEach(function(s, i){
    const el = buildSlide(s, i);
    el.dataset.index = i;
    el.dataset.chapter = s.chapter;
    deckEl.appendChild(el);
    slideEls.push(el);
  });
  counterTotal.textContent = String(total);

  /* ---------------- chapters ui ---------------- */
  const chapterFirstIndex = {};
  CHAPTERS.forEach(function(ch){
    const idx = SLIDES.findIndex(function(s){ return s.chapter === ch.id; });
    chapterFirstIndex[ch.id] = idx;
  });

  CHAPTERS.forEach(function(ch){
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "chapter-dot";
    dot.textContent = ch.label;
    dot.dataset.chapter = ch.id;
    dot.addEventListener("click", function(){ goTo(chapterFirstIndex[ch.id]); });
    chaptersEl.appendChild(dot);

    const item = document.createElement("button");
    item.type = "button";
    item.className = "chapter-sheet-item";
    item.dataset.chapter = ch.id;
    item.innerHTML = '<span>' + ch.label + '</span>' + downSvg;
    item.addEventListener("click", function(){
      goTo(chapterFirstIndex[ch.id]);
      closeSheet();
    });
    chapterSheet.appendChild(item);
  });

  /* ---------------- image preloading ---------------- */
  const preloaded = {};
  function preload(idx){
    if(idx < 0 || idx >= total) return;
    const s = SLIDES[idx];
    if(!s.image || preloaded[s.image]) return;
    preloaded[s.image] = true;
    const img = new Image();
    img.src = s.image;
  }

  /* ---------------- navigation ---------------- */
  function updateChrome(){
    const pct = total > 1 ? (current / (total - 1)) * 100 : 0;
    progressFill.style.width = pct + "%";
    counterCur.textContent = String(current + 1);

    const activeChapter = SLIDES[current].chapter;
    chaptersEl.querySelectorAll(".chapter-dot").forEach(function(d){
      d.classList.toggle("active", d.dataset.chapter === activeChapter);
    });
    chapterSheet.querySelectorAll(".chapter-sheet-item").forEach(function(d){
      d.classList.toggle("active", d.dataset.chapter === activeChapter);
    });

    btnPrev.disabled = current === 0;
    btnNext.disabled = current === total - 1;

    // scroll active chapter dot into view
    const activeDot = chaptersEl.querySelector(".chapter-dot.active");
    if(activeDot && activeDot.scrollIntoView){
      activeDot.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function closeAllPanels(){
    document.querySelectorAll(".details-panel.open").forEach(function(p){ p.classList.remove("open"); });
    document.querySelectorAll('.details-toggle[aria-expanded="true"]').forEach(function(b){ b.setAttribute("aria-expanded", "false"); });
  }

  function runSweep(){
    if(reduceMotion) return;
    sweepEl.classList.remove("run");
    // force reflow to restart animation
    void sweepEl.offsetWidth;
    sweepEl.classList.add("run");
  }

  function goTo(index, opts){
    opts = opts || {};
    if(index < 0 || index >= total || index === current){
      if(index === current) return;
    }
    index = Math.max(0, Math.min(total - 1, index));
    const prevIndex = current;
    if(index === prevIndex) return;

    closeAllPanels();

    slideEls[prevIndex].classList.remove("active");
    slideEls[prevIndex].classList.add("leaving");
    setTimeout(function(){ slideEls[prevIndex].classList.remove("leaving"); }, 950);

    slideEls[index].classList.add("active");
    current = index;
    updateChrome();
    runSweep();
    preload(index + 1);
    preload(index - 1);

    if(history && history.replaceState){
      history.replaceState(null, "", "#" + (index + 1));
    }
  }

  function next(){ if(current < total - 1) goTo(current + 1); }
  function prev(){ if(current > 0) goTo(current - 1); }

  // Exposed for QA / external control only; not required for normal use.
  window.__presentation = { goTo: goTo, next: next, prev: prev, get current(){ return current; } };

  /* initial slide */
  let startIndex = 0;
  const hashMatch = window.location.hash.match(/^#(\d+)$/);
  if(hashMatch){
    const n = parseInt(hashMatch[1], 10) - 1;
    if(n >= 0 && n < total) startIndex = n;
  }
  current = startIndex;
  slideEls[current].classList.add("active");
  updateChrome();
  preload(0); preload(1);

  /* ---------------- controls ---------------- */
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  window.addEventListener("keydown", function(e){
    if(chapterSheet.classList.contains("open") && e.key === "Escape"){ closeSheet(); return; }
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if(tag === "INPUT" || tag === "TEXTAREA") return;

    switch(e.key){
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        e.preventDefault(); next(); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home":
        e.preventDefault(); goTo(0); break;
      case "End":
        e.preventDefault(); goTo(total - 1); break;
      case "f":
      case "F":
        toggleFullscreen(); break;
      case "Escape":
        closeAllPanels(); break;
    }
  });

  /* touch swipe */
  let touchStartX = null, touchStartY = null;
  deckEl.addEventListener("touchstart", function(e){
    const t = e.changedTouches[0];
    touchStartX = t.clientX; touchStartY = t.clientY;
  }, { passive: true });
  deckEl.addEventListener("touchend", function(e){
    if(touchStartX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if(Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3){
      if(dx < 0) next(); else prev();
    }
    touchStartX = null; touchStartY = null;
  }, { passive: true });

  /* details drawer (event delegation) */
  deckEl.addEventListener("click", function(e){
    const toggleBtn = e.target.closest('[data-role="toggle-details"]');
    if(toggleBtn){
      const panel = toggleBtn.closest(".scene-frame").querySelector('[data-role="panel"]');
      const isOpen = panel.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      return;
    }
    const closeBtn = e.target.closest('[data-role="close-details"]');
    if(closeBtn){
      const panel = closeBtn.closest('[data-role="panel"]');
      panel.classList.remove("open");
      const frame = closeBtn.closest(".scene-frame");
      const t = frame.querySelector('[data-role="toggle-details"]');
      if(t) t.setAttribute("aria-expanded", "false");
    }
  });

  /* fullscreen */
  function toggleFullscreen(){
    const doc = document;
    if(!doc.fullscreenElement){
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el);
    } else {
      (doc.exitFullscreen || doc.webkitExitFullscreen || function(){}).call(doc);
    }
  }
  btnFullscreen.addEventListener("click", toggleFullscreen);

  /* mobile chapter sheet */
  function openSheet(){ chapterSheet.classList.add("open"); sheetBackdrop.classList.add("open"); }
  function closeSheet(){ chapterSheet.classList.remove("open"); sheetBackdrop.classList.remove("open"); }
  if(menuToggle){
    menuToggle.addEventListener("click", openSheet);
    sheetBackdrop.addEventListener("click", closeSheet);
  }

  /* loading veil */
  window.addEventListener("load", function(){
    setTimeout(function(){ loadingVeil.classList.add("hidden"); }, 250);
  });
  // safety fallback in case load event already fired
  if(document.readyState === "complete"){
    setTimeout(function(){ loadingVeil.classList.add("hidden"); }, 250);
  }

})();
