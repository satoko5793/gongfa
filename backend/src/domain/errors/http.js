const crypto = require("crypto");

function createHttpError(errorCode, statusCode = 500, options = {}) {
  const err = new Error(String(errorCode || "internal_error"));
  err.statusCode = Number(statusCode) || 500;
  err.errorCode = String(errorCode || "internal_error");
  if (options.details !== undefined) {
    err.details = options.details;
  }
  if (options.message) {
    err.publicMessage = String(options.message);
  }
  return err;
}

function normalizeErrorPayload(payload, statusCode, requestId) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const errorCode = String(payload.error || payload.code || `http_${statusCode || 500}`);
    return {
      ...payload,
      error: errorCode,
      message: String(payload.message || errorCode),
      details: payload.details === undefined ? undefined : payload.details,
      request_id: String(payload.request_id || requestId || ""),
    };
  }

  const errorCode = String(payload || `http_${statusCode || 500}`);
  return {
    error: errorCode,
    message: errorCode,
    request_id: String(requestId || ""),
  };
}

function attachRequestContext(req, res, next) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  req.requestContext = Object.freeze({
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
  });
  res.setHeader("X-Request-Id", requestId);

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 400) {
      return originalJson(normalizeErrorPayload(payload, res.statusCode, requestId));
    }
    if (payload && typeof payload === "object" && !Array.isArray(payload) && payload.request_id === undefined) {
      return originalJson({ ...payload, request_id: requestId });
    }
    return originalJson(payload);
  };

  next();
}

function sendErrorResponse(res, err, req) {
  const status = Number(err?.statusCode || err?.status || 500) || 500;
  const payload = {
    error: String(err?.errorCode || err?.message || "internal_error"),
    ...(err?.details !== undefined ? { details: err.details } : {}),
    ...(err?.publicMessage ? { message: err.publicMessage } : {}),
    ...(req?.requestId ? { request_id: req.requestId } : {}),
  };
  return res.status(status).json(payload);
}

module.exports = {
  attachRequestContext,
  createHttpError,
  normalizeErrorPayload,
  sendErrorResponse,
};
