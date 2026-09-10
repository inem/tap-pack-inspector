import {context} from 'tap-pack-sdk/context';

if (window.top === window) {
  window.__tapInspector?.dispose();

  const observations = context(window);
  const host = document.createElement('div');
  host.dataset.tapInspector = '';
  const root = host.attachShadow({mode:'open'});
  const style = document.createElement('style');
  style.textContent = `
    :host{position:fixed!important;bottom:0!important;left:0!important;z-index:2147483646!important;font:13px/1.45 system-ui,-apple-system,sans-serif!important;color:#eef1f3!important;color-scheme:dark}
    *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}
    .lamp{border:0;background:transparent;width:20px;height:20px;padding:6px;display:flex;align-items:center;justify-content:center}
    .dot,.status-dot{width:6px;height:6px;border-radius:50%;border:1px solid #9aa4ae;flex:none}.lamp .dot{width:8px;height:8px}.active{background:#77d8ac;border-color:#77d8ac}.lamp .active{box-shadow:0 0 6px #77d8acaa}.development,.transport{background:#5aa9ff;border-color:#5aa9ff}.lamp .development{box-shadow:0 0 6px #5aa9ffaa}.lamp .transport{animation:tap-transport-pulse 900ms ease-in-out infinite;will-change:transform,box-shadow}.warning{background:#e5b567;border-color:#e5b567}.lamp .warning{box-shadow:0 0 6px #e5b567aa}
    @keyframes tap-transport-pulse{0%,100%{transform:scale(1.22);box-shadow:0 0 5px #5aa9ffbb,0 0 0 0 #5aa9ff44}50%{transform:scale(1.65);box-shadow:0 0 10px #5aa9ffee,0 0 0 4px #5aa9ff1f}}
    @media (prefers-reduced-motion:reduce){.lamp .transport{animation:none;transform:scale(1.35);box-shadow:0 0 8px #5aa9ffdd}}
    section{position:absolute;bottom:24px;left:8px;width:min(320px,calc(100vw - 24px));max-height:65vh;overflow:auto;border:1px solid #505a65;border-radius:14px;background:#20262d;box-shadow:0 8px 32px #0005;padding:16px}
    [hidden]{display:none}header{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:10px;align-items:center;margin-bottom:7px}header>strong{font-size:14px}header>button{border:0;background:none;font-size:20px;padding:3px 4px}.hostname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#adb6bf}
    .status{display:flex;gap:6px;align-items:center;font-size:12px;color:#cbd2d8}
    h2{font-size:11px;line-height:1.3;text-transform:uppercase;letter-spacing:.08em;color:#8f9aa5;margin:17px 0 5px}
    ul{list-style:none;padding:0;margin:0}.pack{padding:0;border-top:1px solid #ffffff14}.pack-row,.feature-row{display:flex;justify-content:space-between;gap:12px}.pack-row{padding:9px 0}.pack-row span:last-child,.feature-row span:last-child{color:#adb6bf;text-align:right}.pack-features{margin:0 0 7px 9px;padding-left:10px;border-left:1px solid #ffffff18}.feature-item{padding:5px 0}.feature-row{font-size:12px}.feature-row span:first-child{color:#cbd2d8}.folder{border:0;background:none;color:#8fc9ff;padding:3px 0 0;width:100%;display:flex;gap:6px;align-items:center;text-align:left;font-size:11px;min-width:0}.folder svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;flex:none}.folder span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.folder.done{color:#77d8ac}.folder.failed{color:#e5b567}.live-label{padding:8px 0 3px 19px;color:#8f9aa5;font-size:10px;line-height:1.3;text-transform:uppercase;letter-spacing:.08em}
    a{color:inherit;text-decoration:none}a:hover{text-decoration:underline;text-underline-offset:3px}
    button:focus-visible{outline:2px solid #77d8ac;outline-offset:3px}
  `;
  const element = (tag, attributes = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      if (name === 'class') node.className = value;
      else if (name === 'text') node.textContent = value;
      else if (name === 'hidden') node.hidden = value;
      else node.setAttribute(name, value);
    }
    node.append(...children);
    return node;
  };
  const close = element('button', {'aria-label':'Close', text:'×'});
  const hostname = element('small', {class:'hostname'});
  const statusDot = element('span', {class:'status-dot'});
  const statusTitle = element('strong');
  const packs = element('div', {class:'packs', hidden:true}, [
    element('h2', {text:'Packs'}), element('ul'),
  ]);
  const status = element('div', {class:'status'}, [statusDot, statusTitle]);
  const panel = element('section', {
    id:'panel', role:'region', 'aria-label':'TAP page context', hidden:true,
  }, [
    element('header', {}, [element('strong', {text:'TAP'}), hostname, status, close]),
    packs,
  ]);
  const lamp = element('button', {
    class:'lamp', 'aria-label':'Open TAP page context',
    'aria-expanded':'false', 'aria-controls':'panel',
  }, [element('span', {class:'dot'})]);
  root.append(style, panel, lamp);

  hostname.textContent = location.hostname;
  let previous = '';
  let activitySequence = 0, activityUntil = 0;

  function runtimeSnapshot() {
    const bridge = window.TapBridge;
    const status = bridge?.status?.() || {};
    const plan = status.plan_state || (bridge ? 'current' : 'absent');
    const active = Boolean(bridge) && plan !== 'revoked';
    const updating = plan === 'checking' || plan === 'reloading';
    const development = active && status.mode === 'development';
    const activity = status.activity && typeof status.activity === 'object' ? status.activity : {};
    if (Number.isInteger(activity.sequence) && activity.sequence !== activitySequence) {
      activitySequence = activity.sequence;
      activityUntil = Date.now() + 700;
    }
    return {
      active,
      development,
      transportActive: (Number.isInteger(activity.pending) && activity.pending > 0)
        || Date.now() < activityUntil || (Number.isInteger(status.pending) && status.pending > 0),
      warning: Boolean(bridge) && plan === 'unavailable',
      title: !bridge ? 'Unavailable' : plan === 'revoked' ? 'Inactive' : updating ? 'Updating' : development ? 'Development' : 'Active',
      packs: Array.isArray(status.packs) ? status.packs.filter(pack => pack
        && typeof pack.id === 'string' && typeof pack.version === 'string').map(pack => ({
          ...pack,
          features:Array.isArray(pack.features) ? pack.features.filter(feature => feature
            && typeof feature.id === 'string' && typeof feature.label === 'string'
            && typeof feature.value === 'string'
            && (feature.folder === undefined || typeof feature.folder === 'string')) : [],
        })) : [],
    };
  }

  function refreshLamp(runtime = runtimeSnapshot()) {
    const state = runtime.transportActive ? 'transport'
      : runtime.development ? 'development' : runtime.active ? 'active' : runtime.warning ? 'warning' : '';
    root.querySelector('.dot').className = `dot ${state}`;
    lamp.setAttribute('aria-label', runtime.transportActive
      ? 'TAP transport active' : 'Open TAP page context');
  }

  function repository(packId) {
    const slug = packId.replace(/^tap\./, '').replaceAll('.', '-');
    return `https://github.com/inem/tap-pack-${slug}`;
  }

  function row(label, value, href, className) {
    const item = element('div', {class:className});
    const name = typeof href === 'string' ? document.createElement('a') : document.createElement('span');
    name.textContent = label;
    if (name instanceof HTMLAnchorElement) {
      name.href = href;
      name.target = '_blank';
      name.rel = 'noopener noreferrer';
    }
    item.append(name, element('span', {text:value}));
    return item;
  }

  function folderIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', 'M1.5 4.25h4l1.25-1.5h2.5l1.25 1.5h4v8.5h-13z');
    svg.append(path);
    return svg;
  }

  async function revealFolder(button, path) {
    button.disabled = true;
    button.classList.remove('done', 'failed');
    try {
      await window.TapBridge.request('tap.inspector', {action:'reveal_folder', path});
      button.classList.add('done');
    } catch {
      button.classList.add('failed');
    } finally {
      button.disabled = false;
    }
  }

  function featureRows(features) {
    const list = element('ul', {class:'pack-features'});
    for (const feature of features) {
      if (typeof feature.label !== 'string' || typeof feature.value !== 'string') continue;
      const item = element('li', {class:'feature-item'}, [row(feature.label, feature.value, null, 'feature-row')]);
      if (typeof feature.folder === 'string') {
        const folder = element('button', {
          class:'folder', type:'button', title:feature.folder,
          'aria-label':`Open ${feature.folder} in Finder`,
        }, [folderIcon(), element('span', {text:feature.folder})]);
        folder.onclick = () => revealFolder(folder, feature.folder);
        item.append(folder);
      }
      list.append(item);
    }
    return list;
  }

  function renderPacks(list, runtimePacks, liveFacts) {
    list.replaceChildren();
    for (const pack of runtimePacks) {
      const children = [row(pack.id, pack.version, repository(pack.id), 'pack-row')];
      if (pack.features.length) children.push(featureRows(pack.features));
      list.append(element('li', {class:'pack'}, children));
    }
    if (liveFacts.length) {
      const children = [element('div', {class:'live-label', text:'Live on this page'}), featureRows(liveFacts)];
      list.append(element('li', {class:'pack live'}, children));
    }
  }

  function refresh() {
    const runtime = runtimeSnapshot();
    const liveFacts = observations.snapshot();
    const signature = JSON.stringify({runtime,liveFacts});
    if (signature === previous) return;
    previous = signature;

    root.querySelector('.status strong').textContent = runtime.title;
    root.querySelector('.status-dot').className = `status-dot ${runtime.development ? 'development' : runtime.active ? 'active' : runtime.warning ? 'warning' : ''}`;
    refreshLamp(runtime);

    const packsBlock = root.querySelector('.packs');
    renderPacks(packsBlock.querySelector('ul'), runtime.packs, liveFacts);
    packsBlock.hidden = runtime.packs.length === 0 && liveFacts.length === 0;
  }

  function open(value) {
    panel.hidden = !value;
    lamp.setAttribute('aria-expanded', String(value));
    if (value) { refresh(); root.querySelector('header button').focus(); }
  }

  lamp.onclick = () => open(panel.hidden);
  close.onclick = () => { open(false); lamp.focus(); };
  const outside = event => { if (!event.composedPath().includes(host)) open(false); };
  const keyboard = event => { if (event.key === 'Escape' && !panel.hidden) { open(false); lamp.focus(); } };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', keyboard);
  const disposers = [];
  const bridge = window.TapBridge;
  if (typeof bridge?.expose === 'function') {
    disposers.push(bridge.expose('tap.inspector.describe', () => ({
      url:location.href,
      title:document.title,
      readyState:document.readyState,
      visibilityState:document.visibilityState,
      viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},
      counts:{links:document.links.length,images:document.images.length,forms:document.forms.length},
    })));
    disposers.push(bridge.expose('tap.inspector.query', args => {
      if (!args || typeof args.selector !== 'string' || !args.selector || args.selector.length > 1000)
        throw Object.assign(new Error('A selector up to 1000 characters is required'), {code:'invalid_selector'});
      const limit = Number.isInteger(args.limit) ? Math.max(1, Math.min(50, args.limit)) : 20;
      let matches;
      try { matches = [...document.querySelectorAll(args.selector)].slice(0, limit); }
      catch { throw Object.assign(new Error('The selector is invalid'), {code:'invalid_selector'}); }
      return matches.map(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          tag:node.localName,
          id:node.id || null,
          class:typeof node.className === 'string' ? node.className.slice(0,500) : null,
          role:node.getAttribute('role'),
          ariaLabel:node.getAttribute('aria-label'),
          text:(node.innerText || node.textContent || '').trim().slice(0,2000),
          href:node instanceof HTMLAnchorElement ? node.href : null,
          visible:style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
          rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
        };
      });
    }));
  }
  document.documentElement.append(host);
  refresh();
  const timer = setInterval(refresh, 1000);
  const lampTimer = setInterval(refreshLamp, 100);
  window.__tapInspector = {dispose() {
    clearInterval(timer);
    clearInterval(lampTimer);
    for (const dispose of disposers) dispose();
    host.remove();
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('keydown', keyboard);
  }};
}
