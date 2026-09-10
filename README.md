# TAP inspector

Page-only expandable corner LED. Core supplies the origin-scoped pack identities,
versions and static manifest features. Independent page packs can additionally
contribute changing facts through `tap-pack-sdk/context`. The inspector only renders
those generic inputs; it has no site, transport, capture, or feature semantics.
The shared context source lives in `../tap-pack-sdk/src/context.js`.

`context(window).provide(() => [{label, value}])` returns an unregister function.
Sources return current observations; the inspector samples them once per second.
The same snapshot is usable by another page-local projection. Labels are plain
text, never HTML. This is a small observation seam, not an ontology compiler.

The runtime view uses `TapBridge.status().packs`. It displays each `{id, version, features}`
under `Packs`, with the pack-owned features nested directly below their pack; pack IDs link
to the corresponding `inem/tap-pack-*` repository by the current repository naming
convention. Current `{label, value}` facts from the context registry appear in a compact
`Live on this page` group in the same section because the v1 observation contract does not
identify an owning pack. No new network calls are made. No tokens, request contents,
or privileged Core controls are exposed.

Packs can contribute independently. An empty `Features` slot means that no loaded
pack contributed a fact; the inspector does not infer behavior from the DOM or
from a pack id. The collapsed control is only an 8px status LED in the bottom-left
corner; the full TAP mark and details appear inside the opened panel. The indicator
is page-local and not a profile-wide health claim.

Click the bottom-left LED to expand. All visible copy is English. Escape, outside
click, or × closes it.
Duplicate injection disposes the previous indicator and its listeners/timer.
No persistence or Core enable/disable actions are offered.

## 0.3.4

The inspector constructs its shadow DOM with DOM APIs, so it works on pages such
as YouTube that enforce Trusted Types and reject string assignment to `innerHTML`.

Build/check with the SDK; tests/browser.cjs exercises the generated artifact with
synthetic sources in isolated Chrome, including missing Core context, pack versions,
changing and removed feature facts, Escape, reinjection and disposal.

## 0.3.3

Static manifest features carried in `TapBridge.status().packs` are shown alongside
dynamic page observations. Reader-only packs therefore remain visible without
adding a page script merely to describe themselves.

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

## 0.3.5

The corner LED turns blue while the page bridge has a WebSocket request in flight.
It reads only the generic pending count exposed by Core and does not infer the
request's handler, intent, or page semantics. Green returns when the transport is idle.

## 0.3.6

The pack exposes `tap.inspector.describe` and `tap.inspector.query` through Core's
generic `TapBridge.expose(operation, handler)` boundary. Core transports opaque
operation names and JSON values; DOM selection and the bounded result shape remain
owned here. The LED follows Core's generic activity counter and holds the blue flash
briefly so a fast page inspection is still visible.

## 0.3.7

During bridge activity the blue corner LED grows and pulses until the activity
window closes. Reduced-motion environments keep the enlarged blue state without
animation.

## 0.3.8

Pack identity, version and declared features are presented as one grouped list.
Dynamic page observations remain in that section under `Live on this page` until
their contract can identify an owning pack.
