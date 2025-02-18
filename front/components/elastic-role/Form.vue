<template>
  <v-card
    :title="isEditing ? $t('elasticRoles.editRole') : $t('elasticRoles.newRole')"
    :subtitle="isEditing ? modelValue.name : undefined"
    prepend-icon="mdi-account-tag"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="roleForm"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="role.name"
                  :label="`${$t('name')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9_-]+$/i.test(v) || $t('invalidFormat'),
                  ]"
                  prepend-icon="mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <FiltersForm
                  v-model="role.filters"
                  :title="$t('elasticRoles.filtersForm.title')"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="loading"
        type="submit"
        form="roleForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  showRole: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const loading = ref(false);
const valid = ref(false);
const role = ref({ ...(props.modelValue ?? {}) });

const isEditing = computed(() => !!props.modelValue?.name);

async function save() {
  loading.value = true;

  try {
    const newRole = await $fetch(`/api/elastic-roles/${role.value.name}`, {
      method: 'PUT',
      body: {
        name: role.value.name,
        filters: role.value.filters,
      },
    });
    emit('submit', newRole);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }

  loading.value = false;
}
</script>
