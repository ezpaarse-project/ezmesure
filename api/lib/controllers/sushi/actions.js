const isSameMonth = require('date-fns/isSameMonth');
const isLastDayOfMonth = require('date-fns/isLastDayOfMonth');
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth');
const format = require('date-fns/format');

const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');
const elastic = require('../../services/elastic');
const sushiService = require('../../services/sushi');
const publisherIndexTemplate = require('../../utils/publisher-template');
const { appLogger } = require('../../../server');

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { user } = ctx.state;

  if (!isAdmin(user)) {
    ctx.throw(403, 'You are not authorized to access this route');
    return;
  }

  ctx.body = await Sushi.findAll();
};

exports.getOne = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, 'Sushi item not found');
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage the sushi credentials of this institution');
      return;
    }
  }

  ctx.status = 200;
  ctx.body = sushiItem;
};

exports.addSushi = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findById(body.institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  if (!isAdmin(user)) {
    if (!institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage the sushi credentials of this institution');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  const sushiItem = new Sushi(body);
  await sushiItem.save();

  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;
  const { body } = ctx.request;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, 'Sushi item not found');
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage the sushi credentials of this institution');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  sushiItem.update(body);

  try {
    await sushiItem.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = sushiItem;
};

exports.deleteSushiData = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);

  if (!isAdmin(user)) {
    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage sushi credentials');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  const sushiItems = await Sushi.findManyById(body.ids);

  const response = await Promise.all(sushiItems.map(async (sushiItem) => {
    if (!isAdmin(user) && (sushiItem.getInstitutionId() !== institution.id)) {
      return { id: sushiItem.id, status: 'failed' };
    }


    try {
      await sushiItem.delete();
      return { id: sushiItem.id, status: 'deleted' };
    } catch (error) {
      appLogger.error('Failed to delete sushi data', error);
      return { id: sushiItem.id, status: 'failed' };
    }
  }));

  ctx.status = 200;
  ctx.body = response;
};

exports.fetchSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { body } = ctx.request;
  const { user } = ctx.state;
  const index = body.target;

  const sushi = await Sushi.findById(sushiId);

  if (!sushi) {
    ctx.throw(404, 'Sushi item not found');
    return;
  }

  const { body: perm } = await elastic.security.hasPrivileges({
    username: user.username,
    body: {
      index: [{ names: [index], privileges: ['write'] }],
    },
  }, {
    headers: { 'es-security-runas-user': user.username },
  });
  const canWrite = perm && perm.index && perm.index[index] && perm.index[index].write;

  if (!canWrite) {
    ctx.throw(403, `you don't have permission to write in ${index}`);
  }

  const { data: report } = await sushi.getReport();

  if (!report) {
    ctx.throw(502, 'Sushi endpoint returned an empty response');
  }

  const exceptions = sushiService.getExceptions(report);

  if (exceptions.length > 0) {
    const errors = exceptions.map((e) => e.Message);
    ctx.status = 502;
    ctx.body = { errors };
    return;
  }

  const { valid, errors } = sushiService.validateReport(report);

  if (!valid) {
    ctx.status = 502;
    ctx.body = { errors };
    return;
  }

  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    await elastic.indices.create({
      index,
      body: publisherIndexTemplate,
    });
  }

  const bulk = [];
  const response = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  const addError = (message) => {
    response.failed += 1;
    if (response.errors.length < 9) {
      response.errors.push(message);
    }
  };

  report.Report_Items.forEach((reportItem) => {
    if (!Array.isArray(reportItem.Item_ID)) {
      addError('Item has no Item_ID');
      return;
    }

    const item = {
      platform: reportItem.Platform,
      publication_title: reportItem.Title,
      publication_year: reportItem.YOP,
      publisher: reportItem.Publisher,
      data_type: reportItem.Data_Type,
      section_type: reportItem.Section_Type,
      access_type: reportItem.Access_Type,
      access_method: reportItem.Access_Method,
    };

    if (Array.isArray(reportItem.Item_Dates)) {
      reportItem.Item_Dates.forEach((itemDate) => {
        if (!itemDate) { return; }
        if (typeof itemDate.Type !== 'string') { return; }
        if (itemDate.Type.toLowerCase() === 'publication_date') {
          item.publication_date = itemDate.Value;
        }
      });
    }

    reportItem.Item_ID.forEach((identifier) => {
      if (!identifier) { return; }
      if (typeof identifier.Type !== 'string') { return; }

      switch (identifier.Type.toLowerCase()) {
        case 'doi':
          item.doi = identifier.value;
          break;
        case 'print_issn':
          item.print_identifier = identifier.value;
          break;
        case 'online_issn':
          item.online_identifier = identifier.value;
          break;
        default:
      }
    });

    reportItem.Performance.forEach((performance) => {
      if (!Array.isArray(performance.Instance)) { return; }

      const period = performance.Period;
      const beginDate = new Date(period.Begin_Date);
      const endDate = new Date(period.End_Date);

      if (!isSameMonth(beginDate, endDate)) {
        addError(`Item performance cover more than a month: ${beginDate} -> ${endDate}`);
        return;
      }
      if (!isFirstDayOfMonth(beginDate) || !isLastDayOfMonth(endDate)) {
        addError(`Item performance does not cover the entire month: ${beginDate} -> ${endDate}`);
        return;
      }

      const idFields = [
        'print_identifier',
        'online_identifier',
        'publication_date',
        'publication_year',
        'publication_title',
        'platform',
      ];

      const date = format(beginDate, 'yyyy-MM');
      const id = [date, ...idFields.map((f) => (item[f] || ''))].join('|');

      const itemPerf = { ...item, date };

      performance.Instance.forEach((instance) => {
        if (!instance) { return; }
        if (typeof instance.Metric_Type !== 'string') { return; }


        switch (instance.Metric_Type.toLowerCase()) {
          case 'unique_item_requests':
            itemPerf.uniqueItemRequests = instance.Count;
            break;
          case 'total_item_requests':
            itemPerf.totalItemRequests = instance.Count;
            break;
          case 'unique_item_investigations':
            itemPerf.uniqueItemInvestigations = instance.Count;
            break;
          case 'total_item_investigations':
            itemPerf.totalItemInvestigations = instance.Count;
            break;
          case 'unique_title_investigations':
            itemPerf.uniqueTitleInvestigations = instance.Count;
            break;
          case 'unique_title_requests':
            itemPerf.uniqueTitleRequests = instance.Count;
            break;
          default:
        }
      });

      bulk.push({ index: { _index: index, _id: id } });
      bulk.push(itemPerf);
    });
  });

  let bulkResult;

  if (bulk.length > 0) {
    try {
      const result = await elastic.bulk(
        { body: bulk },
        { headers: { 'es-security-runas-user': user.username } },
      );
      bulkResult = result.body;
    } catch (e) {
      throw new Error(e);
    }
  }

  const resultItems = (bulkResult && bulkResult.items) || [];

  resultItems.forEach((i) => {
    if (!i.index) {
      response.failed += 1;
    } else if (i.index.result === 'created') {
      response.inserted += 1;
    } else if (i.index.result === 'updated') {
      response.updated += 1;
    } else {
      if (response.errors.length < 10) {
        response.errors.push(i.index.error);
      }
      response.failed += 1;
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
