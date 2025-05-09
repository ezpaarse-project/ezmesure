const fse = require('fs-extra');
const path = require('path');
const csv = require('csv');
const parse = require('co-busboy');
const zlib = require('zlib');
const config = require('config');

const { isValid: dateIsValid, format: formatDate } = require('date-fns');

const validator = require('../../services/validator');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/index-template');
const { appLogger } = require('../../services/logger');

const storagePath = config.get('storage.path');

// Number of operations in each bulk request (1 document = 2 ops)
const bulkSize = Number.parseInt(config.get('ezpaarse.upload.bulkSize'), 10) * 2;
// Maximum number of tries when indexing docs in bulk
const bulkMaxTries = Number.parseInt(config.get('ezpaarse.upload.bulkMaxTries'), 10);
// Base wait time in ms before retrying, with exponential backoff
const bulkBaseRetryDelay = Number.parseInt(config.get('ezpaarse.upload.bulkBaseRetryDelay'), 10);

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
      skip_empty_lines: true,
      relax_column_count: true,
    });

    // eslint-disable-next-line no-use-before-define
    parser.on('readable', read);
    parser.on('error', (err) => { reject(err); });
    parser.on('end', () => {
      doneReading = true;
      if (busy) { return; }

      // eslint-disable-next-line no-use-before-define
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
      // eslint-disable-next-line no-cond-assign
      while (ec = parser.read()) {
        // eslint-disable-next-line no-loop-func
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

        result.total += 1;
        ec.index_name = index;

        if (!ec.datetime && !ec.timestamp) {
          // eslint-disable-next-line no-use-before-define
          addError({ reason: 'missing datetime or timestamp' });
          result.failed += 1;
          // eslint-disable-next-line no-continue
          continue;
        }

        const docID = ec.log_id;

        if (!docID) {
          // eslint-disable-next-line no-use-before-define
          addError({ reason: 'log_id is missing' });
          result.failed += 1;
          // eslint-disable-next-line no-continue
          continue;
        }

        const date = new Date(ec.datetime);

        if (!dateIsValid(date)) {
          // eslint-disable-next-line no-use-before-define
          addError({ reason: 'datetime is not valid' });
          result.failed += 1;
          // eslint-disable-next-line no-continue
          continue;
        }

        ec.date = formatDate(date, 'yyyy-MM-dd');

        if (ec['geoip-longitude'] && ec['geoip-latitude']) {
          ec.location = {
            lat: parseFloat(ec['geoip-latitude']),
            lon: parseFloat(ec['geoip-longitude']),
          };
        }

        // remove useless empty values
        // eslint-disable-next-line no-restricted-syntax
        for (const p in ec) {
          if (!ec[p]) { ec[p] = undefined; }
        }

        buffer.push({ index: { _id: docID, _index: index } });
        buffer.push(ec);
      }

      if (buffer.length < bulkSize) { return; }

      busy = true;

      // eslint-disable-next-line no-use-before-define
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

      const docsToInsert = buffer.splice(0, bulkSize);
      let nbTries = 0;

      const tryBulk = () => {
        nbTries += 1;

        elastic.bulk({
          body: docsToInsert,
        }, {
          headers: { 'es-security-runas-user': username },
        }, (err, { body }) => {
          if (err) {
            if (nbTries > bulkMaxTries) {
              appLogger.error(`[ec-upload] Bulk operation reached maximum number of attempts:\n${err}`);
              return callback(err);
            }

            const waitTime = bulkBaseRetryDelay * (2 ** (nbTries - 1));
            appLogger.error(`[ec-upload] Bulk operation failed (attempt: ${nbTries}, retrying in ${waitTime}ms):\n${err}`);

            return setTimeout(() => tryBulk(), waitTime);
          }

          (body.items || []).forEach((i) => {
            if (!i.index) {
              result.failed += 1;
              return result.failed;
            }

            if (i.index.result === 'created') {
              result.inserted += 1;
              return result.inserted;
            }
            if (i.index.result === 'updated') {
              result.updated += 1;
              return result.updated;
            }

            if (i.index.error) {
              // eslint-disable-next-line no-use-before-define
              addError(i.index.error);
            }

            result.failed += 1;
          });

          bulkInsert(callback);
        });
      };

      tryBulk();
    }
  });

  function addError(err) {
    if (result.errors.length < 10) {
      result.errors.push(err);
    }
  }
}

module.exports = async function upload(ctx) {
  const { index } = ctx.request.params;

  ctx.action = 'indices/insert';
  ctx.index = ctx.request.params.index;

  const startTime = process.hrtime.bigint();
  const { username, email } = ctx.state.user;

  const { body: perm } = await elastic.security.hasPrivileges({
    username,
    body: {
      index: [{ names: [index], privileges: ['write'] }],
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });

  const canWrite = perm && perm.index && perm.index[index] && perm.index[index].write;

  if (!canWrite) {
    return ctx.throw(403, ctx.$t('errors.perms.writeInIndex', index));
  }

  if (!email) {
    return ctx.throw(400, ctx.$t('errors.user.noEmail'));
  }

  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    await createIndex(index);
  }

  const domain = email.split('@')[1];
  const userDir = path.resolve(storagePath, domain, username);

  await fse.ensureDir(userDir);

  const splitHeader = ctx.request.headers['split-fields'];
  const splitReg = /([^()]+?)\((.+?)\)/ig;
  const splittedFields = [];

  if (splitHeader) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while (match = splitReg.exec(splitHeader)) {
      splittedFields.push({ field: match[1].trim(), delimiter: match[2] });
    }
  }

  if (!ctx.request.is('multipart/*')) {
    const now = new Date();
    const encoding = ctx.request.headers['content-encoding'];
    const isGzip = encoding && encoding.toLowerCase().includes('gzip');
    const filePath = path.resolve(userDir, `${now.toISOString()}.csv`);

    let stream = ctx.req;

    if (isGzip) {
      stream = zlib.createGunzip();
      ctx.req.pipe(stream);
    }

    ctx.type = 'json';

    try {
      ctx.body = await readStream(stream, index, username, splittedFields);
      const endTime = process.hrtime.bigint();
      ctx.body.took = Math.ceil(Number((endTime - startTime) / 1000000n));
    } catch (e) {
      try {
        await fse.remove(filePath);
      } catch (err) {
        ctx.app.emit('error', err);
      }
      return ctx.throw(e.type === 'validation' ? 400 : 500, e.message);
    }
    return appLogger.info(`[ec-upload] Insert into [${index}]`, ctx.body);
  }

  let total = 0;
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  let errors = [];
  let part;

  const parts = parse(ctx);

  // eslint-disable-next-line no-cond-assign, no-await-in-loop
  while (part = await parts()) {
    // eslint-disable-next-line no-continue
    if (part.length) { continue; }

    const isGzip = part.mime && part.mime.toLowerCase().includes('gzip');
    const filePath = path.resolve(userDir, part.filename.replace(/\s/g, '_'));

    let stream = part;

    if (isGzip) {
      stream = zlib.createGunzip();
      part.pipe(stream);
    }

    let result;
    try {
      // eslint-disable-next-line no-await-in-loop
      result = await readStream(stream, index, username, splittedFields);
    } catch (e) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await fse.remove(filePath);
      } catch (err) {
        ctx.app.emit('error', err);
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

  const endTime = process.hrtime.bigint();

  ctx.type = 'json';
  ctx.body = {
    took: Math.ceil(Number((endTime - startTime) / 1000000n)),
    total,
    inserted,
    updated,
    failed,
    errors,
  };
  return appLogger.info(`[ec-upload] Insert into [${index}]`, ctx.body);
};
