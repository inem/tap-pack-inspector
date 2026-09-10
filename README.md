# TAP inspector

Page-only expandable indicator. Its primary state describes TAP on the current
page. Optional transport details live under Diagnostics and are never presented
as the health of TAP as a whole. Context facts are contributed by independent
sources via `tap-pack-sdk/context`, then rendered without site-specific menus.
The shared source lives in `../tap-pack-sdk/src/context.js`.

`context(window).provide(() => [{label, value}])` returns an unregister function.
Sources return current observations; the inspector samples them once per second.
The same snapshot is usable by another page-local projection. Labels are plain
text, never HTML. This is a small observation seam, not an ontology compiler.

The built-in runtime view uses the current Core `TapBridge.status()` API. A page
with WebSocket disabled remains healthy: HTTP plan reconciliation and page
features continue to work. WebSocket appears only as the optional `Local requests`
diagnostic. No new WS or network calls are made. No tokens, request contents, or
privileged Core controls are exposed.

LinkedIn 0.4.9 contributes mounted Copy button count and hidden promoted post count.
These observations do not claim successful Save, installed pack enumeration,
profile-wide health, or verified capture. Other packs can contribute independently.
The indicator is page-local and not a trusted browser or OS security indicator.

Click the bottom-left T to expand. All visible copy is English. Escape, outside
click, or × closes it.
Duplicate injection disposes the previous indicator and its listeners/timer.
Currently no persistence or Core enable/disable actions are offered.

Build/check with the SDK; tests/browser.cjs exercises the generated artifact with
synthetic sources in isolated Chrome, including missing/disconnected WS, changing
and removed sources, Escape, reinjection and disposal.

## 0.3.0

The panel now leads with page feature health. `state: disabled` is treated as the
normal hubless case, not an unknown failure. WebSocket status moved under optional
Diagnostics as `Local requests`; manual transport controls were removed. Pack
observations remain the source for the `On this page` section.

## 0.2.0

Bridge context now adapts Core status() and advertised connect/disconnect/reconnect
actions. The view renders provided actions and re-resolves availability on click.
The companion patch is in ../tap-bridge-controls; older runtimes remain read-only.
LinkedIn counters were removed in 0.4.11. No list of handler operations is claimed.
