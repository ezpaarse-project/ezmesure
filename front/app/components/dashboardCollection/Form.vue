<template>
  <v-card
    :title="isEditing ? $t('dashboardCollections.updateCollection') : $t('dashboardCollections.newCollection')"
    prepend-icon="$mdi-folder-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="collectionForm"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="collection.name"
                  :label="`${$t('name')} *`"
                  :rules="[v => !!v || $t('fieldIsRequired')]"
                  prepend-icon="$mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="collection.description"
                  :label="$t('description')"
                  prepend-icon="$mdi-book-open-page-variant"
                  variant="underlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? '$mdi-plus' : '$mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="collectionForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const initialData = defineModel({ type: Object });

const { t } = useI18n();
const snacks = useSnacksStore();

const saving = shallowRef(false);
const valid = shallowRef(false);
const collection = ref({ ...(initialData.value ?? {}) });

const isEditing = computed(() => !!initialData.value?.id);

async function save() {
  saving.value = true;

  try {
    if (isEditing.value) {
      const newCollection = await $fetch(`/api/dashboard-collections/${initialData.value.id}`, {
        method: 'PUT',
        body: { ...collection.value },
      });
      emit('submit', newCollection);
    } else {
      const newCollection = await $fetch('/api/dashboard-collections', {
        method: 'POST',
        body: { ...collection.value },
      });
      emit('submit', newCollection);
    }
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}
</script>
