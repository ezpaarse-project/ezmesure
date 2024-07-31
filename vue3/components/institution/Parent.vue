<template>
  <v-card :title="$t('group.group')" prepend-icon="mdi-home-city">
    <template #append>
      <v-menu
        v-model="isSearchOpen"
        :persistent="isLinkLoading"
        :close-on-content-click="false"
        width="300"
      >
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip="$t(parent ? 'modify' : 'add')"
            :icon="parent ? 'mdi-pencil' : 'mdi-plus'"
            :color="parent ? 'blue' : 'green'"
            variant="text"
            density="comfortable"
            v-bind="menu"
          />
        </template>

        <v-card>
          <template #text>
            <InstitutionAutoComplete v-model="parentToLink" />
          </template>

          <template #actions>
            <v-spacer />

            <v-btn variant="text" @click="isSearchOpen = false">
              {{ $t('cancel') }}
            </v-btn>

            <v-btn
              color="primary"
              :loading="isLinkLoading"
              :disabled="!parentToLink || parentToLink.id === props.institution.id"
              @click="linkParent()"
            >
              {{ $t('add') }}
            </v-btn>
          </template>
        </v-card>
      </v-menu>
    </template>

    <template #text>
      <div v-if="!parent" class="text-center text-grey pt-5">
        {{ $t('group.noGroup') }}
      </div>

      <v-list v-else>
        <v-list-item
          :to="`/admin/institutions/${parent.id}`"
          :title="parent.name"
          :subtitle="parent.acronym"
        >
          <template #prepend>
            <InstitutionAvatar :institution="parent" />
          </template>

          <template #append>
            <ConfirmPopover
              :text="$t('areYouSure')"
              :agree-text="$t('delete')"
              :agree="() => unlinkParent(parent)"
              location="end"
            >
              <template #activator="{ props: confirm }">
                <v-btn
                  v-tooltip="$t('delete')"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  density="comfortable"
                  color="red"
                  v-bind="confirm"
                  @click.prevent=""
                />
              </template>
            </ConfirmPopover>
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
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => item !== null,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const isSearchOpen = ref(false);
const isLinkLoading = ref(false);
/** @type {Ref<object|null>} */
const parent = ref(props.institution.parentInstitution);
/** @type {Ref<object|null>} */
const parentToLink = ref(null);

function init(item) {
  parent.value = item;
}

async function unlinkParent(item) {
  try {
    await $fetch(`/api/institutions/${item.id}/subinstitutions/${props.institution.id}`, {
      method: 'DELETE',
    });

    parent.value = undefined;

    emit('update:modelValue', parent.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }
}

async function linkParent() {
  if (!parentToLink.value || !props.institution || parentToLink.value === props.institution.id) {
    return;
  }

  isLinkLoading.value = true;
  try {
    await $fetch(`/api/institutions/${parentToLink.value.id}/subinstitutions/${props.institution.id}/`, {
      method: 'PUT',
      body: { type: props.institution.type },
    });

    parent.value = { ...parentToLink.value };
    parentToLink.value = null;

    emit('update:modelValue', parent.value);
    isSearchOpen.value = false;
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }
  isLinkLoading.value = false;
}

defineExpose({
  init,
});
</script>
