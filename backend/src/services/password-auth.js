const crypto = require("crypto");

const SCRYPT_PARAMS = {
  keylen: 64,
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
};

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_PARAMS.keylen,
      {
        N: SCRYPT_PARAMS.cost,
        r: SCRYPT_PARAMS.blockSize,
        p: SCRYPT_PARAMS.parallelization,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      }
    );
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(String(password), salt);
  return `scrypt$${SCRYPT_PARAMS.cost}$${SCRYPT_PARAMS.blockSize}$${SCRYPT_PARAMS.parallelization}$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const [algorithm, cost, blockSize, parallelization, salt, hashHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hashHex) return false;

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(
      String(password),
      salt,
      Buffer.from(hashHex, "hex").length,
      {
        N: Number(cost) || SCRYPT_PARAMS.cost,
        r: Number(blockSize) || SCRYPT_PARAMS.blockSize,
        p: Number(parallelization) || SCRYPT_PARAMS.parallelization,
      },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      }
    );
  });

  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(expected, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
