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

    const nbEC = yield readStream(stream, orgName);
    this.type = 'json';
    this.body = { read: nbEC };
    return;
  }

  let nbEC = 0;
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

    nbEC += yield readStream(stream, orgName);
  }

  this.type = 'json';
  this.body = { read: nbEC };
};

/**
 * Read a CSV stream and insert rows in elastic search
 * @param  {stream}   stream
 * @return {Promise}
 */
function readStream(stream, orgName) {
  const buffer = [];
  let nbEC = 0;
  let busy = false;

  const parser = csv.parse({ delimiter: ';', columns: true });

  return new Promise((resolve, reject) => {
    parser.on('readable', read);
    parser.on('error', err => { reject(err); });
    parser.on('finish', () => {
      elasticsearch.bulk({ body: buffer }, err => {
        if (err) { return reject(err); }
        resolve(nbEC);
      });
    });
    stream.on('error', err => { reject(err); });
    stream.pipe(parser);

    function read() {
      if (busy) { return; }

      let ec;
      while (ec = parser.read()) {
        nbEC++;

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

    function bulkInsert(callback) {
      if (buffer.length < bulkSize) { return callback(); }

      elasticsearch.bulk({ body: buffer.splice(0, bulkSize) }, err => {
        if (err) { return callback(err); }
        bulkInsert(callback);
      });
    }
  });
}
