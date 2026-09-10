import {context} from 'tap-pack-sdk/context';

if (window.top === window) {
  window.__tapInspector?.dispose();

  const observations = context(window);
  const host = document.createElement('div');
  host.dataset.tapInspector = '';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host{position:fixed!important;bottom:16px!important;left:16px!important;z-index:2147483646!important;font:13px/1.45 system-ui,-apple-system,sans-serif!important;color:#eef1f3!important;color-scheme:dark}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}
    .lamp{border:1px solid #58616b;background:#20262d;border-radius:50%;width:34px;height:34px;box-shadow:0 2px 8px #0004;display:flex;align-items:center;justify-content:center;gap:3px}
    .dot,.status-dot{width:6px;height:6px;border-radius:50%;border:1px solid #9aa4ae;flex:none}.active{background:#77d8ac;border-color:#77d8ac}.warning{background:#e5b567;border-color:#e5b567}
    section{position:absolute;bottom:44px;left:0;width:min(320px,calc(100vw - 32px));max-height:65vh;overflow:auto;border:1px solid #505a65;border-radius:14px;background:#20262d;box-shadow:0 8px 32px #0005;padding:16px}
    [hidden]{display:none}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}header button{border:0;background:none;font-size:20px;padding:4px}small{color:#adb6bf}
    .status{display:flex;gap:9px;align-items:flex-start;margin:18px 0 14px;padding:13px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff08}.status-dot{margin-top:6px}.status strong,.status span{display:block}.status span{color:#adb6bf;font-size:12px;margin-top:2px}
    h2{font-size:11px;line-height:1.3;text-transform:uppercase;letter-spacing:.08em;color:#8f9aa5;margin:17px 0 5px}
    ul{list-style:none;padding:0;margin:0}li{padding:9px 0;border-top:1px solid #ffffff14;display:flex;justify-content:space-between;gap:12px}li span:last-child{color:#adb6bf;text-align:right}
    details{border-top:1px solid #ffffff18;margin-top:14px;padding-top:12px}summary{cursor:pointer;color:#c6cdd3;user-select:none}details ul{margin-top:8px}.note{display:block;margin-top:10px;font-size:11px;color:#8f9aa5}
    button:focus-visible,summary:focus-visible{outline:2px solid #77d8ac;outline-offset:3px}
  </style>
  <section id="panel" role="region" aria-label="TAP page context" hidden>
    <header><strong>TAP</strong><button aria-label="Close">×</button></header>
    <small class="hostname"></small>
    <div class="status"><span class="status-dot"></span><div><strong></strong><span></span></div></div>
    <div class="facts" hidden><h2>On this page</h2><ul></ul></div>
    <details><summary>Diagnostics</summary><ul class="diagnostics"></ul><span class="note">Traffic capture runs independently from page features.</span></details>
  </section>
  <button class="lamp" aria-label="Open TAP page context" aria-expanded="false" aria-controls="panel">T<span class="dot"></span></button>`;

  const panel = root.querySelector('section');
  const lamp = root.querySelector('.lamp');
  root.querySelector('.hostname').textContent = location.hostname;
  let previous = '';

  function runtimeSnapshot() {
    const bridge = window.TapBridge;
    const status = bridge?.status?.() || {};
    const plan = status.plan_state || (bridge ? 'current' : 'absent');
    const channel = status.state || (bridge?.isReady() ? 'ready' : bridge ? 'unknown' : 'absent');
    const active = Boolean(bridge) && !['unavailable','revoked'].includes(plan);
    const updating = plan === 'checking' || plan === 'reloading';
    return {
      active,
      warning: Boolean(bridge) && plan === 'unavailable',
      title: !bridge ? 'TAP is unavailable on this page' : plan === 'revoked' ? 'TAP is no longer active here' : plan === 'unavailable' ? 'TAP needs attention' : updating ? 'Updating this page' : 'Active on this page',
      description: !bridge ? 'Reload the page to load its TAP features.' : plan === 'revoked' ? 'This page is removing its TAP features.' : plan === 'unavailable' ? 'Page features remain loaded, but updates cannot be checked right now.' : updating ? 'Checking for the latest page features.' : 'Page features are loaded and update automatically.',
      plan: {current:'Current',checking:'Checking',reloading:'Applying update',unavailable:'Temporarily unavailable',revoked:'Access removed',absent:'Unavailable'}[plan] || 'Unavailable',
      channel: {ready:'Available',connecting:'Connecting',retrying:'Reconnecting',paused:'Paused',suspended:'Suspended',unavailable:'Unavailable',disabled:'Not used on this page',absent:'Unavailable',unknown:'Unavailable'}[channel] || 'Unavailable',
    };
  }

  function addRows(list, facts) {
    list.replaceChildren();
    for (const fact of facts) {
      if (typeof fact.label !== 'string' || typeof fact.value !== 'string') continue;
      const row = document.createElement('li');
      for (const text of [fact.label, fact.value]) {
        const span = document.createElement('span');
        span.textContent = text;
        row.append(span);
      }
      list.append(row);
    }
  }

  function refresh() {
    const runtime = runtimeSnapshot();
    const facts = observations.snapshot().filter(fact => fact?.kind !== 'connection');
    const signature = JSON.stringify({runtime,facts});
    if (signature === previous) return;
    previous = signature;

    root.querySelector('.status strong').textContent = runtime.title;
    root.querySelector('.status span:last-child').textContent = runtime.description;
    root.querySelector('.status-dot').className = `status-dot ${runtime.active ? 'active' : runtime.warning ? 'warning' : ''}`;
    root.querySelector('.dot').className = `dot ${runtime.active ? 'active' : runtime.warning ? 'warning' : ''}`;

    const factsBlock = root.querySelector('.facts');
    addRows(factsBlock.querySelector('ul'), facts);
    factsBlock.hidden = facts.length === 0;
    addRows(root.querySelector('.diagnostics'), [
      {label:'Page updates',value:runtime.plan},
      {label:'Local requests',value:runtime.channel},
    ]);
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
