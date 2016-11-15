import csv from 'csv';
import parse from 'co-busboy';
import zlib from 'zlib';
import elasticsearch from '../../services/elastic';

const bulkSize = 4000; // NB: 2000 docs at once (1 insert = 2 ops)

export default function* upload(orgName) {
  if (!this.request.is('multipart/*')) {
    const encoding = this.request.headers['content-encoding'];
    const isGzip   = encoding && encoding.toLowerCase().includes('gzip');

    let stream = this.req;

    if (isGzip) {
      stream = zlib.createGunzip();
      this.req.pipe(stream);
    }

    this.type = 'json';
    return this.body = yield readStream(stream, orgName);
  }

  let inserted = 0;
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

    const result = yield readStream(stream, orgName);

    inserted += result.inserted;
    failed   += result.failed;

    if (errors.length < 10) {
      errors = errors.concat(result.errors.splice(0, 10 - errors.length));
    }
  }

  this.type = 'json';
  this.body = { inserted, failed, errors };
};

/**
 * Read a CSV stream and insert rows in elastic search
 * @param  {stream}   stream
 * @return {Promise}
 */
function readStream(stream, orgName) {
  const buffer = [];
  const result = {
    inserted: 0,
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
    parser.on('readable', read);
    parser.on('error', err => { reject(err); });
    parser.on('finish', () => {
      bulkInsert(err => {
        if (err) { return reject(err); }
        resolve(result);
      }, true);
    });
    stream.on('error', err => { reject(err); });
    stream.pipe(parser);

    function read() {
      if (busy) { return; }

      let ec;
      while (ec = parser.read()) {
        ec.index_name = orgName;

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

        buffer.push({ index:  { _index: orgName, _type: 'event' } });
        buffer.push(ec);
      }

      if (buffer.length < bulkSize) { return; }

      busy = true;

      bulkInsert(err => {
        if (err) { return reject(err); }
        busy = false;
        read();
      });
    }

    function bulkInsert(callback, flush) {
      if (buffer.length < bulkSize && !(flush && buffer.length > 0)) {
        return callback();
      }

      elasticsearch.bulk({ body: buffer.splice(0, bulkSize) }, (err, resp) => {
        if (err) { return callback(err); }

        (resp.items || []).forEach(i => {
          if (!i.create) { return result.failed++; }
          if (!i.create.error) { return result.inserted++; }

          if (result.errors.length < 10) {
            result.errors.push(i.create.error);
          }

          result.failed++;
        });

        bulkInsert(callback);
      });
    }
  });
}
