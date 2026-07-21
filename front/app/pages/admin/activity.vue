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
          <div class="d-flex align-center text-headline-large mx-4" style="gap: 1rem">
            <v-btn
              icon="$mdi-arrow-left"
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
              icon="$mdi-arrow-right"
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
            prepend-inner-icon="$mdi-lightning-bolt"
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
              <span v-if="index === 1" class="text-grey text-body-small">
                {{ $t('nbOthers', { count: query.action.length - 1 }) }}
              </span>
            </template>
          </v-combobox>

          <v-combobox
            v-model="query.username"
            :label="$t('activity.user')"
            prepend-inner-icon="$mdi-account"
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
              prepend-icon="$mdi-account"
              size="small"
              variant="outlined"
              v-bind="props"
            />
          </template>

          <ActivityUserCard :user="item.user">
            <template #actions>
              <v-btn
                :text="$t('filter')"
                prepend-icon="$mdi-filter"
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
                icon="$mdi-filter"
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
          prepend-icon="$mdi-code-json"
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
} = useServerSidePagination({
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
    { value: 'users', type: 'subheader' },
    { value: 'user/register' },
    { value: 'user/refresh' },
    { value: 'user/connection' },

    { value: 'files', type: 'subheader' },
    { value: 'file/upload' },
    { value: 'file/list' },
    { value: 'file/delete' },
    { value: 'file/delete-many' },

    { value: 'institutions', type: 'subheader' },
    { value: 'institutions/create' },
    { value: 'institutions/update' },
    { value: 'institutions/delete' },
    { value: 'institutions/addMember' },
    { value: 'institutions/removeMember' },
    { value: 'institutions/import' },

    { value: 'spaces', type: 'subheader' },
    { value: 'spaces/import' },

    { value: 'exports', type: 'subheader' },
    { value: 'export/aggregate' },
    { value: 'export/counter5' },
    { value: 'events/delete' },

    { value: 'indices', type: 'subheader' },
    { value: 'indices/tops' },
    { value: 'indices/list' },
    { value: 'indices/delete' },
    { value: 'indices/search' },
    { value: 'indices/insert' },

    { value: 'sushi', type: 'subheader' },
    { value: 'sushi/create' },
    { value: 'sushi/update' },
    { value: 'sushi/delete' },
    { value: 'sushi/delete-many' },
    { value: 'sushi/download-report' },
    { value: 'sushi/harvest' },
    { value: 'sushi/import' },
    { value: 'sushi/check-connection' },

    { value: 'endpoints', type: 'subheader' },
    { value: 'endpoint/create' },
    { value: 'endpoint/update' },
    { value: 'endpoint/delete' },
    { value: 'endpoint/import' },

    { value: 'harvest', type: 'subheader' },
    { value: 'harvest-sessions/create' },
    { value: 'harvest-sessions/upsert' },
    { value: 'harvest-sessions/start' },
    { value: 'harvest-sessions/delete' },
    { value: 'harvest-sessions/stop' },

    { value: 'reporting', type: 'subheader' },
    { value: 'reporting/index' },
    { value: 'reporting/getDashboards' },
    { value: 'reporting/list' },
    { value: 'reporting/store' },
    { value: 'reporting/update' },
    { value: 'reporting/delete' },
    { value: 'reporting/history' },
  ];

  return actions.map(({ type, value }) => ({
    type,
    title: t(`activity.${type ? 'actionTypes' : 'actions'}.${value}`),
    value,
  }));
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
