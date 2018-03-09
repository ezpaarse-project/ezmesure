const config = require('config');
const fse = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const Papa = require('papaparse');

const notifications = require('../../services/notifications');
const validator = require('../../services/validator');

const storagePath = config.get('storage.path');
const { appLogger } = require('../../../server');

exports.upload = async function (ctx, fileName) {
  if (!/\.(csv|gz)$/i.test(fileName)) {
    return ctx.throw(400, 'unsupported file type');
  }

  fileName = fileName.replace(/\s/g, '_');

  const user   = ctx.state.user;
  const domain = user.email.split('@')[1];

  const relativePath = path.join(domain, user.username, fileName);
  const userDir      = path.resolve(storagePath, domain, user.username);
  const filePath     = path.resolve(userDir, fileName);

  await fse.ensureDir(userDir);

  await new Promise((resolve, reject) => {
    const stream = ctx.req.pipe(fse.createWriteStream(filePath));
    stream.on('error', reject);
    stream.on('finish', resolve);
  });

  notifications.newFile(relativePath);
  appLogger.info(`Saved file [${filePath}]`);

  const result = await validateFile(filePath);

  if (result instanceof Error) {
    await fse.unlink(filePath);
    ctx.throw(400, result.message);
  } else {
    ctx.status = 204;
  }
};

exports.list = async function (ctx) {
  const user    = ctx.state.user;
  const userDir = path.resolve(storagePath, user.email.split('@')[1], user.username);

  let fileList;
  try {
    fileList = await fse.readdir(userDir);
  } catch (e) {
    if (e.code !== 'ENOENT') { throw e; }
    fileList = [];
  }

  fileList = fileList.map(name => { return { name }; })

  for (const file of fileList) {
    const stat = await fse.stat(path.resolve(userDir, file.name));
    file.size = stat.size;
    file.createdAt = stat.ctime;
    file.lastModified = stat.mtime;
  }

  ctx.body = fileList;
};

exports.deleteOne = async function (ctx, fileName) {
  const user     = ctx.state.user;
  const userDir  = path.resolve(storagePath, user.email.split('@')[1], user.username);
  const filePath = path.resolve(userDir, name);

  await fse.remove(filePath);

  ctx.status = 204;
};

exports.deleteMany = async function (ctx) {
  const user      = ctx.state.user;
  const userDir   = path.resolve(storagePath, user.email.split('@')[1], user.username);
  const body      = ctx.request.body;
  const fileNames = body && body.entries

  if (!fileNames) {
    return ctx.throw(400, 'missing required field: entries');
  }

  if (!Array.isArray(fileNames)) {
    return ctx.throw(400, 'entries should be an array of file names');
  }

  for (name of fileNames) {
    const filePath = path.resolve(userDir, name);
    await fse.remove(filePath);
  }

  ctx.status = 204;
};

/**
 * Validate a file, assuming it's a CSV file
 * @param {String} filePath
 */
function validateFile (filePath) {
  return new Promise((resolve, reject) => {
    let lineNumber = 0
    let readLimit = 50
    let columns
    let err

    let stream = fse.createReadStream(filePath);

    if (filePath.endsWith('gz')) {
      stream = stream.pipe(zlib.createGunzip());
    }

    Papa.parse(stream, {
      delimiter: ';',
      complete: () => resolve(err),
      error: error => reject(error),
      step: ({ data, errors }, parser) => {
        if (++lineNumber > readLimit) {
          return parser.abort()
        }
        const row = data[0]

        if (errors.length > 0) {
          err = errors[0]

          if (err.type === 'Quotes') {
            err.message = `Ligne #${lineNumber}: un champ entre guillemets est mal formaté`
          }

          return parser.abort()
        }

        if (typeof columns === 'undefined') {
          columns = row;

          try {
            return validator.validateColumns(columns);
          } catch (e) {
            err = e
            return parser.abort()
          }
        }

        const ec = {}

        columns.forEach((colName, index) => {
          ec[colName] = row[index]
        })

        try {
          validator.validateEvent(ec)
        } catch (e) {
          err = e;
          parser.abort()
        }
      }
    })
  })
}
