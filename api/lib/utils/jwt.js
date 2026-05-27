// @ts-check
const { randomBytes } = require('node:crypto');

const config = require('config');
const {
  SignJWT,
  EncryptJWT,
  jwtVerify,
  jwtDecrypt,
} = require('jose');

const publicUrl = config.get('publicUrl');
const { secret, defaultExpiresIn } = config.get('auth');

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
const encryptKey = randomBytes(64);

/**
 * Setup payload of JWT or JWE
 *
 * @param {SignJWT | EncryptJWT} token - The token
 * @param {SignJWTOptions} options - The options to sign token
 */
function setJWTPayload(token, options) {
  token
    .setIssuedAt()
    .setIssuer(publicUrl)
    .setAudience(publicUrl);

  if (options.expiresIn) {
    token.setExpirationTime(Date.now() + (options.expiresIn * 1000));
  }
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
    clockTolerance: options.requireExpiration !== false ? 0 : undefined,
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
module.exports.signJWT = (payload, options = {}) => {
  const token = new SignJWT(payload);

  setJWTPayload(token, options);

  return token.sign(encodedSecret);
};

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {VerifyJWTOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<JWTPayload>} Payload of JWT
 */
module.exports.verifyJWT = async (token, options = {}) => {
  const verifyOptions = getJWTVerifyOptions(options);

  const { payload } = await jwtVerify(token, encodedSecret, verifyOptions);

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
module.exports.signJWE = (payload, options = {}) => {
  const token = new EncryptJWT(payload).setProtectedHeader({ alg: 'dir', enc: 'A256CBC-HS512' });

  setJWTPayload(token, {
    ...options,
    // JWE have always an expiration date
    expiresIn: options.expiresIn || defaultExpiresIn,
  });

  return token.encrypt(encryptKey);
};

/**
 * Verify a JWT
 *
 * @param {string} token - The JWT
 * @param {VerifyJWTOptions} [options] - Options to sign JWT
 *
 * @returns {Promise<JWTPayload>} Payload of JWT
 */
module.exports.verifyJWE = async (token, options = {}) => {
  const verifyOptions = getJWTVerifyOptions(options);

  const { payload } = await jwtDecrypt(token, encryptKey, verifyOptions);

  return payload;
};
