// @ts-check
const { randomBytes } = require('node:crypto');

const config = require('config');
const {
  SignJWT,
  EncryptJWT,
  jwtVerify,
  jwtDecrypt,
} = require('jose');
const { readFileSync, writeFileSync } = require('node:fs');

const publicUrl = config.get('publicUrl');
const { secret } = config.get('auth');

/**
 * @typedef {import('jose').JWTPayload} JWTPayload
 * @typedef {import('jose').JWTVerifyOptions} JWTVerifyOptions
 */

/**
  * @typedef {object} SignJWTOptions
  * @property {number} [expiresIn]
  */

/**
  * @typedef {object} VerifyJWTOptions
  * @property {boolean} [requireIssuer] - Should require
  * @property {boolean} [requireAudience]
  * @property {boolean} [requireExpiration]
  */

const encodedSecret = new TextEncoder().encode(secret);

// A256CBC-HS512 requires a 64bytes secret
let encryptKey = randomBytes(64);
// Restoring previous encryptKey in non production environments
if (process.env.EZMESURE_AUTH_PERSIST_ENCRYPT) {
  const encryptFile = 'auth-key.dev';
  try {
    encryptKey = readFileSync(encryptFile);
  } catch {
    writeFileSync(encryptFile, encryptKey);
  }
}

/**
 * @template {SignJWT | EncryptJWT} JWT
 *
 * Setup payload of JWT or JWE
 *
 * @param {JWT} token - The token
 * @param {SignJWTOptions} options - The options to sign token
 *
 * @returns {JWT} The token with correct payload
 */
function setJWTPayload(token, options) {
  token
    .setIssuedAt()
    .setIssuer(publicUrl)
    .setAudience(publicUrl);

  if (options.expiresIn) {
    token.setExpirationTime(Date.now() + (options.expiresIn * 1000));
  }

  return token;
}

/**
 * Get options to verify a JWT
 *
 * @param {VerifyJWTOptions} options - The options to verify token
 *
 * @returns {JWTVerifyOptions} The options to pass to jose
 */
function getJWTVerifyOptions(options) {
  return {
    audience: options.requireAudience !== false ? publicUrl : undefined,
    clockTolerance: options.requireExpiration === false ? Number.POSITIVE_INFINITY : undefined,
    issuer: options.requireIssuer !== false ? publicUrl : undefined,
  };
}

/**
 * Sign a JWT
 *
 * @param {JWTPayload} payload - The payload of the JWT
 * @param {SignJWTOptions} [options] - The options to sign JWE
 *
 * @returns {Promise<string>} JWT
 */
module.exports.signJWT = (payload, options = {}) => setJWTPayload(
  new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }),
  options,
).sign(encodedSecret);

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {VerifyJWTOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<JWTPayload>} Payload of JWT
 */
module.exports.verifyJWT = async (token, options = {}) => {
  const { payload } = await jwtVerify(token, encodedSecret, getJWTVerifyOptions(options));

  // Workaround as `jwtVerify` doesnt seems to check expiration
  if (options.requireExpiration !== false) {
    if (!payload.exp || payload.exp <= Date.now()) {
      throw new Error('"exp" claim timestamp check failed');
    }
  }

  return payload;
};

/**
 * Sign a JWE
 *
 * @param {JWTPayload} payload - The payload of the JWE
 * @param {SignJWTOptions} [options] - The options to sign JWE
 *
 * @returns {Promise<string>} Encoded JWT
 */
module.exports.signJWE = (payload, options = {}) => setJWTPayload(
  new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256CBC-HS512' }),
  options,
).encrypt(encryptKey);

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {VerifyJWTOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<JWTPayload>} Payload of JWT
 */
module.exports.verifyJWE = async (token, options = {}) => {
  const { payload } = await jwtDecrypt(token, encryptKey, getJWTVerifyOptions(options));

  // Workaround as `jwtDecrypt` doesnt seems to check expiration
  if (options.requireExpiration !== false) {
    if (!payload.exp || payload.exp <= Date.now()) {
      throw new Error('"exp" claim timestamp check failed');
    }
  }

  return payload;
};
