<template>
  <div>
    <SkeletonPageBar
      :title="$t('menu.activity')"
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

            <v-menu
              v-model="isDatePickerOpen"
              :close-on-content-click="false"
            >
              <template #activator="{ props }">
                <div v-bind="props">
                  <LocalDate :model-value="date" format="PPP" />
                </div>
              </template>

              <v-date-picker
                v-model="date"
                :max="DATE_MAX"
                show-adjacent-months
                @update:model-value="isDatePickerOpen = false"
              />
            </v-menu>

            <v-btn
              :disabled="differenceInDays(DATE_NOW, date) <= 0"
              icon="mdi-arrow-right"
              color="primary"
              @click="addDayToCurrent(1)"
            />
          </div>

          <v-spacer />

          <v-combobox
            v-model="query.type"
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
                {{ $t('nbOthers', { count: query.type.length - 1 }) }}
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
  differenceInDays,
  addDays,
} from 'date-fns';

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'terms', 'admin'],
});

const DATE_FORMAT = 'yyyy-MM-dd';
const DATE_NOW = Date.now();
const DATE_MAX = format(DATE_NOW, 'yyyy-MM-dd');

const { t } = useI18n();

const isDatePickerOpen = ref(false);

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
    date: format(DATE_NOW, DATE_FORMAT),
    sortBy: [{ key: 'datetime', order: 'desc' }],
    search: undefined, // q parameter is not allowed
  },
});

/**
 * Query date as Date object
 */
const date = computed({
  get: () => parse(query.value.date, DATE_FORMAT, DATE_NOW),
  set: (value) => {
    query.value.date = format(value, DATE_FORMAT);
    query.value.page = 1;
    refresh();
  },
});

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
    // { header: 'users' },
    'user/register',
    'user/refresh',
    'user/connection',
    // { header: 'files' },
    'file/upload',
    'file/list',
    'file/delete',
    'file/delete-many',
    // { header: 'institutions' },
    'institutions/create',
    'institutions/update',
    'institutions/delete',
    'institutions/addMember',
    'institutions/removeMember',
    // { header: 'exports' },
    'export/aggregate',
    'export/counter5',
    'events/delete',
    // { header: 'indices' },
    'indices/tops',
    'indices/list',
    'indices/delete',
    'indices/search',
    'indices/insert',
    // { header: 'sushi' },
    'sushi/create',
    'sushi/update',
    'sushi/delete',
    'sushi/delete-many',
    'sushi/download-report',
    'sushi/harvest',
    'sushi/import',
    'sushi/check-connection',
    // { header: 'endpoints' },
    'endpoint/create',
    'endpoint/update',
    'endpoint/delete',
    'endpoint/import',
    // { header: 'reporting' },
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
      return { header: t(`activity.actionTypes.${item.header}`) };
    }
    return {
      title: t(`activity.actions.${item}`),
      value: item,
    };
  });
});

function addDayToCurrent(amount) {
  date.value = addDays(date.value, amount);
}

async function filterAction(action) {
  if (!query.value.type) {
    query.value.type = [];
  }
  if (!Array.isArray(query.value.type)) {
    query.value.type = [query.value.type];
  }
  const actions = new Set(query.value.type);
  actions.add(action);
  query.value.type = Array.from(actions);
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
