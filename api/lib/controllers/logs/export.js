
const { PassThrough } = require('stream');
const crypto = require('crypto');
const Papa = require('papaparse');
const elastic = require('../../services/elastic');

exports.aggregate = async function aggregate(ctx) {
  const { index, extension } = ctx.request.params;
  const {
    fields: rawFields = '',
    from,
    to,
    platform,
    delimiter = ';',
  } = ctx.request.query;
  ctx.action = 'export/aggregate';

  ctx.type = extension === 'csv' ? 'text/csv' : 'application/x-ndjson';
  ctx.attachment(`aggregation.${extension}`);

  const aggregatedFields = rawFields.split(',').map((f) => f.trim()).filter((f) => f);
  const csvColumns = ['doc_count', ...aggregatedFields];

  if (aggregatedFields.length === 0) {
    ctx.throw(400, 'missing mandatory "fields" param');
    return;
  }

  const filter = [];

  if (platform) {
    filter.push({ term: { platform } });
  }

  if (from || to) {
    filter.push({
      range: {
        datetime: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  ctx.body = new PassThrough();

  if (extension === 'csv') {
    ctx.body.write(Papa.unparse([csvColumns], {
      delimiter: delimiter === 'tab' ? '\t' : delimiter,
      newline: '\n',
    }));
    ctx.body.write('\n');
  }

  async function nextPage(nextKey) {
    const { body: result } = await elastic.search({
      index,
      body: {
        size: 0,
        query: filter.length > 0 ? { bool: { filter } } : undefined,
        aggs: {
          main: {
            composite: {
              size: 1000,
              sources: aggregatedFields.map((field) => ({ [field]: { terms: { field } } })),
              after: nextKey,
            },
          },
        },
      },
      timeout: '30s',
    }, {
      headers: { 'es-security-runas-user': ctx.state.user.username },
    });

    const aggregations = result && result.aggregations && result.aggregations;
    const buckets = aggregations && aggregations.main && aggregations.main.buckets;
    const afterKey = aggregations && aggregations.main && aggregations.main.after_key;

    if (extension === 'csv') {
      const docs = buckets.map((b) => ({ ...b.key, doc_count: b.doc_count }));
      ctx.body.write(Papa.unparse(docs, {
        delimiter: delimiter === 'tab' ? '\t' : delimiter,
        newline: '\n',
        header: false,
        columns: csvColumns,
      }));
    } else {
      ctx.body.write(buckets.map((bucket) => JSON.stringify(bucket)).join('\n'));
    }
    const isWritable = ctx.body.write('\n');

    if (!isWritable) {
      await new Promise((resolve) => ctx.body.once('drain', resolve));
    }

    if (afterKey) {
      await nextPage(afterKey);
    }
  }

  nextPage().catch((e) => {
    ctx.body.destroy(e);
  }).then(() => {
    ctx.body.end();
  });
};

exports.counter5 = async function counter5(ctx) {
  ctx.action = 'export/counter5';
  ctx.type = 'json';

  const { username } = ctx.state.user;
  const { index: sourceIndex } = ctx.request.params;
  const {
    from,
    to,
    platform,
    destination: destIndex,
    sessionField = 'session',
  } = ctx.request.body;

  let nextKey;
  const requestRtypes = new Set(['ARTICLE', 'BOOK', 'BOOK_SECTION']);
  const investigationRtypes = new Set(['PREVIEW', 'ABS', 'REF', 'OPENURL', 'LINK']);

  const startTime = process.hrtime.bigint();
  const responseBody = {
    total: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  const { body: perm } = await elastic.security.hasPrivileges({
    username,
    body: {
      index: [
        { names: [sourceIndex], privileges: ['read'] },
        { names: [destIndex], privileges: ['write'] },
      ],
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });

  const canRead = perm && perm.index && perm.index[sourceIndex] && perm.index[sourceIndex].read;
  const canWrite = perm && perm.index && perm.index[destIndex] && perm.index[destIndex].write;

  if (!canRead) {
    ctx.throw(403, `you don't have permission to read in ${sourceIndex}`);
    return;
  }
  if (!canWrite) {
    ctx.throw(403, `you don't have permission to write in ${destIndex}`);
    return;
  }

  const { body: exists } = await elastic.indices.exists({ index: destIndex });

  if (!exists) {
    await elastic.indices.create({
      index: destIndex,
      body: {
        settings: {
          number_of_shards: 1,
        },
        mappings: {
          dynamic_templates: [
            {
              strings_as_keywords: {
                match_mapping_type: 'string',
                mapping: {
                  type: 'keyword',
                },
              },
            },
          ],
          properties: {
            print_identifier: { type: 'keyword' },
            online_identifier: { type: 'keyword' },
            publication_date: { type: 'keyword' },
            publication_title: { type: 'keyword' },
            platform: { type: 'keyword' },
            totalItemInvestigations: { type: 'integer' },
            totalItemRequests: { type: 'integer' },
            date: { type: 'date', format: 'yyyy-MM' },
          },
        },
      },
    });
  }

  const filter = [{
    terms: {
      rtype: [...requestRtypes, ...investigationRtypes],
    },
  }];

  if (platform) {
    filter.push({ term: { platform } });
  }

  if (from || to) {
    filter.push({
      range: {
        datetime: {
          gte: from,
          lte: to,
          format: 'yyyy-MM',
        },
      },
    });
  }

  const fields = [
    'print_identifier',
    'online_identifier',
    'publication_date',
    'publication_title',
    'platform',
  ];

  do {
    // eslint-disable-next-line no-await-in-loop
    const { body: result } = await elastic.search({
      index: sourceIndex,
      body: {
        size: 0,
        query: {
          bool: { filter },
        },
        aggs: {
          main: {
            composite: {
              size: 1000,
              after: nextKey,
              sources: [
                { date: { date_histogram: { field: 'datetime', calendar_interval: '1M', format: 'yyyy-MM' } } },
                ...fields.map((field) => ({ [field]: { terms: { field, missing_bucket: true } } })),
              ],
            },
            aggregations: {
              uniqueItems: {
                cardinality: {
                  precision_threshold: 3000,
                  script: {
                    lang: 'painless',
                    source: `
                      if (doc.containsKey(params.sessionField) && doc.containsKey('unitid')) {
                        return doc[params.sessionField].value + '_' + doc['unitid'].value;
                      } else {
                        return null;
                      }
                    `,
                    params: {
                      sessionField,
                    },
                  },
                },
              },
              requests: {
                filter: { terms: { rtype: [...requestRtypes] } },
                aggregations: {
                  uniqueItems: {
                    cardinality: {
                      precision_threshold: 3000,
                      script: {
                        lang: 'painless',
                        source: `
                          if (doc.containsKey(params.sessionField) && doc.containsKey('unitid')) {
                            return doc[params.sessionField].value + '_' + doc['unitid'].value;
                          } else {
                            return null;
                          }
                        `,
                        params: {
                          sessionField,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      timeout: '30s',
    }, {
      headers: { 'es-security-runas-user': username },
    });

    const aggregations = result && result.aggregations && result.aggregations;
    const buckets = aggregations && aggregations.main && aggregations.main.buckets;
    nextKey = (aggregations && aggregations.main && aggregations.main.after_key) || null;

    responseBody.total += buckets.length;

    const bulkItems = buckets.reduce((acc, bucket) => {
      const id = [
        bucket.key.date,
        ...fields.map((f) => (bucket.key[f] || '')),
      ].join('|');

      acc.push({
        index: {
          _index: destIndex,
          _id: crypto.createHash('sha1').update(id).digest('hex'),
        },
      });

      const { uniqueItems = {}, requests = {} } = bucket;

      acc.push({
        ...bucket.key,
        totalItemInvestigations: bucket.doc_count,
        totalItemRequests: requests.doc_count,
        uniqueItemInvestigations: uniqueItems.value,
        uniqueItemRequests: requests.uniqueItems && requests.uniqueItems.value,
      });
      return acc;
    }, []);

    if (bulkItems.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      const { body: bulkResult } = await elastic.bulk(
        { body: bulkItems },
        { headers: { 'es-security-runas-user': username } },
      );

      (bulkResult.items || []).forEach((i) => {
        if (!i.index) {
          responseBody.failed += 1;
        } else if (i.index.result === 'created') {
          responseBody.inserted += 1;
        } else if (i.index.result === 'updated') {
          responseBody.updated += 1;
        } else {
          if (result.errors.length < 10) {
            responseBody.errors.push(i.index.error);
          }
          responseBody.failed += 1;
        }
      });
    }
  } while (nextKey);

  const endTime = process.hrtime.bigint();
  responseBody.took = Math.ceil(Number((endTime - startTime) / 1000000n));

  ctx.status = 200;
  ctx.body = responseBody;
};
