<template>
  <v-card
    :title="$t('elasticRoles.institutions')"
    :subtitle="showRole ? role.name : undefined"
    prepend-icon="mdi-domain"
  >
    <template v-if="!hasConditions" #append>
      <InstitutionAddMenu
        :model-value="institutions"
        :title="$t('elasticRoles.addInstitution')"
        @institution-add="addInstitution($event)"
      >
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip="$t('add')"
            icon="mdi-plus"
            variant="text"
            density="comfortable"
            color="green"
            v-bind="menu"
          />
        </template>
      </InstitutionAddMenu>
    </template>

    <template #text>
      <v-expansion-panels>
        <v-expansion-panel :title="$t('repoAliasTemplates.conditions')">
          <template #text>
            <FiltersForm
              v-model="conditions"
              :title="$t('repoAliasTemplates.conditions')"
              :subtitle="$t('repoAliasTemplates.conditionsDescription')"
              variant="flat"
              prepend-icon="mdi-format-list-checks"
              disable-advanced
            >
              <template #actions>
                <v-btn
                  variant="elevated"
                  prepend-icon="mdi-sync"
                  size="small"
                  :loading="loading"
                  @click="sync()"
                >
                  {{ $t('synchronize') }}
                </v-btn>

                <v-switch
                  v-model="dryRun"
                  :label="$t('repoAliasTemplates.dryRun')"
                  color="primary"
                  density="comfortable"
                  hide-details
                />

                <v-spacer />

                <v-btn
                  variant="elevated"
                  prepend-icon="mdi-content-save"
                  color="secondary"
                  size="small"
                  :loading="loading"
                  @click="saveConditions()"
                >
                  {{ $t('save') }}
                </v-btn>
              </template>
            </FiltersForm>
          </template>
        </v-expansion-panel>
      </v-expansion-panels>

      <div v-if="institutions.length <= 0" class="text-center text-grey pt-5">
        {{ $t('elasticRoles.noInstitutions') }}
      </div>

      <v-list v-else density="compact" lines="two">
        <v-list-item
          v-for="institution in institutions"
          :key="institution.id"
          :title="institution.name"
          :subtitle="institution.acronym"
          :to="`/admin/institutions/${institution.id}`"
        >
          <template #prepend>
            <InstitutionAvatar :institution="institution" />
          </template>

          <template v-if="!hasConditions" #append>
            <v-btn
              v-tooltip="$t('revoke')"
              icon="mdi-office-building-remove"
              variant="text"
              size="small"
              density="comfortable"
              color="red"
              @click.prevent="removeInstitution(institution)"
            />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  role: {
    type: Object,
    required: true,
  },
  showRole: {
    type: Boolean,
    default: false,
  },
});

const snacks = useSnacksStore();
const { t } = useI18n();

const emit = defineEmits({
  'update:modelValue': () => true,
});

/** @type {Ref<object[]>} */
const institutions = ref(props.role.institutions || []);

const loading = ref(false);
const dryRun = ref(false);
const conditions = ref([]);
const hasConditions = computed(() => (conditions.value || []).length > 0);

watch(
  () => props.role?.conditions,
  (v) => { conditions.value = JSON.parse(JSON.stringify(v ?? [])); },
  { immediate: true },
);

async function saveConditions() {
  loading.value = true;

  try {
    await $fetch(`/api/elastic-roles/${props.role.name}`, {
      method: 'PUT',
      body: {
        ...props.role,
        conditions: conditions.value,
      },
    });
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}

async function sync() {
  loading.value = true;

  try {
    const result = await $fetch(`/api/elastic-roles/${props.role.name}/_sync`, {
      method: 'POST',
      query: {
        dryRun: dryRun.value,
      },
    });

    const newInstitutionList = result?.items
      ?.filter((item) => (item.status === 'created' || item.status === 'updated'))
      ?.map((item) => item.data);

    institutions.value = newInstitutionList ?? [];
    emit('update:modelValue', institutions.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}

async function addInstitution(item) {
  try {
    const updatedInstitution = await $fetch(`/api/institutions/${item.id}/elastic-roles/${props.role.name}`, {
      method: 'PUT',
      body: {},
    });
    institutions.value.push(updatedInstitution);
    emit('update:modelValue', institutions.value);
  } catch (err) {
    snacks.error(t('institutions.members.cannotAddMember'), err);
  }
}

async function removeInstitution(item) {
  try {
    await $fetch(`/api/institutions/${item.id}/elastic-roles/${props.role.name}`, {
      method: 'DELETE',
    });

    institutions.value = institutions.value.filter((institution) => institution.id !== item.id);

    emit('update:modelValue', institutions.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}
</script>
