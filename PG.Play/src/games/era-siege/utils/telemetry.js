// Telemetry surface — v1 ships a no-op transport so the sim and HUD can
// emit events without a vendor wired in. The contract is in
// docs/ERA_SIEGE_ANALYTICS_PLAN.md.

let transport = null;

export const telemetry = {
  setTransport(fn) { transport = fn; },
  emit(event, payload) {
    if (!transport) return;
    try { transport(event, payload); } catch { /* swallow */ }
  },
};
