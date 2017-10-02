const config = require('config');
const fse = require('fs-extra');
const path = require('path');

const storagePath = config.get('storage.path');
const { appLogger } = require('../../../server');

exports.upload = function* (fileName) {
  if (!/\.(csv|gz)$/i.test(fileName)) {
    return this.throw(400, 'unsupported file type');
  }

  const user     = this.state.user;
  const userDir  = path.resolve(storagePath, user.email.split('@')[1], user.username);
  const filePath = path.resolve(userDir, fileName);

  yield fse.ensureDir(userDir);

  yield new Promise((resolve, reject) => {
    const stream = this.req.pipe(fse.createWriteStream(filePath));
    stream.on('error', reject);
    stream.on('finish', resolve);
  });

  this.status = 204;
  return appLogger.info(`Saved file [${filePath}]`);
};

exports.list = function* () {
  const user    = this.state.user;
  const userDir = path.resolve(storagePath, user.email.split('@')[1], user.username);

  let fileList;
  try {
    fileList = yield fse.readdir(userDir)
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
