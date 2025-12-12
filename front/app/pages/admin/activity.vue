<template>
  <div>
    <SkeletonPageBar
      :title="$t('menu.admin.activity')"
      :refresh="refresh"
      icons
    />

    <v-data-table-server
      :headers="headers"
      density="compact"
      item-key="id"
      v-bind="vDataTableOptions"
    >
      <template #top>
        <v-toolbar color="transparent">
          <div class="d-flex align-center text-h4 mx-4" style="gap: 1rem">
            <v-btn
              icon="mdi-arrow-left"
              color="primary"
              @click="addDayToCurrent(-1)"
            />

            <v-menu :close-on-content-click="false">
              <template #activator="{ props }">
                <div style="cursor: pointer;" v-bind="props">
                  {{ dateLabel }}
                </div>
              </template>

              <v-date-picker
                v-model="date"
                :max="DATE_MAX"
                multiple="range"
                show-adjacent-months
              />
            </v-menu>

            <v-btn
              :disabled="isNextPeriodDisabled"
              icon="mdi-arrow-right"
              color="primary"
              @click="addDayToCurrent(1)"
            />
          </div>

          <v-spacer />

          <v-combobox
            v-model="query.action"
            :label="$t('activity.action')"
            :items="availableActions"
            :return-object="false"
            prepend-inner-icon="mdi-lightning-bolt"
            variant="outlined"
            density="comfortable"
            item-value="value"
            auto-select-first="exact"
            hide-details
            clearable
            multiple
            class="mr-4"
            style="width: 15%"
            @update:model-value="refresh()"
          >
            <template #chip="{ item, index, props }">
              <v-chip
                v-if="index === 0"
                :text="item.title"
                size="small"
                label
                v-bind="props"
              />
              <span v-if="index === 1" class="text-grey text-caption">
                {{ $t('nbOthers', { count: query.action.length - 1 }) }}
              </span>
            </template>
          </v-combobox>

          <v-combobox
            v-model="query.username"
            :label="$t('activity.user')"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            multiple
            closable-chips
            class="mr-4"
            style="width: 15%"
            @update:model-value="refresh()"
          >
            <template #chip="{ item, props }">
              <v-chip
                :text="item.title"
                size="small"
                label
                v-bind="props"
              />
            </template>
          </v-combobox>
        </v-toolbar>
      </template>

      <template #[`item.datetime`]="{ item }">
        <LocalDate :model-value="item.datetime" format="Pp" />
      </template>

      <template #[`item.user.name`]="{ value, item }">
        <v-menu
          v-if="value"
          :close-on-content-click="false"
          location="end center"
          open-delay="100"
          max-width="800"
          open-on-hover
        >
          <template #activator="{ props }">
            <v-chip
              :text="value"
              prepend-icon="mdi-account"
              size="small"
              variant="outlined"
              v-bind="props"
            />
          </template>

          <ActivityUserCard :user="item.user">
            <template #actions>
              <v-btn
                :text="$t('filter')"
                prepend-icon="mdi-filter"
                color="primary"
                variant="text"
                density="comfortable"
                class="ml-2"
                @click="filterUser(value)"
              />
            </template>
          </ActivityUserCard>
        </v-menu>
      </template>

      <template #[`item.action`]="{ value }">
        <v-hover>
          <template #default="{ props, isHovering }">
            <div class="d-flex align-center" v-bind="props">
              <template v-if="$te(`activity.actions.${value}`)">
                {{ $t(`activity.actions.${value}`) }}
              </template>
              <template v-else>
                {{ value }}
              </template>

              <v-btn
                v-if="isHovering"
                icon="mdi-filter"
                color="primary"
                variant="text"
                size="x-small"
                density="comfortable"
                class="ml-2"
                @click="filterAction(value)"
              />
            </div>
          </template>
        </v-hover>
      </template>

      <template #[`item.response.status`]="{ value }">
        <v-chip
          v-if="value"
          :text="`${value}`"
          :color="httpStatusColors.get(value)?.color"
          :prepend-icon="httpStatusColors.get(value)?.icon"
          size="small"
        />
      </template>

      <template #[`item.details`]="{ item }">
        <ActivityItemDetails :model-value="item" />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-if="rawItemDialog"
          text="JSON"
          prepend-icon="mdi-code-json"
          variant="text"
          size="small"
          @click="rawItemDialog.open(item)"
        />
      </template>
    </v-data-table-server>

    <ActivityRawItemDialog ref="rawItemDialog" />
  </div>
</template>

<script setup>
import {
  parse,
  format,
  eachDayOfInterval,
  differenceInDays,
  addDays,
} from 'date-fns';

definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const DATE_FORMAT = 'yyyy-MM-dd';
const DATE_NOW = Date.now();
const DATE_MAX = format(DATE_NOW, 'yyyy-MM-dd');

const { t, locale } = useI18n();

const rawItemDialog = useTemplateRef('rawItemDialog');

const {
  query,
  refresh,
  itemLength,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/activity',
    transform: ({ items, total }) => {
      itemLength.value.current = total.value;
      if (!itemLength.value.total) {
        itemLength.value.total = total.value;
      }
      return items;
    },
  },
  data: {
    'datetime:from': format(DATE_NOW, DATE_FORMAT),
    'datetime:to': format(DATE_NOW, DATE_FORMAT),
    sortBy: [{ key: 'datetime', order: 'desc' }],
    search: undefined, // q parameter is not allowed
  },
});

/**
 * Query date as array of Date object
 */
const date = computed({
  get: () => eachDayOfInterval({
    start: parse(query.value['datetime:from'], DATE_FORMAT, DATE_NOW),
    end: parse(query.value['datetime:to'], DATE_FORMAT, DATE_NOW),
  }),
  set: (value) => {
    if (!Array.isArray(value)) {
      return;
    }

    const from = Math.min(...value);
    const to = Math.max(...value);
    query.value['datetime:from'] = format(from, DATE_FORMAT);
    query.value['datetime:to'] = format(to, DATE_FORMAT);
    if (query.value['datetime:from'] && query.value['datetime:to']) {
      query.value.page = 1;
      refresh();
    }
  },
});

const daysCount = computed(() => differenceInDays(date.value.at(-1), date.value.at(0)));

const dateLabel = computed(() => {
  const from = dateFormat(date.value.at(0), locale.value, 'PPP');
  if (query.value['datetime:from'] === query.value['datetime:to']) {
    return from;
  }

  const to = dateFormat(date.value.at(-1), locale.value, 'PPP');
  return `${from} ~ ${to}`;
});

const isNextPeriodDisabled = computed(
  () => differenceInDays(DATE_NOW, date.value.at(-1) || DATE_NOW) <= 0,
);

const headers = computed(() => [
  {
    title: t('date'),
    value: 'datetime',
    width: '180px',
    sortable: true,
  },
  {
    title: t('activity.user'),
    value: 'user.name',
    align: 'center',
    width: '250px',
    sortable: true,
  },
  {
    title: t('activity.action'),
    value: 'action',
    width: '300px',
    sortable: true,
  },
  {
    title: t('status'),
    value: 'response.status',
    width: '85px',
  },
  {
    title: t('activity.details'),
    value: 'details',
    sortable: false,
  },
  {
    title: t('actions'),
    value: 'actions',
    sortable: false,
    width: '85px',
    align: 'end',
  },
]);

const availableActions = computed(() => {
  const actions = [
    { header: 'users' },
    'user/register',
    'user/refresh',
    'user/connection',
    { header: 'files' },
    'file/upload',
    'file/list',
    'file/delete',
    'file/delete-many',
    { header: 'institutions' },
    'institutions/create',
    'institutions/update',
    'institutions/delete',
    'institutions/addMember',
    'institutions/removeMember',
    'institutions/import',
    { header: 'spaces' },
    'spaces/import',
    { header: 'exports' },
    'export/aggregate',
    'export/counter5',
    'events/delete',
    { header: 'indices' },
    'indices/tops',
    'indices/list',
    'indices/delete',
    'indices/search',
    'indices/insert',
    { header: 'sushi' },
    'sushi/create',
    'sushi/update',
    'sushi/delete',
    'sushi/delete-many',
    'sushi/download-report',
    'sushi/harvest',
    'sushi/import',
    'sushi/check-connection',
    { header: 'endpoints' },
    'endpoint/create',
    'endpoint/update',
    'endpoint/delete',
    'endpoint/import',
    { header: 'harvest' },
    'harvest-sessions/create',
    'harvest-sessions/upsert',
    'harvest-sessions/start',
    'harvest-sessions/delete',
    'harvest-sessions/stop',
    { header: 'reporting' },
    'reporting/index',
    'reporting/getDashboards',
    'reporting/list',
    'reporting/store',
    'reporting/update',
    'reporting/delete',
    'reporting/history',
  ];

  return actions.map((item) => {
    if (item.header) {
      // There's no way to add "headers", "groups" or "children" into a
      // VSelect (and other derivate), so headers are items with custom style
      return {
        title: t(`activity.actionTypes.${item.header}`),
        value: item,
        props: {
          disabled: true,
          style: {
            marginLeft: '-2.8rem',
          },
        },
      };
    }
    return {
      title: t(`activity.actions.${item}`),
      value: item,
    };
  });
});

function addDayToCurrent(modifier) {
  const offset = (daysCount.value * modifier) + modifier;

  date.value = [
    addDays(date.value.at(0), offset),
    addDays(date.value.at(-1), offset),
  ];
}

async function filterAction(action) {
  if (!query.value.action) {
    query.value.action = [];
  }
  if (!Array.isArray(query.value.action)) {
    query.value.action = [query.value.action];
  }
  const actions = new Set(query.value.action);
  actions.add(action);
  query.value.action = Array.from(actions);
  await refresh();
}

async function filterUser(username) {
  if (!query.value.username) {
    query.value.username = [];
  }
  if (!Array.isArray(query.value.username)) {
    query.value.username = [query.value.username];
  }
  const usernames = new Set(query.value.username);
  usernames.add(username);
  query.value.username = Array.from(usernames);
  await refresh();
}
</script>
