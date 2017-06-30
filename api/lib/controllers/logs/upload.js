const crypto = require('crypto');
const csv    = require('csv');
const parse  = require('co-busboy');
const zlib   = require('zlib');
const config = require('config');

const elasticsearch = require('../../services/elastic');
const { appLogger } = require('../../../server');

const bulkSize = 4000; // NB: 2000 docs at once (1 insert = 2 ops)
const prefix   = config.elasticsearch.indicePrefix;

module.exports = function* upload(orgName) {
  const username = this.state.user.username;
  const result   = yield elasticsearch.hasPrivileges(username, [orgName], ['write']);
  const canWrite = result && result.index && result.index[orgName] && result.index[orgName].write;

  if (!canWrite) {
    return this.throw(`you don't have permission to write in ${orgName}`, 403);
  }

  const exists = yield elasticsearch.indices.exists({ index: orgName });

  if (!exists) {
    yield createIndex(orgName);
  }

  if (!this.request.is('multipart/*')) {
    const encoding = this.request.headers['content-encoding'];
    const isGzip   = encoding && encoding.toLowerCase().includes('gzip');

    let stream = this.req;

    if (isGzip) {
      stream = zlib.createGunzip();
      this.req.pipe(stream);
    }

    this.type = 'json';
    this.body = yield readStream(stream, orgName, username);
    return appLogger.info(`Insert into [${orgName}]`, this.body);
  }

  let total    = 0;
  let inserted = 0;
  let updated  = 0;
  let failed   = 0;
  let errors   = [];
  let part;

  const parts = parse(this);

  while (part = yield parts) {
    if (part.length) { continue; }

    const isGzip = part.mime && part.mime.toLowerCase().includes('gzip');

    let stream = part;

    if (isGzip) {
      stream = zlib.createGunzip();
      part.pipe(stream);
    }

    const result = yield readStream(stream, orgName, username);

    total    += result.total;
    inserted += result.inserted;
    updated  += result.updated;
    failed   += result.failed;

    if (errors.length < 10) {
      errors = errors.concat(result.errors.splice(0, 10 - errors.length));
    }
  }

  this.type = 'json';
  this.body = { total, inserted, failed, errors };
  return appLogger.info(`Insert into [${orgName}]`, this.body);
};

/**
 * Read a CSV stream and insert rows in elastic search
 * @param  {stream}   stream
 * @return {Promise}
 */
function readStream(stream, orgName, username) {
  const buffer = [];
  const result = {
    total: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: []
  };
  let busy = false;

  const parser = csv.parse({
    'delimiter': ';',
    'columns': true,
    'relax_column_count': true
  });

  return new Promise((resolve, reject) => {
    let doneReading = false;

    parser.on('readable', read);
    parser.on('error', err => { reject(err); });
    parser.on('finish', () => {
      doneReading = true;
      if (busy) { return; }

      bulkInsert(err => {
        if (err) { return reject(err); }
        resolve(result);
      });
    });
    stream.on('error', err => { reject(err); });
    stream.pipe(parser);

    function read() {
      if (busy) { return; }

      let ec;
      while (ec = parser.read()) {
        result.total++;
        ec.index_name = orgName;

        if (!ec.datetime && !ec.timestamp) {
          addError({ reason: 'missing datetime or timestamp' });
          result.failed++;
          continue;
        }

        let docID = ec['log_id'];

        if (!docID) {
          const timestamp = parseInt(ec.timestamp) || new Date(ec.datetime).getTime();

          if (isNaN(timestamp)) {
            addError({
              reason: ec.datetime
                ? `invalid datetime: ${ec.datetime}`
                : `invalid timestamp: ${ec.timestamp}`
            });
            result.failed++;
            continue;
          }

          if (!ec.url) {
            addError({ reason: 'url is missing' });
            result.failed++;
            continue;
          }

          docID = crypto.createHash('sha1')
                        .update(`${timestamp}${ec.url}${ec.login || ''}`)
                        .digest('hex');
        }

        if (ec['geoip-longitude'] && ec['geoip-latitude']) {
          ec.location = {
            lat: parseFloat(ec['geoip-latitude']),
            lon: parseFloat(ec['geoip-longitude'])
          }
        }

        // remove useless empty values
        for (const p in ec) {
          if (!ec[p]) { ec[p] = undefined; }
        }

        buffer.push({ index: { _id: docID, _index: orgName, _type: 'event' } });
        buffer.push(ec);
      }

      if (buffer.length < bulkSize) { return; }

      busy = true;

      bulkInsert(err => {
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

      elasticsearch.bulk({
        body: buffer.splice(0, bulkSize),
        headers: { 'es-security-runas-user': username }
      }, (err, resp) => {
        if (err) { return callback(err); }

        (resp.items || []).forEach(i => {
          if (!i.index) { return result.failed++; }

          if (i.index.result === 'created') { return result.inserted++; };
          if (i.index.result === 'updated') { return result.updated++; };

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
 * Create an index with a prefix and an alias without it
 * @param  {String}  indexName
 * @return {Promise}
 */
function createIndex(indexName) {
  return elasticsearch.indices.create({
    index: `${prefix}${indexName}`,
    body: {
      aliases: {
        [indexName]: {}
      }
    }
  });
}