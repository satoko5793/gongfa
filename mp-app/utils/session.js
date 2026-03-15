const STORAGE_KEY = "gongfa_miniapp_session_v1";

function loadSession() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null;
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  try {
    wx.setStorageSync(STORAGE_KEY, session || null);
  } catch (error) {
    // ignore cache errors
  }
}

function clearSession() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (error) {
    // ignore cache errors
  }
}

module.exports = {
  STORAGE_KEY,
  loadSession,
  saveSession,
  clearSession,
};
