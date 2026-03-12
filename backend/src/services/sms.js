// Placeholder service for Tencent SMS.
// Implement with Tencent Cloud SMS SDK later.

async function sendSmsCode(phone, code) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[sms] ${phone} -> ${code}`);
  }
  return true;
}

module.exports = { sendSmsCode };
