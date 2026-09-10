import {context} from 'tap-pack-sdk/context';
if (window.top === window) {
  window.__tapInspector?.dispose();
  const observations = context(window);
  const removeBridge = observations.provide(() => {
    const bridge = window.TapBridge;
    const status = bridge?.status?.();
    const state = status?.state || (bridge?.isReady() ? 'ready' : bridge ? 'unknown' : 'absent');
    const labels = {ready:'Подключена', connecting:'Подключается', retrying:'Восстанавливается',
      paused:'Отключена в этой вкладке', suspended:'Вкладка приостановлена', unavailable:'Не удалось подключиться',
      unknown:'Не подключена · обновите страницу для управления', absent:'Мост не загружен'};
    const names = {connect:'Подключить',disconnect:'Отключить в этой вкладке',reconnect:'Повторить подключение'};
    return [{id:'bridge',label:'Связь с локальным TAP', value:labels[state] || 'Состояние неизвестно',
      kind:'connection',state,
      actions:(status?.actions || []).filter(id => names[id] && typeof bridge[id] === 'function')
        .map(id => ({id,label:names[id],run:()=>bridge[id]()})),
    }];
  });
  const host = document.createElement('div');
  host.dataset.tapInspector = '';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host{position:fixed!important;bottom:16px!important;left:16px!important;z-index:2147483646!important;font:13px/1.45 system-ui!important;color:#e9ecef!important;color-scheme:dark}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}
    .lamp{border:1px solid #58616b;background:#20262d;border-radius:50%;width:34px;height:34px;box-shadow:0 2px 8px #0004;display:flex;align-items:center;justify-content:center;gap:3px}
    .dot{width:6px;height:6px;border-radius:50%;border:1px solid #9aa4ae}.ready{background:#77d8ac;border-color:#77d8ac}
    section{position:absolute;bottom:44px;left:0;width:min(320px,calc(100vw - 32px));max-height:65vh;overflow:auto;border:1px solid #505a65;border-radius:14px;background:#20262d;box-shadow:0 8px 32px #0005;padding:16px}
    [hidden]{display:none}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}header button{border:0;background:none;font-size:20px}small{color:#adb6bf}ul{list-style:none;padding:0;margin:12px 0}li{padding:9px 0;border-top:1px solid #ffffff18;display:flex;justify-content:space-between;gap:14px}li>div>span{color:#adb6bf;text-align:right}li{display:block}li>div{display:flex;justify-content:space-between;gap:12px}li button{display:block;margin-top:12px;border:1px solid #63717e;background:#303b45;border-radius:7px;padding:7px 10px}footer{color:#adb6bf;font-size:11px}button:focus-visible{outline:2px solid #77d8ac;outline-offset:3px}
  </style><section id="panel" role="region" aria-label="TAP: контекст страницы" hidden><header><strong>TAP</strong><button aria-label="Закрыть">×</button></header><small></small><ul></ul><footer>Управление связью этой вкладки. Кнопки сайта и захват трафика продолжают работать.</footer></section><button class="lamp" aria-label="TAP: открыть контекст страницы" aria-expanded="false" aria-controls="panel">T<span class="dot"></span></button>`;
  const panel = root.querySelector('section'), lamp = root.querySelector('.lamp');
  root.querySelector('small').textContent = location.hostname;
  let previous = '';
  function refresh() {
    const facts = observations.snapshot();
    root.querySelector('.dot').classList.toggle('ready', facts.some(x => x.kind === 'connection' && x.state === 'ready'));
    const signature = JSON.stringify(facts);
    if (signature === previous) return;
    previous = signature;
    const list = root.querySelector('ul'); list.replaceChildren();
    for (const fact of facts) {
      if (typeof fact.label !== 'string' || typeof fact.value !== 'string') continue;
      const row = document.createElement('li');
      const details = document.createElement('div');
      for (const text of [fact.label, fact.value]) { const span = document.createElement('span'); span.textContent = text; details.append(span); }
      row.append(details);
      for (const action of fact.actions || []) {
        if (typeof action.label !== 'string' || typeof action.run !== 'function') continue;
        const button = document.createElement('button'); button.textContent = action.label;
        button.onclick = async () => {
          const current = observations.snapshot().find(x=>x.id === fact.id)?.actions?.find(x=>x.id === action.id);
          if (!current) {refresh();return;}
          try { await current.run(); refresh(); }
          catch { button.textContent = 'Не удалось выполнить'; }
        };
        row.append(button);
      }
      list.append(row);
    }
  }
  function open(value) { panel.hidden = !value; lamp.setAttribute('aria-expanded', String(value)); if(value) {refresh();root.querySelector('header button').focus();} }
  lamp.onclick = () => open(panel.hidden);
  root.querySelector('header button').onclick = () => {open(false);lamp.focus();};
  const outside = e => { if (!e.composedPath().includes(host)) open(false); };
  const keyboard = e => {if(e.key === 'Escape' && !panel.hidden) {open(false);lamp.focus();}};
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', keyboard);
  document.documentElement.append(host);
  refresh(); const timer = setInterval(refresh, 1000);
  window.__tapInspector = {dispose() {clearInterval(timer);removeBridge();host.remove();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keyboard);}};
}
