<template>
  <v-card
    :title="$t('components.components')"
    :subtitle="showInstitution ? institution.name : undefined"
    prepend-icon="mdi-home-group"
  >
    <template #append>
      <InstitutionAddMenu
        :model-value="components"
        :title="$t('components.add')"
        @institution-add="linkComponent($event)"
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
      <div v-if="components.length <= 0" class="text-center text-grey pt-5">
        {{ $t('components.noComponent') }}
      </div>

      <v-list v-else density="compact">
        <v-list-item
          v-for="component in sortedComponents"
          :key="component.id"
          :to="`/admin/institutions/${component.id}`"
          :title="component.name"
          :subtitle="component.acronym"
          lines="two"
        >
          <template #prepend>
            <InstitutionAvatar :institution="component" />
          </template>

          <template #append>
            <ConfirmPopover
              :agree-text="$t('delete')"
              :agree="() => unlinkComponent(component)"
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
  showInstitution: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const isLinkLoading = shallowRef(false);
/** @type {Ref<object[]>} */
const components = ref(props.institution.childInstitutions || []);

const sortedComponents = computed(
  () => components.value.toSorted((a, b) => a.name.localeCompare(b.name)),
);

async function unlinkComponent(item) {
  try {
    await $fetch(`/api/institutions/${props.institution.id}/subinstitutions/${item.id}`, {
      method: 'DELETE',
    });

    components.value = components.value.filter((i) => i.id !== item.id);

    emit('update:modelValue', components.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}

async function linkComponent(item) {
  if (!item) {
    return;
  }

  isLinkLoading.value = true;
  try {
    await $fetch(`/api/institutions/${props.institution.id}/subinstitutions/${item.id}/`, {
      method: 'PUT',
    });

    components.value.push(item);

    emit('update:modelValue', components.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
  isLinkLoading.value = false;
}
</script>
