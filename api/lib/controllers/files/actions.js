const config = require('config');
const fse = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const Papa = require('papaparse');

const validator = require('../../services/validator');

const storagePath = config.get('storage.path');
const { appLogger } = require('../../services/logger');

/**
 * Validate a file, assuming it's a CSV file
 * @param {String} filePath
 */
function validateFile(filePath) {
  return new Promise((resolve, reject) => {
    let lineNumber = 0;
    let emptyLines = 0;
    const readLimit = 50;
    let columns;
    let err;

    let stream = fse.createReadStream(filePath);

    if (filePath.endsWith('gz')) {
      stream = stream.pipe(zlib.createGunzip());
    }

    Papa.parse(stream, {
      delimiter: ';',
      complete: () => resolve(err),
      error: (error) => reject(error),
      step: ({ data: row, errors }, parser) => {
        lineNumber += 1;

        if (row.filter((f) => f.trim()).length === 0) {
          emptyLines += 1;
          return;
        }

        if ((lineNumber - emptyLines) > readLimit) {
          return parser.abort();
        }

        if (errors.length > 0) {
          [err] = errors;

          if (err.type === 'Quotes') {
            // FIXME: translate me!
            err.message = `Ligne #${lineNumber}: un champ entre guillemets est mal formaté`;
          }

          return parser.abort();
        }

        if (typeof columns === 'undefined') {
          columns = row;

          try {
            return validator.validateColumns(columns);
          } catch (e) {
            err = e;
            return parser.abort();
          }
        }

        const ec = {};

        columns.forEach((colName, index) => {
          ec[colName] = row[index];
        });

        try {
          validator.validateEvent(ec, lineNumber);
        } catch (e) {
          err = e;
          parser.abort();
        }
      },
    });
  });
}

exports.upload = async function upload(ctx) {
  let { fileName } = ctx.request.params;

  ctx.action = 'file/upload';

  if (!/\.(csv|gz)$/i.test(fileName)) {
    return ctx.throw(400, ctx.$t('errors.files.unsupportedType'));
  }

  fileName = fileName.replace(/\s/g, '_');

  const { user } = ctx.state;
  const domain = user.email.split('@')[1];

  const relativePath = path.join(domain, user.username, fileName);
  const userDir = path.resolve(storagePath, domain, user.username);
  const filePath = path.resolve(userDir, fileName);

  ctx.metadata = { path: relativePath };

  await fse.ensureDir(userDir);

  await new Promise((resolve, reject) => {
    const stream = ctx.req.pipe(fse.createWriteStream(filePath));
    stream.on('error', reject);
    stream.on('finish', resolve);
  });

  appLogger.info(`Saved file [${filePath}]`);

  const result = await validateFile(filePath);

  if (result instanceof Error) {
    await fse.unlink(filePath);
    ctx.throw(400, result.message);
  } else {
    ctx.status = 204;
  }
};

exports.list = async function list(ctx) {
  ctx.action = 'file/list';
  const { username, email } = ctx.state.user;

  if (!email) {
    return ctx.throw(400, ctx.$t('errors.user.noEmail'));
  }

  const userDir = path.resolve(storagePath, email.split('@')[1], username);

  let fileList;
  try {
    fileList = await fse.readdir(userDir);
  } catch (e) {
    if (e.code !== 'ENOENT') { throw e; }
    fileList = [];
  }

  fileList = fileList.map((name) => ({ name }));

  // eslint-disable-next-line no-restricted-syntax
  for (const file of fileList) {
    // eslint-disable-next-line no-await-in-loop
    const stat = await fse.stat(path.resolve(userDir, file.name));
    file.size = stat.size;
    file.createdAt = stat.ctime;
    file.lastModified = stat.mtime;
  }

  ctx.body = fileList;
};

exports.deleteOne = async function deleteOne(ctx) {
  const { fileName } = ctx.request.params;
  ctx.action = 'file/delete';
  const { username, email } = ctx.state.user;

  if (!email) {
    return ctx.throw(400, ctx.$t('errors.user.noEmail'));
  }

  const domain = email.split('@')[1];

  const relativePath = path.join(domain, username, fileName);
  const filePath = path.resolve(storagePath, relativePath);

  ctx.metadata = { path: relativePath };

  await fse.remove(filePath);

  ctx.status = 204;
};

exports.deleteMany = async function deleteMany(ctx) {
  ctx.action = 'file/delete-many';
  const { username, email } = ctx.state.user;

  if (!email) {
    return ctx.throw(400, ctx.$t('errors.user.noEmail'));
  }

  const domain = email.split('@')[1];
  const { body } = ctx.request;
  const fileNames = body && body.entries;

  if (!fileNames) {
    return ctx.throw(400, ctx.$t('errors.files.missingEntries'));
  }

  if (!Array.isArray(fileNames)) {
    return ctx.throw(400, ctx.$t('errors.files.wrongEntriesFormat'));
  }

  const relativePaths = fileNames.map((fileName) => path.join(domain, username, fileName));

  ctx.metadata = { path: relativePaths };

  // eslint-disable-next-line no-restricted-syntax
  for (const filePath of relativePaths) {
    // eslint-disable-next-line no-await-in-loop
    await fse.remove(path.resolve(storagePath, filePath));
  }

  ctx.status = 204;
};
