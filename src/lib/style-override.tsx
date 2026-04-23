// style-override.tsx — Responsive style infra
//
// Data shape convention for sections, columns and blocks:
//   entity.style  = { ...desktopProps }        ← base desktop style
//   entity.mobile = { ...partialOverrides }?   ← optional mobile overrides
//   entity.hidden = { desktop?, mobile? }?     ← optional visibility flags
//
// Mobile override stores ONLY keys that differ from desktop. Missing keys
// inherit from desktop via `resolveStyle`. Deleting a key from `mobile`
// means "inherit desktop" — no explicit "unset" value.
//
// Column has an extra shape: `column.mobile.w` may override column width %
// on mobile (e.g. 50/50 desktop → 100/0 mobile). If absent, the global
// stack-on-mobile section flag kicks in and the column becomes 100%.
//
// This module only provides data helpers. The runtime UI (`DeviceField`,
// per-section editor chips) consumes these and the email export emits
// the corresponding `@media (max-width:600px)` CSS.

// Resolve the effective style for a given device.
// Desktop: returns `base` unchanged.
// Mobile: returns `base` with any `override` keys applied on top.
function resolveStyle(base, override, device) {
  const b = base || {};
  if (device === 'mobile' && override && typeof override === 'object') {
    return { ...b, ...override };
  }
  return b;
}

// Get a single key's value for the given device. For mobile, checks the
// override first; falls back to the base value if not overridden.
function getDeviceValue(base, override, key, device) {
  if (device === 'mobile' && hasDeviceOverride(override, key)) return override[key];
  return base ? base[key] : undefined;
}

// Does a specific mobile override key exist? Used to render the chip's
// "has override" visual indicator even when the user is editing desktop.
function hasDeviceOverride(override, key) {
  if (!override || typeof override !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(override, key);
}

// Produce a new `mobile` object with `key` set to `value` (or removed when
// value is `undefined` — "back to inherit").
function setDeviceOverride(override, key, value) {
  const next = { ...(override || {}) };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return Object.keys(next).length === 0 ? undefined : next;
}

// Resolve visibility. Returns false if hidden on this device.
function isVisibleOn(hidden, device) {
  if (!hidden || typeof hidden !== 'object') return true;
  if (device === 'desktop' && hidden.desktop) return false;
  if (device === 'mobile' && hidden.mobile) return false;
  return true;
}

Object.assign(window, {
  resolveStyle,
  getDeviceValue,
  hasDeviceOverride,
  setDeviceOverride,
  isVisibleOn,
});
