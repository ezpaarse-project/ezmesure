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
            icon="mdi-cog"
            variant="tonal"
            density="comfortable"
            color="primary"
            class="mr-2"
            v-bind="props"
          />
        </template>

        <v-card
          :title="$t('institutions.harvestable.settings')"
          prepend-icon="mdi-cog"
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
                  :max="'2025-10'"
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
          <v-col cols="3">
            <SimpleMetric
              :title="$t('institutions.harvestable.harvestableInstitutions')"
              icon="mdi-check"
              color="success"
            >
              <template #value>
                {{ harvestableInstitutions.length }}

                <span
                  v-if="harvestableInstitutions.length !== selectableInstitutions.length"
                  style="font-size: 0.65em"
                >
                  {{ $t('institutions.harvestable.nSelectable', selectableInstitutions.length) }}
                </span>
              </template>

              <template #actions>
                <v-btn
                  :text="$t('select')"
                  :disabled="harvestableInstitutions.length <= 0"
                  :loading="status === 'pending'"
                  size="small"
                  variant="outlined"
                  @click="selected = selectableInstitutions.map(({ id }) => id)"
                />
              </template>
            </SimpleMetric>
          </v-col>

          <v-col cols="3">
            <SimpleMetric
              :value="`${data.length}`"
              :title="$t('institutions.harvestable.institutions', data.length)"
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
      :sort-by="[{ key: 'harvestable.value', order: 'desc' }, { key: 'institution.name', order: 'asc' }]"
      :items-per-page-options="[10, 25, 50, 100]"
      item-value="institution.id"
      show-select
    >
      <template #[`item.institution._count.memberships`]="{ item, value }">
        <v-chip
          :text="`${value}`"
          :to="`/admin/institutions/${item.institution.id}/members`"
          :color="!value ? 'orange' : undefined"
          prepend-icon="mdi-account-multiple"
          size="small"
        />
      </template>

      <template #[`item.institution._count.repositories`]="{ value, item }">
        <v-chip
          :text="`${value}`"
          :color="!value ? 'red' : undefined"
          prepend-icon="mdi-database-outline"
          size="small"
          @click="institutionRepositoriesDialogRef?.open(item.institution)"
        />
      </template>

      <template #[`item.institution._count.spaces`]="{ value, item }">
        <v-chip
          :text="`${value}`"
          :color="!value ? 'orange' : undefined"
          prepend-icon="mdi-tab"
          size="small"
          @click="institutionSpacesDialogRef?.open(item.institution)"
        />
      </template>

      <template #[`item.institution._count.sushiCredentials`]="{ value, item }">
        <v-chip
          :text="`${value}`"
          :to="`/admin/institutions/${item.institution.id}/sushi`"
          :color="!value ? 'red' : undefined"
          prepend-icon="mdi-key"
          size="small"
        />
      </template>

      <template #[`item.harvestable.value`]="{ value, item }">
        <v-menu
          :disabled="item.harvestable.reasons.length <= 0"
          :close-on-content-click="false"
          open-on-hover
        >
          <template #activator="{ props }">
            <v-chip
              :text="value ? $t('institutions.harvestable.status.harvestable') : $t('institutions.harvestable.status.non-harvestable')"
              :prepend-icon="value ? 'mdi-check' : 'mdi-close'"
              :color="value ? 'green' : 'red'"
              variant="text"
              v-bind="props"
            />
          </template>

          <v-card>
            <template #text>
              <v-list>
                <v-list-item
                  v-for="reason of item.harvestable.reasons"
                  :key="reason"
                  :title="$t(`sushi.isNotHarvestable.reasons.${reason}`)"
                  prepend-icon="mdi-alert"
                />
              </v-list>
            </template>
          </v-card>
        </v-menu>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="mdi-cog"
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
              prepend-icon="mdi-identifier"
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
          prepend-icon="mdi-email-multiple"
          @click="copyMailList()"
        />

        <v-list-item
          v-if="harvestSessionFormDialogRef"
          :title="$t('harvest.sessions.add')"
          prepend-icon="mdi-tractor"
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
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

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

const headers = computed(() => [
  {
    title: t('institutions.title'),
    value: 'institution.name',
    sortable: true,
  },
  {
    title: t('institutions.institution.members'),
    value: 'institution._count.memberships',
    sortable: true,
    align: 'center',
  },
  {
    title: t('repositories.repositories'),
    value: 'institution._count.repositories',
    sortable: true,
    align: 'center',
  },
  {
    title: t('spaces.spaces'),
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
    value: 'harvestable.value',
    sortable: true,
    align: 'center',
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

const harvestableInstitutions = computed(
  () => (data.value ?? [])
    .filter(({ harvestable }) => harvestable.value)
    .map(({ institution }) => institution),
);

const selectableInstitutions = computed(
  () => harvestableInstitutions.value.filter(
    /* eslint-disable no-underscore-dangle */
    (institution) => institution._count.sushiCredentials > 0
                  && institution._count.repositories > 0,
    /* eslint-enable no-underscore-dangle */
  ),
);

const harvestedInstitutions = computed(
  () => (data.value ?? [])
    .filter(({ harvestable }) => harvestable.reasons.length === 1 && harvestable.reasons[0] === 'institutionIsHarvested')
    .map(({ institution }) => institution),
);

const loaders = computed(() => [
  {
    key: 'selectable',
    originalValue: selectableInstitutions.value.length,
    color: 'green',
    icon: 'mdi-check',
  },
  {
    key: 'harvested',
    originalValue: harvestedInstitutions.value.length,
    color: 'blue',
    icon: 'mdi-cloud',
  },
  {
    key: 'harvestable',
    originalValue: harvestableInstitutions.value.length - selectableInstitutions.value.length,
    color: 'orange',
    icon: 'mdi-alert',
  },
  {
    key: 'non-harvestable',
    originalValue:
        (data.value?.length ?? 0)
        - harvestableInstitutions.value.length
        - harvestedInstitutions.value.length,
    color: 'red',
    icon: 'mdi-close',
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
async function copyMailList() {
  const addresses = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const id of selected.value) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const memberships = await $fetch(`/api/institutions/${id}/memberships`, {
        query: {
          roles: 'contact:doc',
          include: ['user'],
        },
      });

      const { email } = memberships[0]?.user ?? {};
      if (email) {
        addresses.push(email);
      }
    } catch (err) {
      snacks.error(t('anErrorOccurred'), err);
      return;
    }
  }

  try {
    await copy(addresses.join('; '));
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('emailsCopied'));
}
</script>
