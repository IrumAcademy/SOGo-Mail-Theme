/**
 * SOGo Soft Glass Theme — by IrumAcademy (MIT License)
 * https://github.com/IrumAcademy/SOGo-Mail-Theme
 *
 * 설치 (mailcow): 이 파일을 data/conf/sogo/custom-theme.js 로 복사한 뒤
 *   docker compose restart sogo-mailcow memcached-mailcow
 *
 * - 은은한 그라데이션 배경 위에 반투명 유리 패널 (backdrop-filter)
 * - 포인트 색 하나. 바꾸려면 ACCENT, PALETTE, CSS 토큰의 --ig-accent* 값(라이트·다크), 새 메일 버튼 그라데이션을 함께 수정
 * - 라이트/다크: 시스템 설정을 따르고, 상단 툴바의 해/달 버튼으로 전환 (localStorage.sogo_theme)
 * - 메일 본문은 흰 종이로 유지 (HTML 메일 원래 색 보존)
 * - prefers-reduced-transparency / backdrop-filter 미지원 브라우저는 불투명 패널
 */
(function () {
  'use strict';

  var ACCENT = '#2563eb';
  // Tailwind blue 계열. Angular Material 팔레트(체크박스, 진행 막대, 링크 등)에 쓰인다
  var PALETTE = {
    '50': 'eff6ff', '100': 'dbeafe', '200': 'bfdbfe', '300': '93c5fd', '400': '60a5fa',
    '500': '3b82f6', '600': '2563eb', '700': '1d4ed8', '800': '1e40af', '900': '1e3a8a',
    'A100': 'dbeafe', 'A200': '93c5fd', 'A400': '3b82f6', 'A700': '1d4ed8',
    contrastDefaultColor: 'light',
    contrastDarkColors: ['50', '100', '200', '300', 'A100', 'A200']
  };
  var STORAGE_KEY = 'sogo_theme';
  var STYLE_ID = 'irum-glass-theme';
  var BTN_ID = 'irum-theme-toggle';
  var CMP_ID = 'irum-side-compose';

  angular.module('SOGo.Common').config(configure).run(start);

  configure.$inject = ['$mdThemingProvider'];
  function configure($mdThemingProvider) {
    try {
      $mdThemingProvider.definePalette('irumBlue', PALETTE);
      $mdThemingProvider.theme('default')
        .primaryPalette('irumBlue', { 'default': '600', 'hue-1': '400', 'hue-2': '700', 'hue-3': '100' })
        .accentPalette('irumBlue', { 'default': '600', 'hue-1': '100', 'hue-2': '600', 'hue-3': '800' })
        .backgroundPalette('grey');
      $mdThemingProvider.generateThemesOnDemand(false);
    } catch (e) {}
  }

  function storedMode() {
    try { var v = localStorage.getItem(STORAGE_KEY); if (v === 'dark' || v === 'light') return v; } catch (e) {}
    return null;
  }
  function isDark() {
    var v = storedMode();
    if (v) return v === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function applyMode() {
    var root = document.documentElement;
    root.classList.add('irum-glass');
    root.classList.toggle('irum-dark', isDark());
    var btn = document.getElementById(BTN_ID);
    if (btn) {
      btn.innerHTML = isDark() ? ICON_SUN : ICON_MOON;
      btn.title = isDark() ? '밝은 테마로 전환' : '어두운 테마로 전환';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  var ICON_MOON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var ICON_SUN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // 좁은 화면에서는 상단 툴바가 이미 꽉 차서, 버튼을 넣으면 툴바가 넘치고 페이지가 스크롤된다
  var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 599px)') : null;
  function isNarrow() { return !!(narrowQuery && narrowQuery.matches); }

  // 넓은 화면: 상단 툴바 오른쪽 아이콘 묶음(캘린더·주소록·메일…) 맨 앞.
  // 좁은 화면이거나 툴바가 없으면: 화면 왼쪽 아래에 띄운다 (새 메일 버튼은 오른쪽 아래)
  // 반환값: 자리를 확정했으면 true (툴바를 아직 못 찾았으면 false → 재시도)
  function injectToggle() {
    if (!document.body) return false;
    var narrow = isNarrow();
    var group = narrow ? null : document.querySelector('md-toolbar.toolbar-main .sg-toolbar-group-last');
    var b = document.getElementById(BTN_ID);
    if (b && (b.parentNode === group || (!group && b.parentNode === document.body))) return !!group || narrow;
    if (!b) {
      b = document.createElement('button');
      b.id = BTN_ID;
      b.type = 'button';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.setItem(STORAGE_KEY, isDark() ? 'light' : 'dark'); } catch (err) {}
        applyMode();
      });
    }
    if (group) { group.insertBefore(b, group.firstChild); b.classList.remove('ig-floating'); }
    else { document.body.appendChild(b); b.classList.add('ig-floating'); }
    applyMode();
    return !!group || narrow;
  }

  // 넓은 화면(사이드바가 고정으로 열려 있을 때): 메일 쓰기 / 새 이벤트 / 새 연락처 버튼을
  // 사이드바 맨 위에 둔다. SOGo 의 원래 버튼(목록 아래 둥근 버튼)을 그대로 눌러 주는 대리 버튼이라
  // SOGo 의 동작과 권한 처리는 바뀌지 않는다. 원래 버튼은 CSS 로 넓은 화면에서만 숨긴다.
  function currentFab() {
    return document.querySelector('md-fab-speed-dial.sg-fab-bottom-center, .md-fab.sg-fab-bottom-center');
  }
  function fabActions(fab) {
    if (!fab) return [];
    if (fab.tagName.toLowerCase() !== 'md-fab-speed-dial') return [fab];   // 메일: 새 창 쓰기만 켠 경우 단일 버튼
    return Array.prototype.slice.call(fab.querySelectorAll('md-fab-actions button'));
  }
  function iconOf(el) {
    var i = el && el.querySelector('md-icon');
    return i ? i.textContent.trim() : '';
  }
  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-icons'; s.setAttribute('aria-hidden', 'true'); s.textContent = name;
    return s;
  }
  // 원래 버튼이 지금 눌릴 수 있는지 (권한에 따라 ng-hide / disabled 가 붙는다)
  function usable(btn) {
    return !!btn && !btn.disabled && !btn.closest('.ng-hide');
  }
  function setButton(btn, iconName, text) {
    var i = btn.querySelector('.material-icons');
    if (i && i.textContent !== iconName) i.textContent = iconName;
    var t = btn.querySelector('.ig-label');
    if (t && t.textContent !== text) t.textContent = text;
  }
  // 원래 버튼의 지금 상태(표시 여부·라벨·아이콘)를 대리 버튼에 그대로 옮긴다.
  // 폴더를 바꾸면 원래 버튼이 새로 그려지고 주소록 권한도 나중에 도착하므로, 매번 다시 읽는다
  function syncCompose() {
    var box = document.getElementById(CMP_ID);
    if (!box) return;
    var fab = currentFab();
    var acts = fabActions(fab);
    var mainOk = !!fab && !fab.classList.contains('ng-hide') && usable(acts[0]);
    var altOk = mainOk && usable(acts[1]);
    var main = box.querySelector('.ig-compose-main');
    var alt = box.querySelector('.ig-compose-alt');
    if (mainOk) {
      var trigger = fab.querySelector('md-fab-trigger button') || acts[0];
      setButton(main, iconOf(trigger) || 'add', trigger.getAttribute('aria-label') || '');
    }
    if (altOk) {
      var t = acts[1].getAttribute('aria-label') || '';
      setButton(alt, iconOf(acts[1]), '');
      if (alt.title !== t) { alt.title = t; alt.setAttribute('aria-label', t); }
    }
    alt.hidden = !altOk;
    box.classList.toggle('ig-hidden', !mainOk);
    // 대리 버튼이 실제로 쓸 수 있을 때만 원래 둥근 버튼을 숨긴다
    document.documentElement.classList.toggle('ig-has-side-compose', mainOk);
  }
  // 다이제스트마다 부르는 가벼운 상태 요약: 바뀔 때만 syncCompose 가 돈다
  function composeState() {
    var fab = currentFab();
    if (!fab) return '';
    var acts = fabActions(fab);
    return [fab.classList.contains('ng-hide'), acts.length].concat(acts.map(function (a) {
      return usable(a) + (a.getAttribute('aria-label') || '');
    })).join('|');
  }
  function runAction(index) {
    var a = fabActions(currentFab())[index];
    if (usable(a)) a.click();
    else syncCompose();
  }
  function injectCompose() {
    var side = document.querySelector('md-sidenav.md-sidenav-left');
    var fab = currentFab();
    if (!side || !fab) return false;
    if (!fabActions(fab).length) return false;
    var box = document.getElementById(CMP_ID);
    if (!box || box.parentNode !== side) {
      if (box) box.parentNode.removeChild(box);
      box = document.createElement('div');
      box.id = CMP_ID;
      var main = document.createElement('button');
      main.type = 'button'; main.className = 'ig-compose-main';
      main.appendChild(icon('add'));
      var label = document.createElement('span');
      label.className = 'ig-label';
      main.appendChild(label);
      main.addEventListener('click', function () { runAction(0); });
      box.appendChild(main);
      var alt = document.createElement('button');
      alt.type = 'button'; alt.className = 'ig-compose-alt'; alt.hidden = true;
      alt.appendChild(icon(''));
      alt.addEventListener('click', function () { runAction(1); });
      box.appendChild(alt);
      var head = side.querySelector(':scope > md-toolbar');
      side.insertBefore(box, head ? head.nextSibling : side.firstChild);
    }
    syncCompose();
    return true;
  }

  start.$inject = ['$timeout', '$rootScope'];
  // SOGo 한국어 번역의 메일함 용량 문구 "0.03% : 10240 MB 사용됨" 은 10240MB 를 이미 쓴 것처럼 읽힌다.
  // 영어 원문은 "0.03% used on 10240 MB" (10240MB 중 0.03% 사용). 이 번역 문구일 때만 바꾼다.
  function fixLabels() {
    try {
      if (window.labels && window.labels.quotasFormat === '%{0}% : %{1} MB 사용됨') {
        window.labels.quotasFormat = '%{1} MB 중 %{0}% 사용';
      }
    } catch (e) {}
  }

  function start($timeout, $rootScope) {
    fixLabels();
    injectStyle();
    applyMode();
    // 툴바는 Angular 가 그린 뒤에 생기므로 잠시 재시도
    var pending = null;
    function ensureToggle() {
      if (pending) $timeout.cancel(pending);
      var tries = 0;
      (function retry() {
        pending = null;
        var ok = injectToggle();
        ok = injectCompose() && ok;
        if (!ok && ++tries < 20) pending = $timeout(retry, 300, false);
      })();
    }
    ensureToggle();
    // 메일 폴더·주소록을 바꾸면 툴바가 새로 그려지면서 버튼도 지워지므로 다시 넣는다
    $rootScope.$on('$viewContentLoaded', function () { $timeout(ensureToggle, 0, false); });
    // 주소록처럼 폴더 권한에 따라 원래 버튼이 숨겨지는 경우를 따라간다
    $rootScope.$watch(composeState, function (now, before) { if (now !== before) syncCompose(); });
    // 창 크기가 바뀌어 좁은/넓은 화면이 바뀌면 버튼 자리를 옮긴다
    if (narrowQuery) {
      if (narrowQuery.addEventListener) narrowQuery.addEventListener('change', injectToggle);
      else if (narrowQuery.addListener) narrowQuery.addListener(injectToggle);
    }
    window.addEventListener('storage', function (e) { if (!e.key || e.key === STORAGE_KEY) applyMode(); });
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (!storedMode()) applyMode(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }

  var CSS = [
    /* ---------- 토큰 ---------- */
    'html.irum-glass {',
    '  --ig-accent: ' + ACCENT + ';',
    '  --ig-accent-soft: rgba(37, 99, 235, 0.12);',
    '  --ig-accent-softer: rgba(37, 99, 235, 0.07);',
    '  --ig-accent-ring: rgba(37, 99, 235, 0.45);',
    '  --ig-bg: #eef2f9;',
    '  --ig-bg-grad: radial-gradient(1200px 800px at 0% 0%, rgba(147, 197, 253, 0.45), transparent 60%),',
    '               radial-gradient(1000px 700px at 100% 0%, rgba(196, 181, 253, 0.35), transparent 60%),',
    '               radial-gradient(900px 700px at 50% 100%, rgba(165, 243, 252, 0.30), transparent 60%);',
    '  --ig-glass: rgba(255, 255, 255, 0.58);',
    '  --ig-glass-strong: rgba(255, 255, 255, 0.86);',
    '  --ig-glass-border: rgba(255, 255, 255, 0.75);',
    '  --ig-line: rgba(15, 23, 42, 0.08);',
    '  --ig-hover: rgba(15, 23, 42, 0.05);',
    '  --ig-text: #0f172a;',
    '  --ig-text-2: #475569;',
    '  --ig-text-3: #94a3b8;',
    '  --ig-icon: #334155;',
    '  --ig-star: #f59e0b;',
    '  --ig-star-soft: rgba(245, 158, 11, 0.10);',
    '  --ig-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 32px rgba(15, 23, 42, 0.08);',
    '  --ig-popover: #ffffff;',
    '  --ig-popover-solid: #ffffff;',
    '  --ig-section: #f8fafc;',
    '  --ig-pop-shadow: 0 12px 40px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.06);',
    '  --ig-danger: #dc2626;',
    '  --ig-on-accent: #ffffff;',
    '  --ig-radius: 20px;',
    '  --ig-radius-sm: 12px;',
    '  --ig-blur: blur(24px) saturate(160%);',
    '  --ig-font: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Noto Sans CJK KR", "Malgun Gothic", system-ui, sans-serif;',
    '}',
    'html.irum-glass.irum-dark {',
    '  --ig-accent: #60a5fa;',
    '  --ig-accent-soft: rgba(96, 165, 250, 0.18);',
    '  --ig-accent-softer: rgba(96, 165, 250, 0.10);',
    '  --ig-accent-ring: rgba(96, 165, 250, 0.50);',
    '  --ig-bg: #0b1120;',
    '  --ig-bg-grad: radial-gradient(1200px 800px at 0% 0%, rgba(37, 99, 235, 0.30), transparent 60%),',
    '               radial-gradient(1000px 700px at 100% 0%, rgba(124, 58, 237, 0.22), transparent 60%),',
    '               radial-gradient(900px 700px at 50% 100%, rgba(8, 145, 178, 0.18), transparent 60%);',
    '  --ig-glass: rgba(17, 24, 39, 0.55);',
    '  --ig-glass-strong: rgba(17, 24, 39, 0.92);',
    '  --ig-glass-border: rgba(255, 255, 255, 0.08);',
    '  --ig-line: rgba(255, 255, 255, 0.08);',
    '  --ig-hover: rgba(255, 255, 255, 0.06);',
    '  --ig-text: #e5e7eb;',
    '  --ig-text-2: #a3aec2;',
    '  --ig-text-3: #6b7689;',
    '  --ig-icon: #cbd5e1;',
    '  --ig-star: #fbbf24;',
    '  --ig-star-soft: rgba(251, 191, 36, 0.10);',
    '  --ig-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.35);',
    '  --ig-popover: #131b2d;',
    '  --ig-popover-solid: #131b2d;',
    '  --ig-section: rgba(255, 255, 255, 0.035);',
    '  --ig-pop-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);',
    '  --ig-danger: #f87171;',
    '  --ig-on-accent: #0b1120;',
    '}',

    /* ---------- 바탕 ---------- */
    'html.irum-glass, html.irum-glass body { background: var(--ig-bg) !important; }',
    'html.irum-glass body { background-image: var(--ig-bg-grad) !important; background-attachment: fixed !important; color: var(--ig-text) !important; font-family: var(--ig-font) !important; }',
    'html.irum-glass body, html.irum-glass button, html.irum-glass input, html.irum-glass textarea, html.irum-glass select { font-family: var(--ig-font) !important; }',

    /* 기본으로 흰 배경을 칠하는 컨테이너들은 투명하게 */
    'html.irum-glass main.view, html.irum-glass section.layout-fill, html.irum-glass .view-list,',
    'html.irum-glass md-content, html.irum-glass md-list, html.irum-glass md-virtual-repeat-container,',
    'html.irum-glass .md-subheader, html.irum-glass .md-subheader-inner,',
    'html.irum-glass md-sidenav md-list-item.md-bg, html.irum-glass .md-background.md-hue-1 { background: transparent !important; background-color: transparent !important; }',

    /* 글자색: Angular Material 이 요소마다 검정 계열을 지정하므로 컨테이너 단위로 덮어쓴다 (다크 모드) */
    'html.irum-glass md-content, html.irum-glass md-list-item, html.irum-glass md-toolbar, html.irum-glass md-toolbar .md-toolbar-tools,',
    'html.irum-glass md-sidenav, html.irum-glass md-card, html.irum-glass md-dialog, html.irum-glass .view-list, html.irum-glass .view-detail { color: var(--ig-text) !important; }',
    'html.irum-glass .md-subheader, html.irum-glass .md-subheader .md-subheader-content, html.irum-glass .sg-md-caption { color: var(--ig-text-3) !important; }',
    'html.irum-glass md-sidenav md-content md-list-item p, html.irum-glass md-sidenav md-content md-list-item .md-list-item-text { color: var(--ig-text) !important; }',
    'html.irum-glass md-icon:not(.md-fg):not(.md-warn):not(.md-primary):not(.md-accent):not([style*="color"]) { color: inherit; }',

    /* 휴대폰·좁은 화면에서는 메일 보기 화면이 목록 위에 겹쳐 뜬다.
       바탕과 똑같은 그라데이션(화면 고정)을 깔아 데스크톱에서는 티가 안 나고, 겹칠 때는 뒤를 가린다 */
    'html.irum-glass .view-detail { background-color: var(--ig-bg) !important; background-image: var(--ig-bg-grad) !important; background-attachment: fixed !important; }',

    /* ---------- 유리 패널 ---------- */
    'html.irum-glass md-sidenav.md-sidenav-left,',
    'html.irum-glass .view-list,',
    'html.irum-glass .view-detail md-card,',
    'html.irum-glass [ui-view] > md-card,',
    'html.irum-glass md-card.sg-collapsed, html.irum-glass md-card.sg-expanded {',
    '  background: var(--ig-glass) !important;',
    '  -webkit-backdrop-filter: var(--ig-blur); backdrop-filter: var(--ig-blur);',
    '  border: 1px solid var(--ig-glass-border) !important;',
    '  border-radius: var(--ig-radius) !important;',
    '  box-shadow: var(--ig-shadow) !important;',
    '  overflow: hidden;',
    '}',
    'html.irum-glass .view-list .view-list { background: transparent !important; -webkit-backdrop-filter: none; backdrop-filter: none; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }',
    /* layout-fill 의 min-height: 100% 를 풀지 않으면 위 여백만큼 페이지가 넘쳐 스크롤된다 */
    /* .sg-close: SOGo 가 사이드바를 접을 때(전체 화면 버튼) 음수 margin 으로 자리를 없애므로 그때는 여백을 주지 않는다 */
    'html.irum-glass md-sidenav.md-sidenav-left:not(.sg-close) { margin: 10px 0 10px 10px !important; }',
    'html.irum-glass md-sidenav.md-sidenav-left { height: calc(100% - 20px) !important; min-height: 0 !important; }',
    'html.irum-glass md-sidenav.md-sidenav-left.md-closed:not(.md-locked-open) { margin: 0 !important; }',
    /* .view-list--close: SOGo 가 목록을 접을 때 음수 margin-right 를 쓰므로 그때는 건드리지 않는다 */
    'html.irum-glass .view-list:not(.view-list--close) { margin: 0 6px 10px 10px !important; }',
    /* 좁은 화면에서는 SOGo 가 목록에 min-width: 100% 를 건다. 여백만큼 크기를 줄여야 페이지가 넘치지 않는다 */
    '@media (max-width: 959px) { html.irum-glass .view-list:not(.view-list--close) { margin: 0 8px 8px !important; min-width: 0 !important; max-width: calc(100% - 16px) !important; max-height: calc(100% - 8px) !important; } }',
    'html.irum-glass .view-detail { padding: 0 10px 10px 4px !important; }',
    'html.irum-glass .view-detail md-card { margin: 0 !important; }',
    'html.irum-glass .md-whiteframe-z1, html.irum-glass .md-whiteframe-1dp, html.irum-glass .md-whiteframe-z2 { box-shadow: none !important; }',

    /* ---------- 툴바 ---------- */
    'html.irum-glass md-toolbar, html.irum-glass md-toolbar.md-hue-1, html.irum-glass md-toolbar.md-hue-2, html.irum-glass md-toolbar.md-accent {',
    '  background: transparent !important; background-color: transparent !important; color: var(--ig-text) !important; box-shadow: none !important;',
    '}',
    'html.irum-glass md-toolbar md-icon, html.irum-glass md-toolbar .md-button, html.irum-glass md-toolbar a, html.irum-glass md-toolbar label { color: var(--ig-icon) !important; }',
    'html.irum-glass md-toolbar.toolbar-main { min-height: 56px !important; }',
    'html.irum-glass .sg-date-group, html.irum-glass .sg-date-group * { color: var(--ig-text-2) !important; }',
    'html.irum-glass .view-list > md-toolbar { border-bottom: 1px solid var(--ig-line) !important; }',
    'html.irum-glass .sg-folder-name, html.irum-glass .sg-folder-name * { color: var(--ig-text) !important; font-weight: 700 !important; }',
    'html.irum-glass md-toolbar .md-input, html.irum-glass md-toolbar input { color: var(--ig-text) !important; }',
    'html.irum-glass md-toolbar input::placeholder { color: var(--ig-text-3) !important; }',
    'html.irum-glass md-toolbar md-input-container .md-input { border-color: transparent !important; }',

    /* ---------- 사이드바 (폴더) ---------- */
    'html.irum-glass md-sidenav md-toolbar.md-tall { padding-top: 6px !important; border-bottom: 1px solid var(--ig-line) !important; }',
    'html.irum-glass md-sidenav md-toolbar.md-tall, html.irum-glass md-sidenav md-toolbar.md-tall * { color: var(--ig-text) !important; }',
    'html.irum-glass md-sidenav md-toolbar.md-tall .md-subhead, html.irum-glass md-sidenav md-toolbar .sg-md-caption { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-sidenav sg-avatar-image md-icon { background: var(--ig-accent-soft) !important; color: var(--ig-accent) !important; border-radius: 50%; }',
    'html.irum-glass .sg-account-section > md-list md-list-item { color: var(--ig-text-2) !important; }',
    'html.irum-glass .sg-quota .sg-md-caption { color: var(--ig-text-3) !important; }',
    'html.irum-glass .sg-quota md-progress-linear .md-container { background: var(--ig-line) !important; border-radius: 4px; }',
    'html.irum-glass .sg-quota md-progress-linear .md-bar { background: var(--ig-accent) !important; border-radius: 4px; }',
    'html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item { margin: 1px 10px !important; border-radius: var(--ig-radius-sm) !important; min-height: 40px !important; }',
    'html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item, html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item * { color: var(--ig-text) !important; }',
    'html.irum-glass md-sidenav md-content md-list-item md-icon:not([style*="color"]), html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item md-icon { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item:hover { background: var(--ig-hover) !important; }',
    'html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item.sg-selected { background: var(--ig-accent-soft) !important; }',
    'html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item.sg-selected, html.irum-glass md-sidenav md-list-item.sg-mailbox-list-item.sg-selected * { color: var(--ig-accent) !important; font-weight: 600 !important; }',
    'html.irum-glass md-sidenav md-divider { border-color: var(--ig-line) !important; }',

    /* ---------- 메일 목록 ---------- */
    'html.irum-glass #messagesList .md-subheader-content, html.irum-glass #messagesList .md-subheader-content * { color: var(--ig-text-3) !important; font-size: 12px !important; }',
    'html.irum-glass md-list-item.sg-message-list-item { margin: 2px 8px !important; border-radius: var(--ig-radius-sm) !important; background-color: transparent !important; transition: background-color .12s ease; }',
    'html.irum-glass md-list-item.sg-message-list-item .md-no-style.md-button { background-color: transparent !important; }',
    'html.irum-glass md-list-item.sg-message-list-item:hover { background-color: var(--ig-hover) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item .sg-md-subhead, html.irum-glass md-list-item.sg-message-list-item .sg-md-subhead * { color: var(--ig-text) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item .sg-tile-subject { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item .sg-tile-date, html.irum-glass md-list-item.sg-message-list-item .sg-tile-size { color: var(--ig-text-3) !important; font-weight: 400 !important; }',
    'html.irum-glass md-list-item.sg-message-list-item sg-avatar-image md-icon, html.irum-glass md-list-item.sg-message-list-item .md-avatar-icon { color: var(--ig-text-3) !important; }',
    /* 안 읽음: 굵게 + 왼쪽 점 */
    'html.irum-glass md-list-item.sg-message-list-item.unread .sg-md-subhead span, html.irum-glass md-list-item.sg-message-list-item.unread .sg-tile-subject { color: var(--ig-text) !important; font-weight: 700 !important; }',
    'html.irum-glass md-list-item.sg-message-list-item.unread .sg-tile-date { color: var(--ig-accent) !important; font-weight: 600 !important; }',
    'html.irum-glass md-list-item.sg-message-list-item.unread { background-image: radial-gradient(circle at 9px 50%, var(--ig-accent) 3px, transparent 3.6px) !important; background-repeat: no-repeat !important; }',
    /* 별표 */
    'html.irum-glass md-list-item.sg-message-list-item.sg-star-bg { background-color: var(--ig-star-soft) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item.sg-star-bg .md-secondary-container md-icon, html.irum-glass .sg-star-bg md-icon { color: var(--ig-star) !important; }',
    /* 선택 */
    'html.irum-glass md-list-item.sg-message-list-item.md-bg.md-accent { background-color: var(--ig-accent-soft) !important; box-shadow: inset 0 0 0 1px var(--ig-accent-ring) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item.md-bg.md-accent .sg-md-subhead *, html.irum-glass md-list-item.sg-message-list-item.md-bg.md-accent .sg-tile-subject { color: var(--ig-text) !important; }',
    'html.irum-glass md-list-item.sg-message-list-item.md-bg.md-accent .sg-tile-date, html.irum-glass md-list-item.sg-message-list-item.md-bg.md-accent .sg-tile-size { color: var(--ig-text-2) !important; }',

    /* ---------- 메일 보기 ---------- */
    'html.irum-glass .view-detail md-card md-card-actions { border-bottom: 1px solid var(--ig-line); padding: 4px 8px !important; }',
    'html.irum-glass .view-detail md-card md-card-actions md-icon { color: var(--ig-icon) !important; }',
    'html.irum-glass .view-detail .sg-md-headline { color: var(--ig-text) !important; font-weight: 700 !important; letter-spacing: -0.01em; }',
    'html.irum-glass .view-detail .msg-date, html.irum-glass .view-detail .pseudo-input-container--compact, html.irum-glass .view-detail .pseudo-input-container--compact * { color: var(--ig-text-2) !important; }',
    'html.irum-glass .view-detail md-chip { background: var(--ig-hover) !important; color: var(--ig-text) !important; border-radius: 999px !important; }',
    /* 본문은 흰 종이 (HTML 메일 원래 색 유지) */
    'html.irum-glass .view-detail md-whiteframe, html.irum-glass .view-detail .msg-body {',
    '  background: #ffffff !important; color: #111827; border-radius: 14px !important; box-shadow: none !important;',
    '}',
    'html.irum-glass .view-detail md-whiteframe { margin: 8px 12px 14px !important; border: 1px solid var(--ig-line) !important; overflow: hidden; }',
    'html.irum-glass .view-detail .msg-body { padding: 4px 8px; }',
    'html.irum-glass .view-detail .msg-body a:not([style*="color"]) { color: #1d4ed8; }',
    /* 흰 종이(.msg-body) 안의 카드(첨부, 일정 초대)와 목록(연락처 그룹 구성원)은 종이 색 그대로 */
    'html.irum-glass .view-detail .msg-body md-card { background: #ffffff !important; color: #111827 !important; -webkit-backdrop-filter: none; backdrop-filter: none; border: 1px solid #e5e7eb !important; box-shadow: none !important; margin: 8px !important; border-radius: 12px !important; }',
    'html.irum-glass .view-detail .msg-body md-list-item, html.irum-glass .view-detail .msg-body md-list-item *, html.irum-glass .view-detail .msg-body md-card * { color: #111827 !important; }',

    /* ---------- 새 메일 버튼 (FAB) ---------- */
    'html.irum-glass .md-fab.md-accent, html.irum-glass .md-fab.md-button.md-accent { background: linear-gradient(135deg, #3b82f6, #2563eb) !important; color: #fff !important; border-radius: 18px !important; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35) !important; }',
    'html.irum-glass .md-fab md-icon { color: #fff !important; }',
    'html.irum-glass .md-fab.md-mini { border-radius: 14px !important; background: var(--ig-glass-strong) !important; }',
    'html.irum-glass .md-fab.md-mini md-icon { color: var(--ig-accent) !important; }',

    /* ---------- 대화상자 · 메뉴 · 입력 ---------- */
    'html.irum-glass md-dialog, html.irum-glass md-menu-content, html.irum-glass md-select-menu, html.irum-glass md-select-menu md-content, html.irum-glass .md-open-menu-container {',
    '  background: var(--ig-popover) !important; color: var(--ig-text) !important;',
    '  -webkit-backdrop-filter: none; backdrop-filter: none;',
    '  border-radius: 16px !important; border: 1px solid var(--ig-line); box-shadow: var(--ig-pop-shadow) !important;',
    '}',
    'html.irum-glass md-dialog { border-radius: var(--ig-radius) !important; box-shadow: 0 24px 64px rgba(15, 23, 42, 0.25) !important; }',
    'html.irum-glass md-dialog md-toolbar { border-bottom: 1px solid var(--ig-line); }',
    'html.irum-glass md-dialog md-dialog-content, html.irum-glass md-dialog md-content { background: transparent !important; }',
    'html.irum-glass md-menu-item > .md-button, html.irum-glass md-option { color: var(--ig-text) !important; border-radius: 8px; }',
    'html.irum-glass md-menu-item > .md-button:hover, html.irum-glass md-option:hover { background: var(--ig-hover) !important; }',
    'html.irum-glass md-menu-item md-icon, html.irum-glass md-option md-icon { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-input-container .md-input { color: var(--ig-text) !important; border-color: var(--ig-line) !important; }',
    'html.irum-glass md-input-container.md-input-focused .md-input { border-color: var(--ig-accent) !important; }',
    'html.irum-glass md-input-container label, html.irum-glass md-input-container .md-placeholder { color: var(--ig-text-2) !important; }',
    'html.irum-glass .md-button.md-primary:not(.md-raised):not(.md-fab) { color: var(--ig-accent) !important; }',
    'html.irum-glass .md-button.md-raised.md-primary:not([disabled]), html.irum-glass .md-button.md-raised.md-accent:not([disabled]) { background: var(--ig-accent) !important; color: var(--ig-on-accent) !important; border-radius: 10px !important; box-shadow: none !important; }',
    'html.irum-glass md-chips .md-chips { box-shadow: 0 1px 0 var(--ig-line) !important; }',
    'html.irum-glass md-chip { background: var(--ig-accent-softer) !important; color: var(--ig-text) !important; }',

    /* ---------- 팝오버 · 대화상자 안쪽 ---------- */
    /* 대화상자 제목줄의 큰 배경 아이콘(SOGo 장식)이 버튼과 겹친다 */
    'html.irum-glass md-dialog .sg-icon-toolbar-bg { display: none !important; }',
    /* 일정 편집 등의 구역: 두꺼운 회색 그림자 대신 옅은 바탕과 선 */
    'html.irum-glass md-dialog .sg-form-section { background: var(--ig-section) !important; box-shadow: none !important; border: 1px solid var(--ig-line); border-radius: 14px; margin: 12px 16px !important; }',
    'html.irum-glass md-dialog md-dialog-actions { border-top: 1px solid var(--ig-line); }',
    /* 라디오 · 체크박스 · 슬라이더: SOGo 기본 초록 대신 포인트 색 */
    'html.irum-glass md-radio-button .md-off, html.irum-glass md-checkbox:not(.md-checked) .md-icon { border-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-radio-button.md-checked .md-off { border-color: var(--ig-accent) !important; }',
    'html.irum-glass md-radio-button .md-on { background-color: var(--ig-accent) !important; }',
    'html.irum-glass md-checkbox.md-checked .md-icon { background-color: var(--ig-accent) !important; border-color: transparent !important; }',
    'html.irum-glass md-checkbox.md-checked .md-icon:after { border-color: var(--ig-on-accent) !important; }',
    'html.irum-glass md-checkbox .md-icon { border-radius: 5px !important; }',
    'html.irum-glass md-radio-button .md-ripple, html.irum-glass md-checkbox .md-ripple { color: var(--ig-accent) !important; }',
    /* 비활성 컨트롤: 포인트 색 대신 회색으로, 조작할 수 없어 보이게 */
    'html.irum-glass md-checkbox[disabled], html.irum-glass md-radio-button[disabled], html.irum-glass md-radio-group[disabled] md-radio-button, html.irum-glass md-slider[disabled], html.irum-glass md-switch[disabled] { opacity: 0.55; }',
    'html.irum-glass md-checkbox[disabled].md-checked .md-icon { background-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-radio-button[disabled] .md-on, html.irum-glass md-radio-group[disabled] md-radio-button .md-on { background-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-radio-button[disabled].md-checked .md-off, html.irum-glass md-radio-group[disabled] md-radio-button.md-checked .md-off { border-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-slider[disabled] .md-track-fill, html.irum-glass md-slider[disabled] .md-thumb:after { background-color: var(--ig-text-3) !important; border-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-switch[disabled].md-checked .md-thumb { background-color: var(--ig-text-3) !important; }',
    'html.irum-glass .md-button.md-raised[disabled]:not(.md-fab) { background: var(--ig-hover) !important; color: var(--ig-text-3) !important; box-shadow: none !important; }',
    'html.irum-glass md-slider .md-track { background-color: var(--ig-line) !important; }',
    'html.irum-glass md-slider .md-track-fill, html.irum-glass md-slider .md-thumb:after, html.irum-glass md-slider .md-sign, html.irum-glass md-slider .md-sign:after { background-color: var(--ig-accent) !important; border-color: var(--ig-accent) !important; border-top-color: var(--ig-accent) !important; }',
    'html.irum-glass md-slider.md-min .md-thumb:after { background-color: var(--ig-popover) !important; border-color: var(--ig-text-3) !important; }',
    'html.irum-glass md-slider .md-focus-ring { background-color: var(--ig-accent-soft) !important; }',
    /* 버튼: 회색 돌출 버튼과 주황 경고 글자 */
    'html.irum-glass .md-button.md-raised:not(.md-primary):not(.md-accent):not(.md-warn):not(.md-fab):not([disabled]) { background: var(--ig-accent-soft) !important; color: var(--ig-accent) !important; box-shadow: none !important; border-radius: 10px !important; }',
    'html.irum-glass .md-button.md-warn:not(.md-raised):not(.md-fab) { color: var(--ig-danger) !important; }',
    /* 대화상자 아래 버튼: 일반 버튼은 포인트 색 글자, 키보드 포커스·마우스 올림은 옅은 포인트 바탕 (기본은 회색) */
    'html.irum-glass md-dialog md-dialog-actions .md-button:not(.md-warn):not([disabled]):not(.md-raised) { color: var(--ig-accent) !important; }',
    'html.irum-glass .md-button:not(.md-fab):not(.md-raised):not(.md-icon-button).md-focused, html.irum-glass md-dialog md-dialog-actions .md-button:not(.md-raised):not(.md-fab):hover { background: var(--ig-accent-softer) !important; border-radius: 10px; }',
    'html.irum-glass .md-button.md-raised.md-warn:not([disabled]) { background: var(--ig-danger) !important; color: var(--ig-on-accent) !important; box-shadow: none !important; border-radius: 10px !important; }',
    /* 선택 목록 · 메뉴 */
    'html.irum-glass md-option[selected], html.irum-glass md-option[selected] * { color: var(--ig-accent) !important; }',
    'html.irum-glass md-option[selected] { background: var(--ig-accent-softer) !important; }',
    'html.irum-glass md-select-menu md-content { border: 0 !important; box-shadow: none !important; }',
    'html.irum-glass md-menu-divider { background-color: var(--ig-line) !important; }',
    /* 주소 자동완성 목록 */
    'html.irum-glass .md-autocomplete-suggestions-container, html.irum-glass .md-virtual-repeat-container.md-autocomplete-suggestions-container { background: var(--ig-popover) !important; border: 1px solid var(--ig-line); border-radius: 12px !important; box-shadow: var(--ig-pop-shadow) !important; overflow: hidden; }',
    'html.irum-glass .md-autocomplete-suggestions li { color: var(--ig-text) !important; }',
    'html.irum-glass .md-autocomplete-suggestions li:hover, html.irum-glass .md-autocomplete-suggestions li.selected { background: var(--ig-hover) !important; }',
    /* 날짜 선택 달력 */
    'html.irum-glass .md-datepicker-calendar-pane { background: var(--ig-popover) !important; border: 1px solid var(--ig-line) !important; border-radius: 14px !important; box-shadow: var(--ig-pop-shadow) !important; overflow: hidden; }',
    /* 달력 판은 불투명하게 (뒤의 입력칸 글자가 비치지 않게). 입력칸 둘레 가림막도 같은 색 */
    'html.irum-glass .md-datepicker-calendar, html.irum-glass .sg-timepicker-time, html.irum-glass .sg-timepicker-open .sg-timepicker-input-container, html.irum-glass .md-datepicker-open .md-datepicker-input-container { background: var(--ig-popover-solid) !important; color: var(--ig-text) !important; }',
    'html.irum-glass .md-calendar, html.irum-glass .md-calendar-scroll-container { background: transparent !important; color: var(--ig-text) !important; }',
    'html.irum-glass .md-datepicker-input-mask-opaque, html.irum-glass .sg-timepicker-input-mask-opaque { box-shadow: 0 0 0 9999px var(--ig-popover-solid) !important; }',
    /* 시간 선택 */
    'html.irum-glass .sg-timepicker-time-pane { border: 1px solid var(--ig-line) !important; border-radius: 14px !important; box-shadow: var(--ig-pop-shadow) !important; overflow: hidden; }',
    'html.irum-glass .sg-time-scroll-mask { height: auto !important; max-height: 240px; background: transparent !important; }',
    'html.irum-glass .sg-time-selection-indicator { color: var(--ig-text) !important; }',
    'html.irum-glass .sg-timepicker-input { color: var(--ig-text) !important; }',
    'html.irum-glass .sg-timepicker-input-container, html.irum-glass .md-datepicker-input-container { border-bottom-color: var(--ig-line) !important; }',
    'html.irum-glass .sg-timepicker-focused .sg-timepicker-input-container, html.irum-glass .md-datepicker-focused.md-datepicker-input-container, html.irum-glass .md-datepicker-input-container.md-datepicker-focused { border-bottom-color: var(--ig-accent) !important; }',
    'html.irum-glass .md-calendar td, html.irum-glass .md-calendar tr:last-child td, html.irum-glass .md-calendar-day-header, html.irum-glass .md-calendar-day-header th { border-color: var(--ig-line) !important; box-shadow: none !important; }',
    /* 아래쪽 5분/1분 단위 전환 막대: 회색 바탕 → 선 하나, 버튼 아이콘이 흰 바탕에 흰색이라 안 보이던 것 */
    'html.irum-glass .sg-time-pane > .layout-row.flex, html.irum-glass .sg-time-pane > div:has(> .toggleBtn) { background: transparent !important; border-top: 1px solid var(--ig-line); }',
    'html.irum-glass .sg-time-pane .toggleBtn { background: var(--ig-accent-soft) !important; box-shadow: none !important; border: 0 !important; }',
    'html.irum-glass .sg-time-pane .toggleBtn, html.irum-glass .sg-time-pane .toggleBtn md-icon { color: var(--ig-accent) !important; }',
    'html.irum-glass .sg-time-selection-indicator:hover, html.irum-glass .sg-time-selection-indicator.md-focus { background: var(--ig-hover) !important; }',
    'html.irum-glass .sg-time-selection-indicator.sg-time-selected, html.irum-glass .sg-time-selection-indicator.sg-time-selected:hover, html.irum-glass .sg-time-selection-indicator.md-focus.sg-time-selected { background: var(--ig-accent) !important; color: var(--ig-on-accent) !important; }',
    'html.irum-glass .sg-timepicker-open .sg-timepicker-icon, html.irum-glass .md-datepicker-open .md-datepicker-calendar-icon { color: var(--ig-accent) !important; }',
    'html.irum-glass .md-calendar-day-header { background: transparent !important; color: var(--ig-text-3) !important; border-bottom: 1px solid var(--ig-line); }',
    'html.irum-glass .md-calendar-day-header th { color: var(--ig-text-3) !important; }',
    'html.irum-glass .md-calendar-month-label { color: var(--ig-text-2) !important; font-weight: 600; }',
    'html.irum-glass .md-calendar-date { color: var(--ig-text) !important; }',
    'html.irum-glass .md-calendar-date.md-calendar-date-disabled, html.irum-glass .md-calendar-month-label.md-calendar-month-label-disabled { color: var(--ig-text-3) !important; }',
    'html.irum-glass .md-calendar-date:not(.md-calendar-date-disabled) .md-calendar-date-selection-indicator:hover { background: var(--ig-hover) !important; }',
    'html.irum-glass .md-calendar-date.md-calendar-date-today .md-calendar-date-selection-indicator { border: 1px solid var(--ig-accent) !important; color: var(--ig-accent) !important; }',
    'html.irum-glass .md-calendar-date.md-calendar-selected-date .md-calendar-date-selection-indicator, html.irum-glass .md-calendar-date.md-focus.md-calendar-selected-date .md-calendar-date-selection-indicator { background: var(--ig-accent) !important; color: var(--ig-on-accent) !important; border-color: transparent !important; }',
    'html.irum-glass .md-calendar-date.md-focus .md-calendar-date-selection-indicator { background: var(--ig-accent-soft) !important; }',
    /* 말풍선 · 알림 */
    'html.irum-glass md-tooltip .md-content { background: #1e293b !important; color: #f8fafc !important; border-radius: 8px !important; }',
    'html.irum-glass.irum-dark md-tooltip .md-content { background: #e2e8f0 !important; color: #0f172a !important; }',
    'html.irum-glass md-toast .md-toast-content { background: #1e293b !important; color: #f8fafc !important; border-radius: 12px !important; }',

    /* ---------- 사이드바 맨 위 새로 만들기 버튼 (넓은 화면) ---------- */
    '#' + CMP_ID + ' { display: none; gap: 8px; margin: 12px 12px 6px; flex: 0 0 auto; }',
    '@media (min-width: 1280px) {',
    '  #' + CMP_ID + ':not(.ig-hidden) { display: flex; }',
    '  html.irum-glass.ig-has-side-compose md-fab-speed-dial.sg-fab-bottom-center:not(.sg-sidenav-close),',
    '  html.irum-glass.ig-has-side-compose .md-fab.sg-fab-bottom-center:not(.sg-sidenav-close) { display: none !important; }',
    '}',
    '#' + CMP_ID + ' button { height: 48px; border-radius: 14px; cursor: pointer; display: inline-flex; align-items: center; font-family: var(--ig-font); }',
    '#' + CMP_ID + ' .ig-compose-main { flex: 1 1 auto; min-width: 0; gap: 10px; padding: 0 18px; border: 0; color: #fff; font-size: 14px; font-weight: 600;',
    '  background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 6px 18px rgba(37, 99, 235, 0.28); }',
    '#' + CMP_ID + ' .ig-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '#' + CMP_ID + ' button[hidden] { display: none !important; }',
    '#' + CMP_ID + ' .ig-compose-main:hover { filter: brightness(1.07); }',
    '#' + CMP_ID + ' .ig-compose-alt { flex: 0 0 48px; width: 48px; justify-content: center; padding: 0; border: 1px solid var(--ig-line); background: var(--ig-glass-strong); color: var(--ig-accent); }',
    '#' + CMP_ID + ' .ig-compose-alt:hover { background: var(--ig-accent-soft); }',
    '#' + CMP_ID + ' .material-icons { font-size: 20px; }',
    '#' + CMP_ID + ' button:focus-visible { outline: 2px solid var(--ig-accent); outline-offset: 2px; }',
    '@media print { #' + CMP_ID + ' { display: none !important; } }',

    /* ---------- 메일 쓰기 ---------- */
    'html.irum-glass md-backdrop.md-dialog-backdrop { background-color: rgba(15, 23, 42, 0.18) !important; opacity: 1 !important; -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }',
    'html.irum-glass.irum-dark md-backdrop.md-dialog-backdrop { background-color: rgba(0, 0, 0, 0.45) !important; }',
    /* 보내는 사람 선택 칸 (원래는 진한 테마 색) */
    'html.irum-glass md-dialog.sg-mail-editor md-toolbar md-autocomplete, html.irum-glass md-dialog.sg-mail-editor md-toolbar md-autocomplete.md-bg { background: var(--ig-hover) !important; border-radius: 10px !important; }',
    'html.irum-glass md-autocomplete md-autocomplete-wrap { background: transparent !important; box-shadow: none !important; }',
    'html.irum-glass md-autocomplete input, html.irum-glass md-chips input, html.irum-glass md-autocomplete input:not(.md-input) { color: var(--ig-text) !important; background: transparent !important; }',
    'html.irum-glass input::placeholder, html.irum-glass textarea::placeholder { color: var(--ig-text-3) !important; opacity: 1; }',
    'html.irum-glass .pseudo-input-label, html.irum-glass md-dialog label { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-dialog.sg-mail-editor .pseudo-input-container { border-color: var(--ig-line) !important; }',
    'html.irum-glass md-dialog md-icon, html.irum-glass md-dialog .sg-icon-button { color: var(--ig-icon) !important; }',
    'html.irum-glass .md-chips { box-shadow: 0 1px 0 var(--ig-line) !important; }',
    /* CKEditor 5: 편집 영역은 흰 종이, 둥근 모서리 */
    'html.irum-glass .ck.ck-editor { margin: 4px 12px 8px; border-radius: 12px; overflow: hidden; border: 1px solid var(--ig-line); }',
    'html.irum-glass .ck.ck-editor__top .ck-sticky-panel__content, html.irum-glass .ck.ck-toolbar { border: 0 !important; border-bottom: 1px solid #e5e7eb !important; background: #f8fafc !important; }',
    'html.irum-glass .ck.ck-editor__main > .ck-editor__editable, html.irum-glass .ck.ck-editor__main > .ck-editor__editable.ck-focused { border: 0 !important; box-shadow: none !important; background: #ffffff !important; color: #111827; }',
    'html.irum-glass .ck.ck-button:hover:not(.ck-disabled), html.irum-glass .ck.ck-button.ck-on { background: rgba(37, 99, 235, 0.10) !important; }',
    'html.irum-glass .ck.ck-button.ck-on { color: #1d4ed8 !important; }',
    'html.irum-glass.irum-dark .ck.ck-editor { border-color: transparent; }',

    /* ---------- 캘린더 · 주소록 공통 ---------- */
    'html.irum-glass .sg-calendar-tile, html.irum-glass .calendarView { background: transparent !important; }',
    'html.irum-glass .sg-calendar-day-header, html.irum-glass .sg-calendar-day-header *, html.irum-glass .daysHeader, html.irum-glass .daysHeader * { color: var(--ig-text-2) !important; }',
    'html.irum-glass .sg-today .day, html.irum-glass .sg-today .sg-day-number { color: var(--ig-accent) !important; font-weight: 700 !important; }',
    'html.irum-glass md-list-item .md-list-item-text h3, html.irum-glass md-list-item .sg-tile-content .sg-md-subhead { color: var(--ig-text) !important; }',
    'html.irum-glass md-list-item .md-list-item-text p, html.irum-glass md-list-item .sg-tile-content .sg-md-body { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-list-item.md-bg.md-accent, html.irum-glass md-list-item.sg-selected:not(.sg-mailbox-list-item) { background: var(--ig-accent-soft) !important; }',

    /* ---------- 목록 공통 (사이드바 계정 줄 등) ---------- */
    'html.irum-glass md-list-item .md-no-style.md-button, html.irum-glass md-list-item .md-no-style.md-button:focus { background-color: transparent !important; }',
    /* 키보드 포커스 (Angular Material 은 .md-proxy-focus.md-focused 의 배경으로 표시한다) */
    'html.irum-glass md-list-item.md-proxy-focus.md-focused .md-no-style, html.irum-glass md-list-item.md-proxy-focus.md-focused { background-color: var(--ig-accent-soft) !important; box-shadow: inset 0 0 0 2px var(--ig-accent-ring) !important; }',
    'html.irum-glass .sg-account-section > md-list md-list-item:hover { background-color: var(--ig-hover) !important; border-radius: var(--ig-radius-sm); }',

    /* ---------- 탭 ---------- */
    'html.irum-glass md-tabs, html.irum-glass md-tabs-wrapper, html.irum-glass md-tabs-content-wrapper, html.irum-glass md-tab-content { background: transparent !important; }',
    'html.irum-glass md-tabs-wrapper { border-bottom: 1px solid var(--ig-line) !important; }',
    'html.irum-glass md-tabs md-ink-bar { background: var(--ig-accent) !important; color: var(--ig-accent) !important; height: 3px; border-radius: 3px 3px 0 0; }',
    'html.irum-glass md-tabs .md-tab { color: var(--ig-text-2) !important; }',
    'html.irum-glass md-tabs .md-tab.md-active { color: var(--ig-accent) !important; font-weight: 600; }',

    /* ---------- 캘린더 격자 ---------- */
    'html.irum-glass md-sidenav md-toolbar.sg-toolbar-multiple { border-top: 1px solid var(--ig-line) !important; }',
    'html.irum-glass md-sidenav md-toolbar.sg-toolbar-multiple .md-toolbar-tools[ng-hide="app.sortableMode"] { background-color: transparent !important; color: var(--ig-text) !important; }',
    'html.irum-glass .calendarView, html.irum-glass .calendarView .days, html.irum-glass .daysView { background: transparent !important; }',
    'html.irum-glass .calendarView .hours .hour { color: var(--ig-text-3) !important; font-size: 11px !important; }',
    'html.irum-glass .calendarView .clickableHourCell, html.irum-glass .calendarView .day, html.irum-glass .daysView .day { border-color: var(--ig-line) !important; }',
    /* SOGo 는 시간 칸의 아래 테두리를 베이지색으로 칠한다 */
    'html.irum-glass [ui-view="calendars"] .days .day .clickableHourCell, html.irum-glass [ui-view="calendars"] .hours .hour { border-bottom-color: var(--ig-line) !important; }',
    'html.irum-glass [ui-view="calendars"] .minutes30 { border-bottom: 1px dashed var(--ig-line) !important; opacity: .7; }',
    'html.irum-glass [ui-view="calendars"] .days .day .clickableHourCell.outOfDay { background-color: rgba(100, 116, 139, 0.045) !important; }',
    'html.irum-glass .sg-now-line, html.irum-glass .calendarView .sg-now-line { border-color: #ef4444 !important; }',
    'html.irum-glass .daysView .sg-calendar-day, html.irum-glass .daysView .sg-day { color: var(--ig-text) !important; }',
    'html.irum-glass .daysView .dayOfToday .sg-calendar-day, html.irum-glass .daysView .dayOfToday .sg-day { color: var(--ig-accent) !important; }',
    'html.irum-glass [ui-view="calendars"] .daysView, html.irum-glass [ui-view="calendars"] .daysView .day, html.irum-glass [ui-view="calendars"] .days .day { border-color: var(--ig-line) !important; }',
    'html.irum-glass [ui-view="calendars"] .allDaysView, html.irum-glass [ui-view="calendars"] .allDaysView--sidenav { border-bottom-color: var(--ig-line) !important; }',
    'html.irum-glass .md-datepicker-input, html.irum-glass input.md-input, html.irum-glass md-select .md-select-value { color: var(--ig-text) !important; }',
    'html.irum-glass .md-datepicker-input-container { border-color: var(--ig-line) !important; }',
    /* 일정 목록: SOGo 의 날짜 칸은 72px 라 "14 토요일"처럼 긴 요일이 일정 카드 아래로 넘친다.
       한국어 요일까지 들어가는 고정 폭으로 넓혀서, 언어와 요일에 상관없이 카드가 일렬로 정렬되게 한다 */
    'html.irum-glass .sg-calendar-date { width: 104px !important; min-width: 104px !important; max-width: none !important; flex: 0 0 104px !important; padding-right: 8px; box-sizing: border-box; overflow: hidden; }',
    'html.irum-glass .sg-calendar-date .sg-calendar-day { color: var(--ig-accent) !important; }',
    'html.irum-glass .sg-calendar-date .md-caption { color: var(--ig-text-2) !important; }',
    'html.irum-glass .sg-event { border-radius: 8px !important; }',
    'html.irum-glass md-switch.md-checked .md-bar { background-color: var(--ig-accent-soft) !important; }',
    'html.irum-glass md-switch.md-checked .md-thumb { background-color: var(--ig-accent) !important; }',

    /* ---------- 진행 표시 ---------- */
    'html.irum-glass md-progress-linear .md-container { background-color: var(--ig-accent-soft) !important; }',
    'html.irum-glass md-progress-linear .md-bar { background-color: var(--ig-accent) !important; }',
    'html.irum-glass md-progress-circular path { stroke: var(--ig-accent) !important; }',

    /* ---------- 스크롤바 ---------- */
    'html.irum-glass ::-webkit-scrollbar { width: 10px; height: 10px; }',
    'html.irum-glass ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.35); border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }',
    'html.irum-glass ::-webkit-scrollbar-track { background: transparent; }',

    /* ---------- 다크 모드 보정 ---------- */
    'html.irum-glass.irum-dark .view-detail md-whiteframe { border-color: transparent !important; }',
    'html.irum-glass.irum-dark md-dialog { box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55) !important; }',

    /* ---------- 테마 전환 버튼 ---------- */
    '#' + BTN_ID + ' { width: 40px; height: 40px; margin: 0 4px; padding: 0; border: 0; border-radius: 50%; background: transparent;',
    '  color: var(--ig-icon); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }',
    '#' + BTN_ID + ':hover { background: var(--ig-hover); color: var(--ig-accent); }',
    '#' + BTN_ID + ':focus-visible { outline: 2px solid var(--ig-accent); outline-offset: 2px; }',
    '#' + BTN_ID + '.ig-floating { position: fixed; left: 16px; bottom: 16px; margin: 0; z-index: 58; border: 1px solid var(--ig-glass-border);',
    '  background: var(--ig-glass-strong); -webkit-backdrop-filter: var(--ig-blur); backdrop-filter: var(--ig-blur); box-shadow: var(--ig-shadow); }',
    '@media print { #' + BTN_ID + ' { display: none !important; } }',

    /* ---------- 인쇄: 배경·유리 효과 없이 흰 종이 ---------- */
    '@media print {',
    '  html.irum-glass, html.irum-glass body, html.irum-glass .view-detail { background: #ffffff !important; background-image: none !important; color: #000 !important; }',
    '  html.irum-glass md-sidenav.md-sidenav-left, html.irum-glass .view-list, html.irum-glass .view-detail md-card, html.irum-glass [ui-view] > md-card {',
    '    background: #ffffff !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; box-shadow: none !important; border: 0 !important; }',
    '}',

    /* ---------- 투명 효과 대체 ---------- */
    '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {',
    '  html.irum-glass { --ig-glass: rgba(255, 255, 255, 0.95); }',
    '  html.irum-glass.irum-dark { --ig-glass: rgba(17, 24, 39, 0.96); }',
    '}',
    '@media (prefers-reduced-transparency: reduce) {',
    '  html.irum-glass { --ig-glass: #ffffff; --ig-glass-strong: #ffffff; --ig-blur: none; }',
    '  html.irum-glass.irum-dark { --ig-glass: #111827; --ig-glass-strong: #111827; }',
    '}'
  ].join('\n');
})();
