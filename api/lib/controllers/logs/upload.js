const crypto = require('crypto');
const fse = require('fs-extra');
const path = require('path');
const csv = require('csv');
const parse = require('co-busboy');
const zlib = require('zlib');
const config = require('config');

const validator = require('../../services/validator');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/index-template');
const { appLogger } = require('../../../server');

const storagePath = config.get('storage.path');
const bulkSize = 4000; // NB: 2000 docs at once (1 insert = 2 ops)

module.exports = async function upload(ctx, index) {
  ctx.action = 'indices/insert';
  ctx.index = index;
  const { username, email } = ctx.state.user;
  const { query } = ctx.request;
  const { body: perm } = await elastic.security.hasPrivileges({
    username,
    body: {
      index: [{ names: [index], privileges: ['write'] }],
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });
  const canWrite = perm && perm.index && perm.index[index] && perm.index[index].write;
  const storeFile = !Object.hasOwnProperty.call(query, 'nostore') || query.nostore === 'false';

  if (!canWrite) {
    return ctx.throw(403, `you don't have permission to write in ${index}`);
  }

  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    await createIndex(index);
  }

  const domain = email.split('@')[1];
  const userDir = path.resolve(storagePath, domain, username);

  await fse.ensureDir(userDir);

  const splitHeader = ctx.request.headers['split-fields'];
  const splitReg = new RegExp('([^()]+?)\\((.+?)\\)', 'ig');
  const splittedFields = [];

  if (splitHeader) {
    let match;
    while (match = splitReg.exec(splitHeader)) {
      splittedFields.push({ field: match[1].trim(), delimiter: match[2] });
    }
  }

  if (!ctx.request.is('multipart/*')) {
    const now = new Date();
    const encoding = ctx.request.headers['content-encoding'];
    const isGzip = encoding && encoding.toLowerCase().includes('gzip');
    const filePath = path.resolve(userDir, `${now.toISOString()}.csv`);

    if (storeFile) {
      const fileStream = fse.createWriteStream(filePath);
      fileStream.on('error', (err) => ctx.app.emit('error', err));
      ctx.req.pipe(fileStream);
    }

    let stream = ctx.req;

    if (isGzip) {
      stream = zlib.createGunzip();
      ctx.req.pipe(stream);
    }

    ctx.type = 'json';

    try {
      ctx.body = await readStream(stream, index, username, splittedFields);
    } catch (e) {
      try {
        await fse.remove(filePath);
      } catch (e) {
        ctx.app.emit('error', e);
      }
      return ctx.throw(e.type === 'validation' ? 400 : 500, e.message);
    }
    return appLogger.info(`Insert into [${index}]`, ctx.body);
  }

  let total = 0;
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  let errors = [];
  let part;

  const parts = parse(ctx);

  while (part = await parts()) {
    if (part.length) { continue; }

    const isGzip = part.mime && part.mime.toLowerCase().includes('gzip');
    const filePath = path.resolve(userDir, part.filename.replace(/\s/g, '_'));

    if (storeFile) {
      const fileStream = fse.createWriteStream(filePath);
      fileStream.on('error', (err) => ctx.app.emit('error', err));
      ctx.req.pipe(fileStream);
    }

    let stream = part;

    if (isGzip) {
      stream = zlib.createGunzip();
      part.pipe(stream);
    }

    let result;
    try {
      result = await readStream(stream, index, username, splittedFields);
    } catch (e) {
      try {
        await fse.remove(filePath);
      } catch (e) {
        ctx.app.emit('error', e);
      }
      return ctx.throw(e.type === 'validation' ? 400 : 500, e.message);
    }

    total += result.total;
    inserted += result.inserted;
    updated += result.updated;
    failed += result.failed;

    if (errors.length < 10) {
      errors = errors.concat(result.errors.splice(0, 10 - errors.length));
    }
  }

  ctx.type = 'json';
  ctx.body = {
    total, inserted, updated, failed, errors,
  };
  return appLogger.info(`Insert into [${index}]`, ctx.body);
};

/**
 * Read a CSV stream and insert rows in elastic search
 * @param  {stream}   stream
 * @return {Promise}
 */
function readStream(stream, index, username, splittedFields) {
  const buffer = [];
  const result = {
    total: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };
  let busy = false;

  return new Promise((resolve, reject) => {
    let doneReading = false;

    const parser = csv.parse({
      delimiter: ';',
      columns: (columns) => {
        try {
          validator.validateColumns(columns);
        } catch (e) {
          return reject(e);
        }
        return columns;
      },
      'skip_empty_lines: true': true,
      'relax_column_count': true
    });

    parser.on('readable', read);
    parser.on('error', err => { reject(err); });
    parser.on('end', () => {
      doneReading = true;
      if (busy) { return; }

      bulkInsert((err) => {
        if (err) { return reject(err); }
        resolve(result);
      });
    });

    stream.on('error', (err) => { reject(err); });
    stream.pipe(parser);

    function read() {
      if (busy) { return; }

      let ec;
      while (ec = parser.read()) {
        splittedFields.forEach((split) => {
          if (typeof ec[split.field] === 'string') {
            ec[split.field] = ec[split.field].split(split.delimiter);
          }
        });

        if (result.total < 50) {
          try {
            validator.validateEvent(ec, result.total + 1);
          } catch (e) {
            return reject(e);
          }
        }

        result.total++;
        ec.index_name = index;

        if (!ec.datetime && !ec.timestamp) {
          addError({ reason: 'missing datetime or timestamp' });
          result.failed++;
          continue;
        }

        const docID = ec.log_id;

        if (!docID) {
          addError({ reason: 'log_id is missing' });
          result.failed++;
          continue;
        }

        if (ec['geoip-longitude'] && ec['geoip-latitude']) {
          ec.location = {
            lat: parseFloat(ec['geoip-latitude']),
            lon: parseFloat(ec['geoip-longitude']),
          };
        }

        // remove useless empty values
        for (const p in ec) {
          if (!ec[p]) { ec[p] = undefined; }
        }

        buffer.push({ index: { _id: docID, _index: index } });
        buffer.push(ec);
      }

      if (buffer.length < bulkSize) { return; }

      busy = true;

      bulkInsert((err) => {
        if (err) { return reject(err); }
        busy = false;

        if (!doneReading) {
          return read();
        }

        resolve(result);
      });
    }

    function bulkInsert(callback) {
      if (buffer.length < bulkSize && !(doneReading && buffer.length > 0)) {
        return callback();
      }

      elastic.bulk({
        body: buffer.splice(0, bulkSize),
      }, {
        headers: { 'es-security-runas-user': username },
      }, (err, { body }) => {
        if (err) { return callback(err); }

        (body.items || []).forEach((i) => {
          if (!i.index) { return result.failed++; }

          if (i.index.result === 'created') { return result.inserted++; }
          if (i.index.result === 'updated') { return result.updated++; }

          if (i.index.error) {
            addError(i.index.error);
          }

          result.failed++;
        });

        bulkInsert(callback);
      });
    }
  });

  function addError(err) {
    if (result.errors.length < 10) {
      result.errors.push(err);
    }
  }
}

/**
 * Create an index with a default mapping
 * @param  {String}  index
 * @return {Promise}
 */
function createIndex(index) {
  return elastic.indices.create({
    index,
    body: indexTemplate,
  }).then((res) => res.body);
}
