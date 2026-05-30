const crypto = require('crypto');

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using crypto.scrypt (no external dependency needed).
 * Format: salt:hash (both hex-encoded)
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(String(password), salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Compare a plaintext password against a hashed password.
 * Supports both new format (salt:hash) and legacy plaintext for migration.
 * @param {string} password - plaintext password
 * @param {string} storedHash - stored hash (salt:hash format) or legacy plaintext
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, storedHash) {
  // Legacy plaintext support: if stored hash doesn't contain ':', treat as plaintext
  if (!storedHash.includes(':')) {
    return String(password) === String(storedHash);
  }

  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(':');
    crypto.scrypt(String(password), salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey));
    });
  });
}

module.exports = { hashPassword, comparePassword };
