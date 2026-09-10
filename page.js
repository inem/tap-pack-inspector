import {context} from 'tap-pack-sdk/context';

if (window.top === window) {
  window.__tapInspector?.dispose();

  const observations = context(window);
  const host = document.createElement('div');
  host.dataset.tapInspector = '';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host{position:fixed!important;bottom:0!important;left:0!important;z-index:2147483646!important;font:13px/1.45 system-ui,-apple-system,sans-serif!important;color:#eef1f3!important;color-scheme:dark}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}
    .lamp{border:0;background:transparent;width:20px;height:20px;padding:6px;display:flex;align-items:center;justify-content:center}
    .dot,.status-dot{width:6px;height:6px;border-radius:50%;border:1px solid #9aa4ae;flex:none}.lamp .dot{width:8px;height:8px}.active{background:#77d8ac;border-color:#77d8ac}.lamp .active{box-shadow:0 0 6px #77d8acaa}.warning{background:#e5b567;border-color:#e5b567}.lamp .warning{box-shadow:0 0 6px #e5b567aa}
    section{position:absolute;bottom:24px;left:8px;width:min(320px,calc(100vw - 24px));max-height:65vh;overflow:auto;border:1px solid #505a65;border-radius:14px;background:#20262d;box-shadow:0 8px 32px #0005;padding:16px}
    [hidden]{display:none}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}header button{border:0;background:none;font-size:20px;padding:4px}small{color:#adb6bf}
    .status{display:flex;gap:9px;align-items:center;margin:18px 0 14px;padding:13px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff08}
    h2{font-size:11px;line-height:1.3;text-transform:uppercase;letter-spacing:.08em;color:#8f9aa5;margin:17px 0 5px}
    ul{list-style:none;padding:0;margin:0}li{padding:9px 0;border-top:1px solid #ffffff14;display:flex;justify-content:space-between;gap:12px}li span:last-child{color:#adb6bf;text-align:right}
    a{color:inherit;text-decoration:none}a:hover{text-decoration:underline;text-underline-offset:3px}
    button:focus-visible{outline:2px solid #77d8ac;outline-offset:3px}
  </style>
  <section id="panel" role="region" aria-label="TAP page context" hidden>
    <header><strong>TAP</strong><button aria-label="Close">×</button></header>
    <small class="hostname"></small>
    <div class="status"><span class="status-dot"></span><strong></strong></div>
    <div class="packs" hidden><h2>Packs</h2><ul></ul></div>
    <div class="facts" hidden><h2>Features</h2><ul></ul></div>
  </section>
  <button class="lamp" aria-label="Open TAP page context" aria-expanded="false" aria-controls="panel"><span class="dot"></span></button>`;

  const panel = root.querySelector('section');
  const lamp = root.querySelector('.lamp');
  root.querySelector('.hostname').textContent = location.hostname;
  let previous = '';

  function runtimeSnapshot() {
    const bridge = window.TapBridge;
    const status = bridge?.status?.() || {};
    const plan = status.plan_state || (bridge ? 'current' : 'absent');
    const active = Boolean(bridge) && plan !== 'revoked';
    const updating = plan === 'checking' || plan === 'reloading';
    return {
      active,
      warning: Boolean(bridge) && plan === 'unavailable',
      title: !bridge ? 'Unavailable' : plan === 'revoked' ? 'Inactive' : updating ? 'Updating' : 'Active',
      packs: Array.isArray(status.packs) ? status.packs.filter(pack => pack
        && typeof pack.id === 'string' && typeof pack.version === 'string').map(pack => ({
          ...pack,
          features:Array.isArray(pack.features) ? pack.features.filter(feature => feature
            && typeof feature.id === 'string' && typeof feature.label === 'string'
            && typeof feature.value === 'string') : [],
        })) : [],
    };
  }

  function repository(packId) {
    const slug = packId.replace(/^tap\./, '').replaceAll('.', '-');
    return `https://github.com/inem/tap-pack-${slug}`;
  }

  function addRows(list, facts) {
    list.replaceChildren();
    for (const fact of facts) {
      if (typeof fact.label !== 'string' || typeof fact.value !== 'string') continue;
      const row = document.createElement('li');
      for (const [index, text] of [fact.label, fact.value].entries()) {
        const element = index === 0 && typeof fact.href === 'string'
          ? document.createElement('a') : document.createElement('span');
        element.textContent = text;
        if (element instanceof HTMLAnchorElement) {
          element.href = fact.href;
          element.target = '_blank';
          element.rel = 'noopener noreferrer';
        }
        row.append(element);
      }
      list.append(row);
    }
  }

  function refresh() {
    const runtime = runtimeSnapshot();
    const facts = [
      ...runtime.packs.flatMap(pack => pack.features.map(feature => ({
        id:`${pack.id}.${feature.id}`,kind:'feature',
        label:`${pack.id} · ${feature.label}`,value:feature.value,
      }))),
      ...observations.snapshot(),
    ];
    const signature = JSON.stringify({runtime,facts});
    if (signature === previous) return;
    previous = signature;

    root.querySelector('.status strong').textContent = runtime.title;
    root.querySelector('.status-dot').className = `status-dot ${runtime.active ? 'active' : runtime.warning ? 'warning' : ''}`;
    root.querySelector('.dot').className = `dot ${runtime.active ? 'active' : runtime.warning ? 'warning' : ''}`;

    const packsBlock = root.querySelector('.packs');
    addRows(packsBlock.querySelector('ul'), runtime.packs.map(pack => ({
      label:pack.id,value:pack.version,href:repository(pack.id),
    })));
    packsBlock.hidden = runtime.packs.length === 0;

    const factsBlock = root.querySelector('.facts');
    addRows(factsBlock.querySelector('ul'), facts);
    factsBlock.hidden = facts.length === 0;
  }

  function open(value) {
    panel.hidden = !value;
    lamp.setAttribute('aria-expanded', String(value));
    if (value) { refresh(); root.querySelector('header button').focus(); }
  }

  lamp.onclick = () => open(panel.hidden);
  root.querySelector('header button').onclick = () => { open(false); lamp.focus(); };
  const outside = event => { if (!event.composedPath().includes(host)) open(false); };
  const keyboard = event => { if (event.key === 'Escape' && !panel.hidden) { open(false); lamp.focus(); } };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', keyboard);
  document.documentElement.append(host);
  refresh();
  const timer = setInterval(refresh, 1000);
  window.__tapInspector = {dispose() {
    clearInterval(timer);
    host.remove();
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('keydown', keyboard);
  }};
}
