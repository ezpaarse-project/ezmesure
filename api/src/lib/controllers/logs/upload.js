import csv from 'csv';
import parse from 'co-busboy';
import elasticsearch from '../../services/elastic';

const bulkSize = 1000;

export default function* upload(orgName) {
  if (!this.request.is('multipart/*')) {
    const nbEC = yield readStream(this.req, orgName);
    this.type = 'json';
    this.body = { read: nbEC };
    return;
  }

  let nbEC = 0;
  let part;

  const parts = parse(this);

  while (part = yield parts) {
    if (part.length) { return; }

    nbEC += yield readStream(part, orgName);
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
    parser.on('error', err => { throw err });
    parser.on('finish', () => {
      elasticsearch.bulk({ body: buffer }, err => {
        if (err) { return reject(err); }
        resolve(nbEC);
      });
    });
    stream.pipe(parser);

    function read() {
      if (busy) { return; }

      let ec;
      while (ec = parser.read()) {
        nbEC++;

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
