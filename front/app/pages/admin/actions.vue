<template>
  <div>
    <SkeletonPageBar
      :title="$t('menu.actions.title')"
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
                {{ $t('nbOthers', { count: query.action.length - 1 }) }}
              </span>
            </template>
          </v-combobox>

          <v-combobox
            v-model="query.authorId"
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

      <template #[`item.date`]="{ item }">
        <LocalDate :model-value="item.date" format="Pp" />
      </template>

      <template #[`item.authorId`]="{ value, item }">
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

          <ActivityUserCard :user="item.author">
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

      <template #[`item.type`]="{ value }">
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

      <template #[`item.institution.name`]="{ item }">
        <nuxt-link :href="`/admin/institutions/${item.institution.id}`">
          {{ item.institution.name }}
        </nuxt-link>
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
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/actions',
    query: {
      include: [
        'institution',
        'author.elasticRoles',
        'author.memberships.repositoryPermissions',
        'author.memberships.repositoryAliasPermissions',
        'author.memberships.spacePermissions',
      ],
    },
  },
  data: {
    'date:from': format(DATE_NOW, DATE_FORMAT),
    'date:to': format(DATE_NOW, DATE_FORMAT),
    sortBy: [{ key: 'date', order: 'desc' }],
    search: undefined, // q parameter is not allowed
  },
});

/**
 * Query date as array of Date object
 */
const date = computed({
  get: () => eachDayOfInterval({
    start: parse(query.value['date:from'], DATE_FORMAT, DATE_NOW),
    end: parse(query.value['date:to'], DATE_FORMAT, DATE_NOW),
  }),
  set: (value) => {
    if (!Array.isArray(value)) {
      return;
    }

    const from = Math.min(...value);
    const to = Math.max(...value);
    query.value['date:from'] = format(from, DATE_FORMAT);
    query.value['date:to'] = format(to, DATE_FORMAT);
    if (query.value['date:from'] && query.value['date:to']) {
      query.value.page = 1;
      refresh();
    }
  },
});

const daysCount = computed(() => differenceInDays(date.value.at(-1), date.value.at(0)));

const dateLabel = computed(() => {
  const from = dateFormat(date.value.at(0), locale.value, 'PPP');
  if (query.value['date:from'] === query.value['date:to']) {
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
    value: 'date',
    width: '150px',
    sortable: true,
  },
  {
    title: t('activity.user'),
    value: 'authorId',
    align: 'center',
    width: '200px',
    sortable: true,
  },
  {
    title: t('activity.action'),
    value: 'type',
    width: '300px',
    sortable: true,
  },
  {
    title: t('institutions.institution.name'),
    value: 'institution.name',
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
    { header: 'sushi' },
    'sushi/delete',
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

async function filterAction(type) {
  if (!query.value.type) {
    query.value.type = [];
  }
  if (!Array.isArray(query.value.type)) {
    query.value.type = [query.value.type];
  }
  const types = new Set(query.value.type);
  types.add(type);
  query.value.type = Array.from(types);
  await refresh();
}

async function filterUser(authorId) {
  if (!query.value.authorId) {
    query.value.authorId = [];
  }
  if (!Array.isArray(query.value.authorId)) {
    query.value.authorId = [query.value.authorId];
  }
  const authorIds = new Set(query.value.authorId);
  authorIds.add(authorId);
  query.value.authorId = Array.from(authorIds);
  await refresh();
}
</script>
