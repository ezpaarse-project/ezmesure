<template>
  <v-card
    :title="$t('shares.newShare')"
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
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('add')"
        :prepend-icon="'mdi-plus'"
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
const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const loading = shallowRef(false);
const valid = shallowRef(false);
const role = ref({});

async function save() {
  loading.value = true;

  try {
    const newRole = await $fetch(`/api/elastic-roles/${role.value.name}`, {
      method: 'PUT',
      body: {
        name: role.value.name,
      },
    });
    emit('submit', newRole);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}
</script>
