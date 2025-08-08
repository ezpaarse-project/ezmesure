<template>
  <v-card
    :title="isEditing ? $t('users.updateUser') : $t('users.newUser')"
    :subtitle="showUser ? modelValue?.fullName : undefined"
    prepend-icon="mdi-account-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="userForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-card
              :title="$t('general')"
              prepend-icon="mdi-format-list-bulleted"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="user.username"
                      :label="`${$t('users.user.username')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      prepend-icon="mdi-form-textbox"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="user.email"
                      :label="`${$t('users.user.email')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      prepend-icon="mdi-email"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="user.fullName"
                      :label="$t('users.user.fullName')"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('administration')"
              prepend-icon="mdi-security"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="user.isAdmin"
                      :label="$t('users.user.isAdmin')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="userForm"
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
  showUser: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const saving = shallowRef(false);
const valid = shallowRef(false);
const user = ref({ ...(props.modelValue ?? {}) });

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const isEditing = computed(() => !!props.modelValue?.username);

async function save() {
  saving.value = true;

  try {
    const newUser = await $fetch(`/api/users/${user.value.username}`, {
      method: 'PUT',
      body: { ...user.value },
    });
    emit('submit', newUser);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
