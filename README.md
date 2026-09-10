# TAP inspector

Page-only expandable indicator. Core supplies the origin-scoped pack identities
and versions that were applied to the document. Independent page packs contribute
their own feature facts through `tap-pack-sdk/context`. The inspector only renders
those two generic inputs; it has no site, transport, capture, or feature semantics.
The shared context source lives in `../tap-pack-sdk/src/context.js`.

`context(window).provide(() => [{label, value}])` returns an unregister function.
Sources return current observations; the inspector samples them once per second.
The same snapshot is usable by another page-local projection. Labels are plain
text, never HTML. This is a small observation seam, not an ontology compiler.

The runtime view uses `TapBridge.status().packs`. It displays each `{id, version}`
verbatim under `Packs`; pack IDs link to the corresponding `inem/tap-pack-*`
repository by the current repository naming convention. `Features` contains the current `{label, value}` facts from
the context registry. No new network calls are made. No tokens, request contents,
or privileged Core controls are exposed.

Packs can contribute independently. An empty `Features` slot means that no loaded
pack contributed a fact; the inspector does not infer behavior from the DOM or
from a pack id. The indicator is page-local and not a profile-wide health claim.

Click the bottom-left T to expand. All visible copy is English. Escape, outside
click, or × closes it.
Duplicate injection disposes the previous indicator and its listeners/timer.
No persistence or Core enable/disable actions are offered.

Build/check with the SDK; tests/browser.cjs exercises the generated artifact with
synthetic sources in isolated Chrome, including missing Core context, pack versions,
changing and removed feature facts, Escape, reinjection and disposal.

## 0.3.2

Pack IDs link to repositories using the current `inem/tap-pack-*` naming
convention. This is a temporary presentation resolver until repository metadata
is part of the pack identity supplied by Core.

## 0.3.1

The panel is a passive projection with `Packs` and `Features` slots. Transport
diagnostics and explanatory capture text were removed. Pack identity comes from
the origin-scoped Core page plan; feature text remains owned by each contributing
pack.

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
