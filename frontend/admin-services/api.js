export {
  apiFetch,
  clearSession,
  formatDate,
  loadSession,
  saveSession,
} from "../shared.js?v=release-20260509-160631";

import {
  apiFetch,
  clearSession,
  formatDate,
  loadSession,
  saveSession,
} from "../shared.js?v=release-20260509-160631";

export function createAdminApi() {
  return {
    apiFetch,
    clearSession,
    formatDate,
    loadSession,
    saveSession,
  };
}
