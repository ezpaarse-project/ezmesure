const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const { randomBytes } = require('crypto');

const logosDir = path.resolve(__dirname, '..', '..', 'uploads', 'logos');

module.exports = class ImagesService {
  static logoPath(logoId) {
    return logoId && path.resolve(logosDir, logoId);
  }

  /**
   * Remove a logo with a given ID
   *
   * @param {String} logoId
   * @return {Promise}
   */
  static remove(logoId) {
    if (logoId) {
      return fs.remove(ImagesService.logoPath(logoId));
    }
  }

  /**
   * Take a base64 image, resize it, and return a base64 data URL
   *
   * @param {String} base64image - The base64 image to resize
   * @param {Object} [options]
   * @param {import('sharp').ResizeOptions} [options.resize] - The resize options
   * @param {import('sharp').FormatEnum} [options.format] - The output format
   * @returns {Promise<string>}
   */
  static async toDataUrl(base64image, options = {}) {
    const imageContent = Buffer.from(base64image, 'base64');

    const buffer = await sharp(imageContent)
      .resize({
        width: 64,
        height: 64,
        fit: sharp.fit.inside,
        ...options.resize ?? {},
      })
      .toFormat(options.format ?? 'png')
      .toBuffer();

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Take a Base64 image, resize it and store it
   *
   * @param {String} base64logo
   */
  static async storeLogo(base64logo) {
    const logoId = `${randomBytes(16).toString('hex')}.png`;
    const logoPath = path.resolve(logosDir, logoId);
    const logoContent = Buffer.from(base64logo, 'base64');

    await fs.ensureDir(logosDir);
    await sharp(logoContent)
      .resize({
        width: 600,
        height: 200,
        fit: sharp.fit.inside,
      })
      .toFormat('png')
      .toFile(logoPath);

    return logoId;
  }
};
