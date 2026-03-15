const { API_BASE_URL } = require("./config");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const session = app?.globalData?.session || null;
    const header = {
      "content-type": "application/json",
      ...(options.header || {}),
    };

    if (session?.token) {
      header.Authorization = `Bearer ${session.token}`;
    }

    wx.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(res.data || { error: "request_failed", statusCode: res.statusCode });
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

module.exports = {
  request,
};
