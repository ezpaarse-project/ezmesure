// @ts-check
const { createCipheriv, createDecipheriv, randomBytes } = require('node:crypto');

const config = require('config');
const jwt = require('jsonwebtoken');

const issuer = config.get('publicUrl');
const { secret } = config.get('auth');

// Create key to cipher/decipher
const key = randomBytes(32);
const iv = randomBytes(16);

/**
 * Sign a JWT
 *
 * @param {Record<string, string>} payload - The payload of the JWT
 * @param {jwt.SignOptions} [options] - Options to sign JWT
 *
 * @returns {string} JWT
 */
const signJWT = (payload, options) => jwt.sign(
  payload,
  secret,
  {
    ...options,
    issuer,
  },
);

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {jwt.VerifyOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<string | jwt.Jwt | jwt.JwtPayload>} Payload of JWT
 */
const verifyJWT = (token, options) => new Promise((resolve, reject) => {
  jwt.verify(
    token,
    secret,
    { ...options, issuer },
    (err, data) => {
      if (!data) {
        reject(err);
        return;
      }

      resolve(data);
    },
  );
});

/**
 * Sign a JWE
 *
 * @param {Record<string, string>} payload - The payload of the JWT
 * @param {jwt.SignOptions} [options] - Options to sign JWT
 *
 * @returns {string} Encoded JWT
 */
function signJWE(payload, options) {
  // Generate a JWT
  const token = signJWT(payload, options);

  // Encrypt JWT - Making a JWE
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(token, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  // Package the IV and encrypted data together
  return `${iv.toString('hex')}${encrypted}`;
}

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {jwt.VerifyOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<string | jwt.Jwt | jwt.JwtPayload>} Payload of JWT
 */
function verifyJWE(token, options) {
  // Unpackage the combined iv + encrypted message.
  const ivLength = iv.toString('hex').length;
  // Decrypt JWE
  const inputIV = token.slice(0, ivLength);
  const encrypted = token.slice(ivLength);
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(inputIV, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return verifyJWT(decrypted, options);
}

module.exports = {
  signJWT,
  verifyJWT,
  signJWE,
  verifyJWE,
};
