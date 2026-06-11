export {
  apiFetch,
  clearSession,
  formatDate,
  loadSession,
  saveSession,
} from "../shared.js?v=release-20260611-151806";

import {
  apiFetch,
  clearSession,
  formatDate,
  loadSession,
  saveSession,
} from "../shared.js?v=release-20260611-151806";

export function createAdminApi() {
  return {
    apiFetch,
    clearSession,
    formatDate,
    loadSession,
    saveSession,
  };
}
