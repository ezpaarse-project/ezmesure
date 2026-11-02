<template>
  <div>
    <SkeletonPageBar
      v-model:search="search"
      :title="$t('institutions.harvestable.title')"
      :loading="status === 'pending'"
      :refresh="refresh"
      icons
    >
      <v-menu :close-on-content-click="false" width="600">
        <template #activator="{ props }">
          <v-btn
            v-tooltip="$t('institutions.harvestable.settings')"
            icon="$mdi-cog"
            variant="tonal"
            density="comfortable"
            color="primary"
            class="mr-2"
            v-bind="props"
          />
        </template>

        <v-card
          :title="$t('institutions.harvestable.settings')"
          prepend-icon="$mdi-cog"
        >
          <template #text>
            <v-row>
              <v-col cols="6">
                <v-switch
                  v-model="allowNotReady"
                  :label="$t('institutions.harvestable.allowNotReady')"
                  color="primary"
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="allowFaulty"
                  :label="$t('institutions.harvestable.allowFaulty')"
                  color="primary"
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="allowHarvested"
                  :label="$t('institutions.harvestable.allowHarvested')"
                  color="primary"
                />
              </v-col>
              <v-col cols="6">
                <MonthPickerField
                  v-model="harvestedMonth"
                  :label="$t('institutions.harvestable.harvestedMonth')"
                  :max="MAX_PERIOD"
                  variant="underlined"
                  density="compact"
                  hide-details
                  clearable
                />
              </v-col>
            </v-row>
          </template>
        </v-card>
      </v-menu>
    </SkeletonPageBar>

    <v-container fluid>
      <v-row v-if="!data">
        <v-col v-for="i in 2" :key="i" cols="3">
          <v-skeleton-loader
            height="64"
            type="list-item-avatar"
          />
        </v-col>
      </v-row>

      <v-slide-y-transition>
        <v-row v-if="data">
          <v-col cols="4">
            <SimpleMetric
              :value="eligibleInstitutions.length"
              :title="$t('institutions.harvestable.eligibleInstitutions')"
            >
              <template #icon>
                <v-menu
                  location="start center"
                  offset="5"
                  open-delay="50"
                  open-on-hover
                >
                  <template #activator="{ props: menu }">
                    <ProgressCircularStack
                      :model-value="loaders"
                      size="40"
                      class="mr-2"
                      v-bind="menu"
                    />
                  </template>

                  <v-sheet min-width="300">
                    <v-table density="comfortable">
                      <tbody>
                        <tr>
                          <th colspan="2">
                            {{ $t('institutions.harvestable.institutions', data.length) }}
                          </th>
                        </tr>

                        <template v-for="row in table">
                          <tr v-if="row.value > 0" :key="row.key">
                            <td>
                              <v-icon
                                v-if="row.icon"
                                :icon="row.icon"
                                :color="row.color"
                                start
                              />

                              {{ row.label }}
                            </td>

                            <td class="text-right">
                              {{ row.value }} ({{ row.percent }})
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </v-table>
                  </v-sheet>
                </v-menu>
              </template>

              <template #actions>
                <v-btn
                  :text="$t('select')"
                  :disabled="eligibleInstitutions.length <= 0"
                  :loading="status === 'pending'"
                  size="small"
                  variant="outlined"
                  @click="selected = eligibleInstitutions.map(({ id }) => id)"
                />
              </template>
            </SimpleMetric>
          </v-col>
        </v-row>
      </v-slide-y-transition>
    </v-container>

    <v-data-table
      v-model="selected"
      v-model:items-per-page="itemsPerPageStored"
      :items="data"
      :loading="status === 'pending' && 'primary'"
      :headers="headers"
      :search="search"
      :sort-by="[{ key: 'status', order: 'desc' }, { key: 'institution.name', order: 'asc' }]"
      :items-per-page-options="[10, 25, 50, 100]"
      item-value="institution.id"
      show-select
    >
      <template #[`item.institution._count.memberships`]="{ item, value }">
        <v-chip
          :text="`${value}`"
          :to="`/admin/institutions/${item.institution.id}/members`"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="$mdi-account-multiple"
          size="small"
        />
      </template>

      <template #[`item.institution._count.repositories`]="{ value, item }">
        <v-chip
          v-tooltip:top="{ disabled: !!value, text: $t('institutions.harvestable.tooltips.noRepositories') }"
          :text="`${value}`"
          :color="!value ? 'red' : undefined"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="$mdi-database-outline"
          size="small"
          @click="institutionRepositoriesDialogRef?.open(item.institution)"
        />
      </template>

      <template #[`item.institution._count.spaces`]="{ value, item }">
        <v-chip
          v-tooltip:top="{ disabled: !!value, text: $t('institutions.harvestable.tooltips.noSpaces') }"
          :text="`${value}`"
          :color="!value ? 'orange' : undefined"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="$mdi-tab"
          size="small"
          @click="institutionSpacesDialogRef?.open(item.institution)"
        />
      </template>

      <template #[`item.institution._count.sushiCredentials`]="{ value, item }">
        <v-chip
          v-tooltip:top="{ disabled: !!value, text: $t('institutions.harvestable.tooltips.noCredentials') }"
          :text="`${value}`"
          :to="`/admin/institutions/${item.institution.id}/sushi`"
          :color="!value ? 'orange' : undefined"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="$mdi-key"
          size="small"
        />
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          v-if="item.harvested"
          v-tooltip:top="$t('institutions.harvestable.tooltips.isHarvested')"
          :text="$t('institutions.harvestable.status.harvested')"
          prepend-icon="$mdi-cloud"
          color="blue"
        />

        <v-chip
          v-else-if="item.harvestable.value && item.eligible.value"
          :text="$t('institutions.harvestable.status.eligible')"
          prepend-icon="$mdi-check"
          color="green"
        />

        <v-menu
          v-else
          :disabled="(item.eligible.reasons.length + item.harvestable.reasons.length) <= 0"
          :close-on-content-click="false"
          open-on-hover
        >
          <template #activator="{ props, isActive }">
            <v-chip
              v-if="item.harvestable.value"
              :text="$t('institutions.harvestable.status.non-eligible')"
              :append-icon="isActive ? '$mdi-chevron-up' : '$mdi-chevron-down'"
              prepend-icon="$mdi-close"
              color="grey"
              v-bind="props"
            />
            <v-chip
              v-else
              :text="$t('institutions.harvestable.status.non-harvestable')"
              :append-icon="isActive ? '$mdi-chevron-up' : '$mdi-chevron-down'"
              prepend-icon="$mdi-alert"
              variant="flat"
              color="red"
              v-bind="props"
            />
          </template>

          <v-list density="compact" slim>
            <v-list-item
              v-for="reason of item.eligible.reasons"
              :key="reason"
              :title="$t(`sushi.isNotEligible.reasons.${reason}`)"
              :prepend-icon="REASONS_ICONS.get(reason) || '$mdi-alert'"
              :class="`text-${REASONS_COLORS.get(reason)}`"
            />
            <v-list-item
              v-for="reason of item.harvestable.reasons"
              :key="reason"
              :title="$t(`sushi.isNotHarvestable.reasons.${reason}`)"
              :prepend-icon="REASONS_ICONS.get(reason) || '$mdi-alert'"
              :class="`text-${REASONS_COLORS.get(reason)}`"
            />
          </v-list>
        </v-menu>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="$mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="$mdi-identifier"
              @click="copyInstitutionId(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <SelectionMenu
      v-model="selected"
      :text="$t('institutions.manageN', selected.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('users.createMailUserList', 2)"
          prepend-icon="$mdi-email-multiple"
          @click="copyMailList()"
        />

        <v-list-item
          v-if="harvestSessionFormDialogRef"
          :title="$t('harvest.sessions.form.title:add')"
          prepend-icon="$mdi-tractor"
          @click="harvestSessionFormDialogRef.open({
            credentialsQuery: { institutionIds: selected },
          })"
        />
      </template>
    </SelectionMenu>

    <InstitutionRepositoriesDialog
      ref="institutionRepositoriesDialogRef"
      @update:model-value="refresh()"
    />

    <InstitutionSpacesDialog
      ref="institutionSpacesDialogRef"
      @update:model-value="refresh()"
    />

    <SushiHarvestSessionFormDialog
      ref="harvestSessionFormDialogRef"
      @submit="navigateTo('/admin/harvests')"
    />

    <InstitutionEmailsCopyDialog ref="emailsCopyDialogRef" />
  </div>
</template>

<script setup>
import { formatDate } from 'date-fns';

const MAX_PERIOD = formatDate(new Date(), 'yyyy-MM');

const REASONS_COLORS = new Map([
  ['institutionHasNoRepositories', 'red'],
]);

const REASONS_ICONS = new Map([
  ['institutionIsNotReady', '$mdi-text-box-remove-outline'],
  ['institutionHasNoCredentials', '$mdi-key-alert-outline'],
  ['institutionHasFaultyCredentials', '$mdi-bell-alert'],
  ['institutionHasNoRepositories', '$mdi-database-off'],
]);

const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const snacks = useSnacksStore();

const itemsPerPageStored = useLocalStorage('ezm.itemsPerPage', 10);

const selected = ref([]);
const search = shallowRef('');
const allowNotReady = shallowRef(false);
const allowFaulty = shallowRef(false);
const allowHarvested = shallowRef(false);
const allEndpointsMustBeUnharvested = shallowRef(false);
const harvestedMonth = shallowRef(undefined);

const institutionRepositoriesDialogRef = useTemplateRef('institutionRepositoriesDialogRef');
const institutionSpacesDialogRef = useTemplateRef('institutionSpacesDialogRef');
const harvestSessionFormDialogRef = useTemplateRef('harvestSessionFormDialogRef');
const emailsCopyDialogRef = useTemplateRef('emailsCopyDialogRef');

const calcResultScore = (res) => {
  if (!res.harvestable.value) {
    return 1;
  }
  if (res.harvested) {
    return 2;
  }
  if (res.eligible.value) {
    return 3;
  }
  return 0;
};

const headers = computed(() => [
  {
    title: t('institutions.title'),
    value: 'institution.name',
    sortable: true,
  },
  {
    title: t('institutions.harvestable.members'),
    value: 'institution._count.memberships',
    sortable: true,
    align: 'center',
  },
  {
    title: t('institutions.harvestable.repositories'),
    value: 'institution._count.repositories',
    sortable: true,
    align: 'center',
  },
  {
    title: t('institutions.harvestable.spaces'),
    value: 'institution._count.spaces',
    sortable: true,
    align: 'center',
  },
  {
    title: t('sushi.credentials'),
    value: 'institution._count.sushiCredentials',
    sortable: true,
    align: 'center',
  },
  {
    title: t('institutions.institution.status'),
    value: 'status',
    sortable: true,
    align: 'center',
    sortRaw: (a, b) => calcResultScore(a) - calcResultScore(b),
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
]);

const {
  data,
  status,
  refresh,
} = await useFetch('/api/institutions/_harvestable', {
  lazy: true,
  query: {
    allowNotReady,
    allowFaulty,
    allowHarvested,
    allEndpointsMustBeUnharvested,
    harvestedMonth,
  },
});

const nonHarvestableInstitutions = computed(
  () => (data.value ?? [])
    .filter((res) => !res.harvestable.value && !res.harvested)
    .map(({ institution }) => institution),
);

const eligibleInstitutions = computed(
  () => (data.value ?? [])
    .filter((res) => res.harvestable.value && res.eligible.value && !res.harvested)
    .map(({ institution }) => institution),
);

const nonEligibleInstitutions = computed(
  () => (data.value ?? [])
    .filter((res) => res.harvestable.value && !res.eligible.value && !res.harvested)
    .map(({ institution }) => institution),
);

const harvestedInstitutions = computed(
  () => (data.value ?? [])
    .filter(({ harvested }) => harvested)
    .map(({ institution }) => institution),
);

const loaders = computed(() => [
  {
    key: 'eligible',
    originalValue: eligibleInstitutions.value.length,
    color: 'green',
    icon: '$mdi-check',
  },
  {
    key: 'non-harvestable',
    originalValue: nonHarvestableInstitutions.value.length,
    color: 'red',
    icon: '$mdi-alert',
  },
  {
    key: 'harvested',
    originalValue: harvestedInstitutions.value.length,
    color: 'blue',
    icon: '$mdi-cloud',
  },
  {
    key: 'non-eligible',
    originalValue: nonEligibleInstitutions.value.length,
    color: 'grey',
    icon: '$mdi-close',
  },
].map((loader) => ({
  ...loader,
  value: loader.originalValue / (data.value?.length ?? 1),
})));

const table = computed(() => {
  const formatter = new Intl.NumberFormat(locale.value, { style: 'percent' });

  return loaders.value.map(
    (loader) => ({
      key: loader.key,
      icon: loader.icon,
      value: loader.originalValue,
      color: loader.color,
      label: t(`institutions.harvestable.status.${loader.key}`),
      percent: formatter.format(loader.value),
    }),
  );
});

/**
 * Put institution ID into clipboard
 *
 * @param {object} param0 Item
 */
async function copyInstitutionId({ institution }) {
  if (!institution.id) {
    return;
  }

  try {
    await copy(institution.id);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

/**
 * Put users email into clipboard
 */
async function copyMailList(ids) {
  const toCopy = ids || selected.value;
  if (toCopy.length <= 0) {
    return;
  }

  emailsCopyDialogRef.value.open(toCopy);
}
</script>
