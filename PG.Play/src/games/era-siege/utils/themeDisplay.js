// Display-name overlay for the active theme pack.
//
// The code's era / special IDs and `name` fields never change — they're
// the save-format keys + the procedural fallback labels. When a theme
// pack ships with overrides (e.g. v2 paints "Ember Tribe" as "Volcanic
// Basalt / Obsidian Gate / Magma Burst"), the HUD reads through these
// helpers to show the pack-specific name.
//
// Reads through the settings cache. The render tree re-renders every
// sim tick via setHud, so a settings change picks up on the next frame.

import { readSettings } from './settings.js';

function activePack() {
  return readSettings().artPack || 'classic';
}

export function eraDisplayName(era) {
  if (!era) return '';
  const pack = activePack();
  return era.themeLabels?.[pack]?.name ?? era.name ?? '';
}

export function eraGateName(era) {
  if (!era) return null;
  const pack = activePack();
  return era.themeLabels?.[pack]?.gateName ?? null;
}

export function specialDisplayName(def) {
  if (!def) return '';
  const pack = activePack();
  return def.themeLabels?.[pack]?.name ?? def.name ?? '';
}
