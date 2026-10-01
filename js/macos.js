/* ═══════════════════════════════════════════════════════════
   macos.js — bilgi kaynağım · macOS Studio Modu
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var MAC_KEY      = 'bk_macMode';
  var MAC_BETA_KEY = 'bk_macBetaSeen';

  /* ── SVG ikonlar (inline, özel tasarım) ── */
  function _svg(content, bg) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
      '<rect width="80" height="80" rx="18" fill="' + bg + '"/>' +
      content + '</svg>'
    );
  }

  var ICONS = {
    bilge:    _svg('<circle cx="40" cy="30" r="14" fill="none" stroke="#A5B4FC" stroke-width="2.5"/><circle cx="40" cy="30" r="6" fill="#A5B4FC"/><rect x="28" y="48" width="24" height="3.5" rx="1.75" fill="#A5B4FC" opacity=".7"/><rect x="32" y="56" width="16" height="3" rx="1.5" fill="#A5B4FC" opacity=".4"/><circle cx="55" cy="24" r="4" fill="#FFD60A" opacity=".9"/>', '#1e2060'),
    feed:     _svg('<rect x="16" y="16" width="48" height="6" rx="3" fill="white" opacity=".95"/><rect x="16" y="28" width="48" height="4" rx="2" fill="white" opacity=".7"/><rect x="16" y="38" width="36" height="4" rx="2" fill="white" opacity=".7"/><rect x="16" y="48" width="48" height="4" rx="2" fill="white" opacity=".7"/><rect x="16" y="58" width="24" height="4" rx="2" fill="white" opacity=".4"/>', '#e8500a'),
    tasks:    _svg('<rect x="18" y="18" width="44" height="44" rx="6" fill="white" opacity=".12"/><circle cx="28" cy="32" r="5" fill="none" stroke="white" stroke-width="2"/><rect x="37" y="30" width="18" height="3.5" rx="1.75" fill="white" opacity=".9"/><circle cx="28" cy="46" r="5" fill="white"/><polyline points="25,46 27.5,48.5 32,43" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round"/><rect x="37" y="44" width="12" height="3" rx="1.5" fill="white" opacity=".7"/>', '#1a8c39'),
    homework: _svg('<rect x="20" y="14" width="40" height="52" rx="5" fill="white" opacity=".15"/><rect x="20" y="14" width="40" height="52" rx="5" fill="none" stroke="white" stroke-width="1.5" opacity=".4"/><rect x="27" y="24" width="26" height="3" rx="1.5" fill="white" opacity=".8"/><rect x="27" y="32" width="20" height="3" rx="1.5" fill="white" opacity=".6"/><rect x="27" y="40" width="26" height="3" rx="1.5" fill="white" opacity=".6"/><rect x="27" y="48" width="14" height="3" rx="1.5" fill="white" opacity=".4"/><circle cx="56" cy="58" r="8" fill="#FF6B9D"/><text x="56" y="62" text-anchor="middle" font-size="12" font-weight="700" fill="white" font-family="sans-serif">!</text>', '#c0175a'),
    goals:    _svg('<circle cx="40" cy="40" r="22" fill="none" stroke="white" stroke-width="1.5" opacity=".25"/><circle cx="40" cy="40" r="15" fill="none" stroke="white" stroke-width="1.5" opacity=".5"/><circle cx="40" cy="40" r="8" fill="none" stroke="white" stroke-width="2" opacity=".85"/><circle cx="40" cy="40" r="3.5" fill="white"/><line x1="40" y1="18" x2="40" y2="22" stroke="white" stroke-width="2" opacity=".4"/><line x1="40" y1="58" x2="40" y2="62" stroke="white" stroke-width="2" opacity=".4"/><line x1="18" y1="40" x2="22" y2="40" stroke="white" stroke-width="2" opacity=".4"/><line x1="58" y1="40" x2="62" y2="40" stroke="white" stroke-width="2" opacity=".4"/>', '#8b2fc9'),
    nets:     _svg('<rect x="16" y="52" width="11" height="18" rx="2.5" fill="white" opacity=".5"/><rect x="31" y="38" width="11" height="32" rx="2.5" fill="white" opacity=".7"/><rect x="46" y="26" width="11" height="44" rx="2.5" fill="white"/><polyline points="16,46 36,32 46,40 62,20" fill="none" stroke="#FFD60A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="20" r="3.5" fill="#FFD60A"/>', '#3f35b8'),
    calendar: _svg('<rect x="14" y="22" width="52" height="46" rx="7" fill="white" opacity=".15"/><rect x="14" y="22" width="52" height="46" rx="7" fill="none" stroke="white" stroke-width="1.5" opacity=".35"/><rect x="14" y="22" width="52" height="16" rx="7" fill="white" opacity=".2"/><rect x="14" y="30" width="52" height="8" rx="0" fill="white" opacity=".1"/><text x="40" y="36" text-anchor="middle" font-size="8.5" font-weight="700" fill="white" font-family="-apple-system,sans-serif" opacity=".9">HAZ</text><text x="40" y="60" text-anchor="middle" font-size="24" font-weight="200" fill="white" font-family="-apple-system,sans-serif">2</text>', '#c0251c'),
    progress: _svg('<polyline points="14,58 28,40 40,46 54,26 66,32" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/><polyline points="14,58 28,40 40,46 54,26 66,32" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 0"/><circle cx="28" cy="40" r="3.5" fill="white" opacity=".6"/><circle cx="40" cy="46" r="3.5" fill="white" opacity=".6"/><circle cx="54" cy="26" r="3.5" fill="white" opacity=".6"/><circle cx="66" cy="32" r="4.5" fill="#34C759"/>', '#006b5c'),
    study:    _svg('<circle cx="40" cy="38" r="18" fill="none" stroke="white" stroke-width="2" opacity=".3"/><circle cx="40" cy="38" r="18" fill="none" stroke="white" stroke-width="2" opacity=".3" stroke-dasharray="8 4"/><line x1="40" y1="38" x2="40" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="38" x2="50" y2="44" stroke="white" stroke-width="2" stroke-linecap="round" opacity=".7"/><circle cx="40" cy="38" r="3" fill="white"/><rect x="30" y="58" width="20" height="4" rx="2" fill="white" opacity=".5"/>', '#b35000'),
    packages: _svg('<polygon points="40,12 62,24 62,56 40,68 18,56 18,24" fill="none" stroke="white" stroke-width="2" opacity=".3"/><polygon points="40,12 62,24 40,36 18,24" fill="white" opacity=".12"/><polygon points="40,36 62,24 62,56 40,68" fill="white" opacity=".08"/><line x1="40" y1="36" x2="40" y2="68" stroke="white" stroke-width="1.5" opacity=".3"/><line x1="40" y1="12" x2="40" y2="36" stroke="white" stroke-width="1.5" opacity=".3"/><circle cx="40" cy="38" r="8" fill="#FFD60A" opacity=".95"/><text x="40" y="43" text-anchor="middle" font-size="11" font-weight="700" fill="#7a5a00" font-family="sans-serif">⚡</text>', '#8a6f00'),
    settings: _svg('<circle cx="40" cy="40" r="14" fill="none" stroke="white" stroke-width="2.5"/><circle cx="40" cy="40" r="5" fill="white"/><rect x="37.5" y="14" width="5" height="10" rx="2.5" fill="white" opacity=".7"/><rect x="37.5" y="56" width="5" height="10" rx="2.5" fill="white" opacity=".7"/><rect x="14" y="37.5" width="10" height="5" rx="2.5" fill="white" opacity=".7"/><rect x="56" y="37.5" width="10" height="5" rx="2.5" fill="white" opacity=".7"/><rect x="22" y="20" width="5" height="10" rx="2.5" fill="white" opacity=".5" transform="rotate(45 24.5 25)"/><rect x="53" y="50" width="5" height="10" rx="2.5" fill="white" opacity=".5" transform="rotate(45 55.5 55)"/><rect x="20" y="53" width="5" height="10" rx="2.5" fill="white" opacity=".5" transform="rotate(-45 22.5 58)"/><rect x="55" y="17" width="5" height="10" rx="2.5" fill="white" opacity=".5" transform="rotate(-45 57.5 22)"/>', '#636366'),
  };

  var MAC_APPS = [
    { id: 'bilge',    label: 'Bilge',      page: 'bilge'    },
    { id: 'feed',     label: 'Not Akışı',  page: 'feed'     },
    { id: 'tasks',    label: 'Görevler',   page: 'tasks'    },
    { id: 'homework', label: 'Ödevler',    page: 'homework' },
    { id: 'goals',    label: 'Hedefler',   page: 'goals'    },
    { id: 'nets',     label: 'Netlerim',   page: 'nets'     },
    { id: 'calendar', label: 'Takvim',     page: 'calendar' },
    { id: 'progress', label: 'Gelişim',    page: 'progress' },
    { id: 'study',    label: 'Çalış',      page: 'study'    },
    { id: 'packages', label: 'Paketler',   page: 'packages' },
    { id: 'settings', label: 'Ayarlar',    page: null       },
  ];

  var openWindows = {};
  var zTop = 100;
  var clockTimer = null;

  /* ════ GİRİŞ / ÇIKIŞ ════ */
  function enterMacMode() {
    if (document.getElementById('macDesktop')) return;
    DS.set(MAC_KEY, true);
    if (!DS.get(MAC_BETA_KEY)) {
      DS.set(MAC_BETA_KEY, true);
      _showBetaPopup(function () { _buildDesktop(); });
    } else {
      _buildDesktop();
    }
  }

  function exitMacMode() {
    DS.set(MAC_KEY, false);
    var desk = document.getElementById('macDesktop');
    if (desk) {
      desk.style.opacity = '0';
      desk.style.transform = 'scale(1.04)';
      setTimeout(function () { desk.remove(); }, 420);
    }
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    openWindows = {};
    _setThemeCard('classic');
    if (typeof showToast === 'function') showToast('Klasik görünüme döndün');
  }

  /* ════ BETA POPUP ════ */
  function _showBetaPopup(onClose) {
    var pop = document.createElement('div');
    pop.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(12px);opacity:0;transition:opacity .35s';
    pop.innerHTML =
      '<div style="background:rgba(28,30,42,.96);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:40px 44px;max-width:420px;width:90%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.7);color:#fff;transform:scale(.94);transition:transform .35s cubic-bezier(.22,1,.36,1)">' +
      '<div style="font-size:56px;margin-bottom:14px">🖥️</div>' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:3px;color:#FFD60A;margin-bottom:12px;text-transform:uppercase">Beta Sürümü</div>' +
      '<h2 style="font-size:23px;font-weight:800;margin-bottom:14px;font-family:-apple-system,sans-serif;letter-spacing:-.3px">macOS Studio</h2>' +
      '<p style="font-size:14px;line-height:1.75;color:rgba(255,255,255,.65);margin-bottom:28px">Bu görünüm beta aşamasındadır.<br>Bazı özellikler geliştirme sürecindedir.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button id="macBetaCancel" style="padding:12px 24px;border-radius:11px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.15);cursor:pointer;transition:background .15s">Geri Dön</button>' +
      '<button id="macBetaOk" style="padding:12px 28px;border-radius:11px;background:linear-gradient(135deg,#0A84FF,#0055D4);color:#fff;font-size:14px;font-weight:700;cursor:pointer;border:none;box-shadow:0 4px 20px rgba(10,132,255,.4);transition:transform .15s">Harika, Dene! →</button>' +
      '</div></div>';
    document.body.appendChild(pop);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      pop.style.opacity = '1';
      pop.querySelector('div').style.transform = 'scale(1)';
    }); });
    pop.querySelector('#macBetaOk').addEventListener('click', function () {
      pop.style.opacity = '0';
      setTimeout(function () { pop.remove(); onClose(); }, 350);
    });
    pop.querySelector('#macBetaCancel').addEventListener('click', function () {
      DS.set(MAC_KEY, false); DS.set(MAC_BETA_KEY, false);
      pop.style.opacity = '0';
      setTimeout(function () { pop.remove(); _setThemeCard('classic'); }, 300);
    });
  }

  /* ════ MASAÜSTÜ ════ */
  function _buildDesktop() {
    var desk = document.createElement('div');
    desk.id = 'macDesktop';
    desk.style.cssText = [
      'position:fixed;inset:0;z-index:9000;overflow:hidden;',
      'background:linear-gradient(160deg,#0d0d2b 0%,#1a0533 20%,#3d0c1e 40%,#7a1515 60%,#c44022 80%,#e8834a 100%);',
      'opacity:0;transform:scale(.97);',
      'transition:opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1);',
      'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;',
    ].join('');
    desk.innerHTML = _menuBarHTML() + _dockHTML() +
      '<div id="macWindowLayer" style="position:absolute;inset:0;top:28px;bottom:88px;pointer-events:none;overflow:hidden"></div>';
    document.body.appendChild(desk);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      desk.style.opacity = '1'; desk.style.transform = 'scale(1)';
    }); });
    _initMenuBar(); _initDock(); _startClock();
  }

  /* ════ MENÜ ÇUBUĞU ════ */
  function _menuBarHTML() {
    return '<div id="macMenuBar" style="' +
      'position:absolute;top:0;left:0;right:0;height:28px;' +
      'background:rgba(0,0,0,.35);' +
      'backdrop-filter:blur(24px) saturate(200%);' +
      '-webkit-backdrop-filter:blur(24px) saturate(200%);' +
      'border-bottom:1px solid rgba(255,255,255,.07);' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:0 16px;color:rgba(255,255,255,.92);font-size:13px;font-weight:500;' +
      'z-index:9100;user-select:none;">' +
      '<div style="display:flex;align-items:center;gap:20px">' +
        '<span style="font-size:16px;opacity:.9;cursor:default"> </span>' +
        '<span style="font-weight:700;font-size:13px;letter-spacing:-.1px" id="macActiveApp">Finder</span>' +
        '<span style="opacity:.55;cursor:pointer;font-size:12px;transition:opacity .15s" id="macExitBtn" onmouseover="this.style.opacity=\'.9\'" onmouseout="this.style.opacity=\'.55\'">← Klasiğe Dön</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:16px;opacity:.85;font-size:12px">' +
        '<span id="macBattery"></span>' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2" stroke-linecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="rgba(255,255,255,.8)"/></svg>' +
        '<span id="macClock" style="font-weight:600;letter-spacing:-.2px"></span>' +
      '</div>' +
    '</div>';
  }

  function _initMenuBar() {
    var exit = document.getElementById('macExitBtn');
    if (exit) exit.addEventListener('click', function (e) { e.stopPropagation(); exitMacMode(); });
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        var el = document.getElementById('macBattery');
        if (el) el.textContent = Math.round(b.level * 100) + '%';
      });
    }
  }

  function _startClock() {
    function tick() {
      var el = document.getElementById('macClock'); if (!el) return;
      var n = new Date();
      var D = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][n.getDay()];
      var M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][n.getMonth()];
      var h = n.getHours(), m = n.getMinutes();
      el.textContent = D + ' ' + M + ' ' + n.getDate() + '  ' + h + ':' + (m<10?'0':'')+m;
    }
    tick(); clockTimer = setInterval(tick, 10000);
  }

  /* ════ DOCK ════ */
  function _dockHTML() {
    var css = [
      '<style>',
      '#macDock{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:9050;}',
      '#macDockInner{',
        'display:flex;align-items:flex-end;padding:10px 16px 8px;gap:4px;',
        'background:rgba(255,255,255,.16);',
        'backdrop-filter:blur(28px) saturate(180%);',
        '-webkit-backdrop-filter:blur(28px) saturate(180%);',
        'border:1px solid rgba(255,255,255,.28);',
        'border-radius:22px;',
        'box-shadow:0 8px 40px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.22);',
        'transition:gap .18s cubic-bezier(.22,1,.36,1);',
      '}',
      /* Her ikon: label üstte, img ortada, dot altta */
      '.mdi{position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;padding:0 2px;gap:0;}',
      '.mdi-img{',
        'height:54px;width:54px;object-fit:contain;',
        'border-radius:13px;',
        'transition:transform .22s cubic-bezier(.34,1.4,.64,1),filter .22s;',
        'transform-origin:bottom center;',
        'filter:drop-shadow(0 3px 8px rgba(0,0,0,.35));',
        'will-change:transform;display:block;',
      '}',
      /* Label: ikonun tam üstünde, her zaman görünür — küçük + hafif */
      '.mdi-lbl{',
        'font-size:10px;font-weight:500;color:rgba(255,255,255,.7);',
        'white-space:nowrap;pointer-events:none;',
        'margin-bottom:4px;letter-spacing:.1px;',
        'text-shadow:0 1px 3px rgba(0,0,0,.6);',
      '}',
      /* Hover'da label belirginleşir */
      '.mdi:hover .mdi-lbl{color:rgba(255,255,255,1);font-weight:600;}',
      /* Hover tooltip (büyük) — hala üstte göster */
      '.mdi-tip{',
        'position:absolute;bottom:calc(100% + 6px);left:50%;',
        'transform:translateX(-50%);',
        'background:rgba(16,16,24,.92);color:rgba(255,255,255,.95);',
        'font-size:12px;font-weight:600;',
        'padding:5px 12px;border-radius:8px;white-space:nowrap;pointer-events:none;',
        'opacity:0;transition:opacity .12s;',
        'border:1px solid rgba(255,255,255,.12);',
        'backdrop-filter:blur(10px);z-index:9999;',
      '}',
      '.mdi:hover .mdi-tip{opacity:1;}',
      '.mdi-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.8);margin-top:3px;opacity:0;transition:opacity .3s;flex-shrink:0;}',
      '.mdi-dot.on{opacity:1;}',
      '</style>'
    ].join('');

    var items = MAC_APPS.map(function (app) {
      return '<div class="mdi" data-app="' + app.id + '">' +
        '<div class="mdi-tip">' + app.label + '</div>' +
        '<div class="mdi-lbl">' + app.label + '</div>' +
        '<img class="mdi-img" src="' + ICONS[app.id] + '" alt="' + app.label + '" draggable="false">' +
        '<div class="mdi-dot"></div>' +
      '</div>';
    }).join('');

    return css + '<div id="macDock"><div id="macDockInner">' + items + '</div></div>';
  }

  function _initDock() {
    var inner = document.getElementById('macDockInner');
    var items = Array.from(document.querySelectorAll('.mdi'));
    var imgs  = items.map(function (it) { return it.querySelector('.mdi-img'); });

    /* Referans animasyon — komşu büyüme */
    function applyHover(idx) {
      if (inner) inner.style.gap = '7px';
      imgs.forEach(function (img, i) {
        var d = Math.abs(i - idx);
        if      (d === 0) img.style.transform = 'scale(1.55) translateY(-14px)';
        else if (d === 1) img.style.transform = 'scale(1.25) translateY(-7px)';
        else if (d === 2) img.style.transform = 'scale(1.08) translateY(-3px)';
        else              img.style.transform = 'scale(1) translateY(0)';
      });
    }
    function resetHover() {
      if (inner) inner.style.gap = '0';
      imgs.forEach(function (img) { img.style.transform = 'scale(1) translateY(0)'; });
    }

    items.forEach(function (item, idx) {
      item.addEventListener('mouseover', function (e) {
        if (e.currentTarget === item) applyHover(idx);
      });
      item.addEventListener('mouseleave', resetHover);
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        _bounceIcon(item, idx, imgs, inner);
        var app = MAC_APPS.find(function (a) { return a.id === item.dataset.app; });
        if (app) _openApp(app);
      });
    });
  }

  function _bounceIcon(item, idx, imgs, inner) {
    var img = imgs[idx];
    if (!img || !img.animate) return;
    img.animate([
      { transform: 'scale(1.55) translateY(-14px)' },
      { transform: 'scale(1) translateY(0)' },
      { transform: 'scale(1.3) translateY(-9px)' },
      { transform: 'scale(1) translateY(0)' },
    ], { duration: 500, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    var dot = item.querySelector('.mdi-dot');
    if (dot) dot.classList.add('on');
  }

  /* ════ PENCERE ════ */
  function _openApp(app) {
    if (openWindows[app.id]) {
      var w = openWindows[app.id];
      if (w.style.display === 'none') {
        w.style.display = 'flex';
        w.style.opacity = '0'; w.style.transform = 'scale(.9) translateY(16px)';
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          w.style.opacity = '1'; w.style.transform = 'scale(1) translateY(0)';
        }); });
      }
      w.style.zIndex = ++zTop;
      w.animate && w.animate([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:180,easing:'ease-in-out'});
      return;
    }
    var layer = document.getElementById('macWindowLayer'); if (!layer) return;
    var W = Math.min(window.innerWidth - 100, 860);
    var H = Math.min(window.innerHeight - 160, 580);
    /* Her yeni pencere bir öncekinden 28px sağa+aşağı kayar */
    var cascade = Object.keys(openWindows).length;
    var baseX = Math.round((window.innerWidth - W) / 2);
    var baseY = Math.round((window.innerHeight - H - 90) / 2);
    var X = Math.max(20, Math.min(baseX + cascade * 28, window.innerWidth - W - 20));
    var Y = Math.max(0,  Math.min(baseY + cascade * 28, window.innerHeight - H - 100));

    var win = document.createElement('div');
    win.dataset.appId = app.id;
    win.style.cssText = [
      'position:absolute;',
      'left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;',
      'background:rgba(242,244,248,.92);',
      'backdrop-filter:blur(28px) saturate(180%);',
      '-webkit-backdrop-filter:blur(28px) saturate(180%);',
      'border:1px solid rgba(255,255,255,.55);',
      'border-radius:13px;',
      'box-shadow:0 28px 70px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.6);',
      'display:flex;flex-direction:column;overflow:hidden;',
      'z-index:'+(++zTop)+';pointer-events:auto;',
      'opacity:0;transform:scale(.88) translateY(22px);',
      'transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1),box-shadow .2s;',
    ].join('');

    /* Title bar */
    var tb = document.createElement('div');
    tb.style.cssText = [
      'height:42px;min-height:42px;flex-shrink:0;',
      'background:rgba(230,233,238,.85);',
      'border-bottom:1px solid rgba(0,0,0,.09);',
      'display:flex;align-items:center;padding:0 14px;gap:8px;',
      'cursor:grab;user-select:none;border-radius:13px 13px 0 0;',
    ].join('');

    var closeB = _tl('#ff5f57'); var minB = _tl('#ffbd2e'); var maxB = _tl('#28c840');
    var title = document.createElement('span');
    title.style.cssText = 'flex:1;text-align:center;font-size:13px;font-weight:600;color:#1a1d23;margin-right:60px;pointer-events:none;letter-spacing:-.15px;';
    title.textContent = app.label;
    tb.append(closeB, minB, maxB, title);

    /* Content */
    var ct = document.createElement('div');
    ct.style.cssText = 'flex:1;overflow:auto;background:#f0f2f6;position:relative;';
    _loadAppContent(app, ct);

    win.append(tb, ct);
    layer.appendChild(win);
    openWindows[app.id] = win;

    requestAnimationFrame(function () { requestAnimationFrame(function () {
      win.style.opacity = '1'; win.style.transform = 'scale(1) translateY(0)';
    }); });

    var activeEl = document.getElementById('macActiveApp');
    if (activeEl) activeEl.textContent = app.label;

    /* Butonlar */
    closeB.addEventListener('click', function (e) { e.stopPropagation(); _closeWin(app.id); });
    minB.addEventListener('click',   function (e) { e.stopPropagation(); _minWin(win); });
    maxB.addEventListener('click',   function (e) { e.stopPropagation(); _maxWin(win, W, H, X, Y); });

    _makeDraggable(win, tb);
    _makeResizable(win);
    win.addEventListener('mousedown', function () {
      win.style.zIndex = ++zTop;
      var a = MAC_APPS.find(function (x) { return x.id === win.dataset.appId; });
      var el = document.getElementById('macActiveApp');
      if (el && a) el.textContent = a.label;
    });
  }

  function _tl(color) {
    var b = document.createElement('button');
    b.style.cssText = 'width:13px;height:13px;border-radius:50%;background:'+color+';border:none;cursor:pointer;flex-shrink:0;transition:filter .15s;';
    b.addEventListener('mouseenter', function () { b.style.filter = 'brightness(.78)'; });
    b.addEventListener('mouseleave', function () { b.style.filter = ''; });
    return b;
  }

  function _closeWin(id) {
    var win = openWindows[id]; if (!win) return;
    win.style.opacity = '0'; win.style.transform = 'scale(.88) translateY(16px)';
    setTimeout(function () {
      win.remove(); delete openWindows[id];
      var dot = document.querySelector('.mdi[data-app="'+id+'"] .mdi-dot');
      if (dot) dot.classList.remove('on');
    }, 300);
  }

  function _minWin(win) {
    win.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1),opacity .35s';
    win.style.transform = 'scale(.4) translateY(200%)'; win.style.opacity = '0';
    setTimeout(function () { win.style.display = 'none'; }, 360);
  }

  function _maxWin(win, oW, oH, oX, oY) {
    if (win._max) {
      Object.assign(win.style, { left:oX+'px', top:oY+'px', width:oW+'px', height:oH+'px' });
      win._max = false;
    } else {
      Object.assign(win.style, { left:'0', top:'0', width:'100%', height:'100%' });
      win._max = true;
    }
  }

  /* ════ UYGULAMA İÇERİĞİ ════ */
  function _loadAppContent(app, ct) {
    if (app.id === 'settings') {
      ct.style.background = '#f0f2f6';
      ct.innerHTML = '<div style="padding:28px;max-width:520px;margin:0 auto"><h2 style="font-size:20px;font-weight:700;margin-bottom:20px;color:#1a1d23">⚙️ Ayarlar</h2>' +
        '<div style="background:white;border-radius:14px;border:1px solid rgba(0,0,0,.08);overflow:hidden">' +
        '<div style="padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.06);display:flex;justify-content:space-between;align-items:center">' +
        '<div><div style="font-weight:600;font-size:14px;color:#1a1d23">macOS Studio\'dan Çık</div>' +
        '<div style="font-size:12px;color:#888;margin-top:3px">Klasik görünüme dön</div></div>' +
        '<button id="macSettingsExit" style="padding:9px 20px;background:#FF3B30;color:#fff;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:opacity .15s">Çık</button>' +
        '</div></div></div>';
      setTimeout(function () {
        var b = ct.querySelector('#macSettingsExit');
        if (b) b.addEventListener('click', exitMacMode);
      }, 50);
      return;
    }
    if (app.id === 'bilge') {
      ct.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;background:#f0f2f6;';
      ct.innerHTML = '<div style="text-align:center;padding:40px">' +
        '<img src="' + ICONS.bilge + '" style="width:72px;height:72px;border-radius:16px;margin-bottom:16px;filter:drop-shadow(0 4px 16px rgba(0,0,0,.2))">' +
        '<h3 style="font-weight:700;margin-bottom:10px;color:#1a1d23;font-size:18px">Bilge AI</h3>' +
        '<p style="font-size:14px;color:#666;margin-bottom:22px;line-height:1.6">Tam Bilge deneyimi için ana görünüme dön.</p>' +
        '<button id="macGoBilge" style="padding:11px 28px;background:#007AFF;color:#fff;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;border:none;box-shadow:0 4px 16px rgba(0,122,255,.35)">Ana Sayfaya Geç →</button>' +
        '</div>';
      setTimeout(function () {
        var b = ct.querySelector('#macGoBilge');
        if (b) b.addEventListener('click', function () {
          exitMacMode();
          setTimeout(function () { if (typeof navigateTo === 'function') navigateTo('bilge'); }, 500);
        });
      }, 50);
      return;
    }
    /* Diğer sayfalar */
    if (window._pageRenders && window._pageRenders[app.page]) {
      try { window._pageRenders[app.page](); } catch (e) {}
    }
    var src = document.getElementById('page-' + app.page);
    if (src) {
      ct.style.background = '#f0f2f6';
      var clone = src.cloneNode(true);
      clone.style.display = 'block'; clone.style.padding = '20px';
      clone.querySelectorAll('script').forEach(function (s) { s.remove(); });
      ct.appendChild(clone);
    } else {
      ct.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:14px;color:#888">' +
        '<img src="' + (ICONS[app.id]||ICONS.settings) + '" style="width:64px;height:64px;border-radius:14px;opacity:.7">' +
        '<div style="font-weight:600;font-size:16px;color:#444">' + app.label + '</div>' +
        '<div style="font-size:13px">Yükleniyor...</div></div>';
    }
  }

  /* ════ SÜRÜKLEME ════ */
  function _makeDraggable(win, handle) {
    var drag = false, sx, sy, ox, oy;
    var vx = 0, lx, lt;
    var raf = null;
    var curSkew = 0; /* anlık skew değeri */

    function _applyWobble(skew) {
      curSkew = skew;
      win.style.transform = 'perspective(1200px) skewX(' + skew.toFixed(3) + 'deg)';
    }

    function _settle() {
      if (raf) cancelAnimationFrame(raf);
      var skew = curSkew;
      var vel  = 0;
      /* Çok soft: düşük stiffness, yüksek damping → tek-iki salınım, hızlı söner */
      var k = 0.055;  /* yay sertliği — düşük = soft */
      var d = 0.82;   /* sönümleme — yüksek = hızlı durur */

      function step() {
        vel  += -k * skew - d * vel;
        skew += vel;
        if (Math.abs(skew) < 0.005 && Math.abs(vel) < 0.005) {
          win.style.transform = 'perspective(1200px) skewX(0deg)';
          raf = null;
          return;
        }
        _applyWobble(skew);
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    handle.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      drag = true;
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      vx = 0; lx = e.clientX; lt = Date.now();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      handle.style.cursor = 'grabbing';
      win.style.transition = 'box-shadow .15s';
      win.style.boxShadow = '0 44px 90px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.22)';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!drag) return;
      var nx = Math.max(0, Math.min(ox + e.clientX - sx, window.innerWidth  - win.offsetWidth));
      var ny = Math.max(0, Math.min(oy + e.clientY - sy, window.innerHeight - win.offsetHeight - 50));
      win.style.left = nx + 'px';
      win.style.top  = ny + 'px';

      var now = Date.now(), dt = Math.max(now - lt, 1);
      vx = (e.clientX - lx) / dt;
      lx = e.clientX; lt = now;

      /* Hıza göre hedef skew — max ±3.5deg, çarpan küçük = soft */
      var target = Math.max(-3.5, Math.min(3.5, vx * 7));
      /* Mevcut skew'den hedefe doğru kademeli kayma (lerp) */
      var lerped = curSkew + (target - curSkew) * 0.18;
      _applyWobble(lerped);
    });

    document.addEventListener('mouseup', function () {
      if (!drag) return;
      drag = false;
      handle.style.cursor = 'grab';
      win.style.transition = 'box-shadow .3s';
      win.style.boxShadow = '0 28px 70px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.6)';
      if (Math.abs(curSkew) > 0.05) _settle();
      else win.style.transform = 'perspective(1200px) skewX(0deg)';
    });
  }

  /* ════ YENİDEN BOYUTLANDIRMA ════ */
  function _makeResizable(win) {
    var h = document.createElement('div');
    h.style.cssText = 'position:absolute;bottom:0;right:0;width:16px;height:16px;cursor:se-resize;z-index:10;';
    h.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" style="position:absolute;bottom:4px;right:4px;opacity:.25"><path d="M9 1L1 9M9 4L4 9M9 7L7 9" stroke="#000" stroke-width="1.3" stroke-linecap="round"/></svg>';
    win.appendChild(h);
    var res = false, sx, sy, sw, sh;
    h.addEventListener('mousedown', function (e) { res=true; sx=e.clientX; sy=e.clientY; sw=win.offsetWidth; sh=win.offsetHeight; e.preventDefault(); e.stopPropagation(); });
    document.addEventListener('mousemove', function (e) {
      if (!res) return;
      win.style.width  = Math.max(420, sw + e.clientX - sx) + 'px';
      win.style.height = Math.max(300, sh + e.clientY - sy) + 'px';
    });
    document.addEventListener('mouseup', function () { res = false; });
  }

  /* ════ YARDIMCILAR ════ */
  function _setThemeCard(theme) {
    if (typeof DS !== 'undefined') DS.set('viewTheme', theme);
    document.querySelectorAll('[data-viewtheme]').forEach(function (c) {
      var act = c.dataset.viewtheme === theme;
      c.style.border = '2px solid ' + (act ? 'var(--acc)' : 'var(--border)');
      c.style.background = act ? 'var(--acc-l)' : '';
    });
  }

  /* ════ DIŞA AKTAR ════ */
  window.MacStudio = { enter: enterMacMode, exit: exitMacMode };

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof DS !== 'undefined' && DS.get(MAC_KEY)) {
      setTimeout(enterMacMode, 700);
    }
  });

})();