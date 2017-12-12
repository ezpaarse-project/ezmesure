const config = require('config');
const fse = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const Papa = require('papaparse');

const notifications = require('../../services/notifications');

const storagePath = config.get('storage.path');
const { appLogger } = require('../../../server');

exports.upload = function* (fileName) {
  if (!/\.(csv|gz)$/i.test(fileName)) {
    return this.throw(400, 'unsupported file type');
  }

  const user   = this.state.user;
  const domain = user.email.split('@')[1];

  const relativePath = path.join(domain, user.username, fileName);
  const userDir      = path.resolve(storagePath, domain, user.username);
  const filePath     = path.resolve(userDir, fileName);

  yield fse.ensureDir(userDir);

  yield new Promise((resolve, reject) => {
    const stream = this.req.pipe(fse.createWriteStream(filePath));
    stream.on('error', reject);
    stream.on('finish', resolve);
  });

  notifications.newFile(relativePath);
  appLogger.info(`Saved file [${filePath}]`);

  const result = yield validateFile(filePath);

  if (result instanceof Error) {
    yield fse.unlink(filePath);
    this.throw(400, result.message);
  } else {
    this.status = 204;
  }
};

exports.list = function* () {
  const user    = this.state.user;
  const userDir = path.resolve(storagePath, user.email.split('@')[1], user.username);

  let fileList;
  try {
    fileList = yield fse.readdir(userDir);
  } catch (e) {
    if (e.code !== 'ENOENT') { throw e; }
    fileList = [];
  }

  fileList = fileList.map(name => { return { name }; })

  for (const file of fileList) {
    const stat = yield fse.stat(path.resolve(userDir, file.name));
    file.size = stat.size;
    file.createdAt = stat.ctime;
    file.lastModified = stat.mtime;
  }

  this.body = fileList;
};

exports.deleteOne = function* (fileName) {
  const user     = this.state.user;
  const userDir  = path.resolve(storagePath, user.email.split('@')[1], user.username);
  const filePath = path.resolve(userDir, name);

  yield fse.remove(filePath);

  this.status = 204;
};

exports.deleteMany = function* () {
  const user      = this.state.user;
  const userDir   = path.resolve(storagePath, user.email.split('@')[1], user.username);
  const body      = this.request.body;
  const fileNames = body && body.entries

  if (!fileNames) {
    return this.throw(400, 'missing required field: entries');
  }

  if (!Array.isArray(fileNames)) {
    return this.throw(400, 'entries should be an array of file names');
  }

  for (name of fileNames) {
    const filePath = path.resolve(userDir, name);
    yield fse.remove(filePath);
  }

  this.status = 204;
};

/**
 * Validate a file, assuming it's a CSV file
 * @param {String} filePath
 */
function validateFile (filePath) {
  return new Promise((resolve, reject) => {
    const mandatoryFields = new Set([
      'datetime',
      'log_id',
      'rtype',
      'mime',
      'title_id',
      'doi'
    ])

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
          columns = row

          for (const field of mandatoryFields) {
            if (!columns.includes(field)) {
              err = new Error(`Le champ "${field}" est manquant`)
              return parser.abort()
            }
          }
          return
        }

        const obj = {}

        columns.forEach((colName, index) => {
          obj[colName] = row[index]
        })

        if (!obj.log_id) {
          err = new Error(`Ligne #${lineNumber}: champ "log_id" vide`)
        } else if (!obj.datetime) {
          err = new Error(`Ligne #${lineNumber}: champ "datetime" vide`)
        } else if (isNaN(Date.parse(obj.datetime))) {
          err = new Error(`Ligne #${lineNumber}: champ "datetime" invalide, le fichier a-t-il été modifié ?`)
        } else if (obj.date && !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
          err = new Error(`Ligne #${lineNumber}: champ "date" invalide, le fichier a-t-il été modifié ?`)
        }

        if (err) {
          parser.abort()
        }
      }
    })
  })
}
