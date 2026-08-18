const { ofetch } = require('ofetch');

const { appLogger } = require('./logger');
const elastic = require('./elastic');
const prisma = require('./prisma');

const RepositoriesService = require('../entities/repositories.service');

const { repository } = require('../../package.json');

/**
 * Get repository identifier
 *
 * @returns {string | null} The identifier or `null` if not found
 */
function getRepoIdentifier() {
  const url = URL.parse(repository.url);

  return url?.pathname
    ?.replace(/\.git$/ui, '')
    ?.slice(1);
}

/**
 * Extract total count of items in GitHub response
 *
 * From https://stackoverflow.com/a/70610670
 *
 * @param {string | null} header - The "link" header
 *
 * @returns {number | null} The count extracted from header
 */
function extractGHTotalCount(header) {
  const matches = /<https:\/\/.+&page=(\d+)>/ui.exec(header);
  return Number.parseInt(matches[1], 10);
}

/**
 * Fetch stats from GitHub repository
 *
 * @returns {Promise<Record<string, unknown> | undefined>} The resolved stats
 */
async function fetchGitHubStats() {
  try {
    const id = getRepoIdentifier();

    const [repo, contributorsResponse] = await Promise.all([
      ofetch(`/repos/${id}`, {
        baseURL: 'https://api.github.com/',
        headers: {
          accept: 'application/json',
        },
      }),
      ofetch.raw(`/repos/${id}/contributors`, {
        baseURL: 'https://api.github.com/',
        headers: {
          accept: 'application/json',
        },
        query: {
          per_page: 1,
          page: 1,
        },
      }),
    ]);

    const contributorsCount = extractGHTotalCount(contributorsResponse.headers.get('link'));

    return {
      stars: repo.stargazers_count,
      issues: repo.open_issues,
      contributors: contributorsCount,
      updatedAt: repo.pushed_at,
    };
  } catch (err) {
    appLogger.warn(`[metric]: Unable to fetch stats of git: ${err.message}`);
    return undefined;
  }
}

/**
 * Fetch stats from Git repository
 *
 * @returns {Promise<Record<string, unknown> | undefined>} The resolved stats
 */
async function calcGitStats() {
  if (repository.url.includes('github.com')) {
    return fetchGitHubStats();
  }
  return undefined;
}

/**
 * Fetch stats of ElasticSearch cluster
 *
 * @returns {Promise<Record<string, unknown>>} The resolved stats
 */
async function fetchESClusterStats() {
  try {
    const { body: { indices, nodes } } = await elastic.cluster.stats();

    return {
      indices: indices.count,
      docs: indices.docs.count,
      fsUsed: nodes.fs.total_in_bytes - nodes.fs.available_in_bytes,
      fsAvailable: nodes.fs.available_in_bytes,
    };
  } catch (err) {
    appLogger.error(`[metric]: Unable to fetch stats of cluster: ${err.message}`);
    throw err;
  }
}

/**
 * Get aggregations to use for metrics about repositories
 *
 * @param {'ezpaarse' | 'counter5'} type - The type of Repository
 *
 * @returns {Record<string, unknown> | undefined} The aggregations
 */
function getESAggsOfRepositoryType(type) {
  if (type === 'ezpaarse') {
    return {
      events: { cardinality: { field: '_id' } },
      titles: { cardinality: { field: 'publication_title' } },
      platforms: { cardinality: { field: 'platform' } },
      maxDate: { max: { field: 'datetime' } },
      minDate: { min: { field: 'datetime' } },
    };
  }
  if (type === 'counter5') {
    return {
      events: { sum: { field: 'Count' } },
      platforms: { cardinality: { field: 'X_Endpoint_ID' } },
      maxDate: { max: { field: 'X_Date_Month' } },
      minDate: { min: { field: 'X_Date_Month' } },
    };
  }
  return undefined;
}

/**
 * Fetch stats of Repositories in ElasticSearch cluster
 *
 * @returns {Promise<Record<string, unknown>>} The resolved stats
 */
async function fetchESRepositoriesStats() {
  try {
    // Get repositories by type
    const repositories = new RepositoriesService();
    const reposPerType = Object.groupBy(
      await repositories.findMany({ select: { type: true, pattern: true } }),
      (repo) => repo.type,
    );

    const m = elastic.helpers.msearch({
      operations: Object.keys(reposPerType).length,
    });

    const entries = await Promise.all(
      Object.entries(reposPerType)
        .map(async ([type, repos]) => {
          // Resolve indices and aggregations
          const indices = repos?.map(({ pattern }) => pattern);
          const aggs = getESAggsOfRepositoryType(type);
          if (!indices || indices.length <= 0 || !aggs) {
            return [type, undefined];
          }

          // Query ES
          const { body: { aggregations: result } } = await m.search(
            { index: indices, ignore_unavailable: true },
            { size: 0, aggs },
          );

          if (!result) {
            return [type, undefined];
          }

          // Map results
          let date;
          if (result.minDate || result.maxDate) {
            date = {
              min: result.minDate ? new Date(result.minDate.value) : undefined,
              max: result.maxDate ? new Date(result.maxDate.value) : undefined,
            };
          }

          return [type, {
            count: repos.length,
            events: result.events?.value ?? undefined,
            titles: result.titles?.value ?? undefined,
            platforms: result.platforms?.value ?? undefined,
            date,
          }];
        }),
    ).finally(() => m.stop());

    return Object.fromEntries(entries);
  } catch (err) {
    appLogger.error(`[metric]: Unable to fetch stats of repositories: ${err.message}`);
    throw err;
  }
}

/**
 * Calculate metrics of connected cluster
 *
 * @returns {Promise<Record<string, unknown>>} The resolved metrics
 */
async function calcESMetrics() {
  const [
    stats,
    repositories,
  ] = await Promise.all([
    fetchESClusterStats(),
    fetchESRepositoriesStats(),
  ]);

  return {
    stats,
    repositories,
  };
}

/**
 * Calculate metrics of connected database
 *
 * @returns {Promise<Record<string, unknown>>} The resolved metrics
 */
async function calcDBMetrics() {
  const metrics = {};

  // Get various counts
  try {
    const [
      institutions,
      spaces,
      users,
      sushiEndpoints,
    ] = await prisma.client.$transaction([
      prisma.client.institution.count({
        select: { id: true },
        where: {
          validated: true,
          hidePartner: false,
        },
      }),
      prisma.client.space.count({
        select: { id: true },
        where: {
          institution: { validated: true },
        },
      }),
      prisma.client.user.count({
        select: { id: true },
      }),
      prisma.client.sushiEndpoint.count({
        select: { id: true },
        where: {
          active: true,
        },
      }),
    ]);

    metrics.institutions = institutions.id;
    metrics.spaces = spaces.id;
    metrics.users = users.id;
    metrics.sushiEndpoints = sushiEndpoints.id;
  } catch (err) {
    appLogger.error(`[metric]: Unable to fetch stats of database: ${err.message}`);
    throw err;
  }

  return metrics;
}

/**
 * Calculate metrics of current instance
 *
 * @returns {Promise<Record<string, unknown>>} The resolved metrics
 */
async function calcMetrics() {
  const start = new Date();
  appLogger.info('[metric]: Get metric is started');

  const [cluster, counts, git] = await Promise.all([
    calcESMetrics(),
    calcDBMetrics(),
    calcGitStats(),
  ]);

  const took = Date.now() - start.getTime();
  const used = (cluster.stats.fsUsed / cluster.stats.fsAvailable).toFixed(4);
  appLogger.info(`[metric]: took: ${took} | docs: ${cluster.stats.docs} | indices: ${cluster.stats.indices} | fs: ${used}`);

  return {
    took,
    createdAt: start,
    cluster,
    counts,
    git,
  };
}

let metricsPromise;
/**
 * Get metrics, calculate them if not yet available
 *
 * @param {boolean} [refresh] - Force refresh of metrics
 *
 * @returns The metrics
 */
async function getMetrics(refresh = false) {
  if (!metricsPromise || refresh) {
    metricsPromise = calcMetrics()
      .catch((error) => {
        metricsPromise = undefined;
        return { error: `${error}` };
      });
  }

  return metricsPromise;
}

module.exports = {
  getMetrics,
};
