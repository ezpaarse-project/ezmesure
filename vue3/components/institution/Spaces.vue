<template>
  <v-card
    :title="$t('spaces.spaces')"
    :subtitle="showInstitution ? institution.name : undefined"
    prepend-icon="mdi-tab"
  >
    <template #append>
      <v-btn
        v-if="spaceFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="text"
        density="comfortable"
        color="green"
        @click="spaceFormDialogRef.open(undefined, { institution })"
      />
    </template>

    <template #text>
      <div v-if="spaces.length <= 0" class="text-center text-grey pt-5">
        {{ $t('spaces.noSpace') }}
      </div>

      <v-row v-else dense>
        <v-col
          v-for="space in sortedSpaces"
          :key="space.id"
          cols="12"
        >
          <v-card
            :title="space.name"
            :text="space.description"
            variant="outlined"
            :style="{ borderColor: repoColors.get(space.type), borderWidth: '2px' }"
          >
            <template #subtitle>
              <v-chip
                :text="space.id"
                prepend-icon="mdi-identifier"
                size="small"
                density="comfortable"
                class="mr-2"
              />

              <v-chip
                :text="space.type"
                :color="repoColors.get(space.type)"
                size="small"
                density="comfortable"
              />
            </template>

            <template #append>
              <v-btn
                v-if="spaceFormDialogRef"
                v-tooltip="$t('modify')"
                icon="mdi-pencil"
                variant="text"
                size="small"
                density="comfortable"
                color="blue"
                class="mr-2"
                @click="spaceFormDialogRef.open(space, { institution })"
              />

              <ConfirmPopover
                :text="$t('areYouSure')"
                :agree-text="$t('delete')"
                :agree="() => removeSpace(space)"
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
                  />
                </template>
              </ConfirmPopover>
            </template>

            <template #actions>
              <v-spacer />

              <v-btn
                :text="$t('open')"
                :href="`/kibana/s/${space.id}`"
                append-icon="mdi-open-in-app"
                variant="text"
                size="small"
                class="mr-2"
                @click.prevent=""
              />
            </template>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <SpaceFormDialog
      ref="spaceFormDialogRef"
      @submit="onSpaceAdded($event)"
    />
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

/** @type {Ref<object[]>} */
const spaces = ref(props.institution.spaces || []);

const spaceFormDialogRef = useTemplateRef('spaceFormDialogRef');

const sortedSpaces = computed(
  () => spaces.value.toSorted((a, b) => a.name.localeCompare(b.name)),
);

function onSpaceAdded(item) {
  const index = spaces.value.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    spaces.value[index] = item;
  } else {
    spaces.value.push(item);
  }
  emit('update:modelValue', spaces.value);
}

async function removeSpace(item) {
  try {
    await $fetch(`/api/kibana-spaces/${item.id}`, {
      method: 'DELETE',
    });

    spaces.value = spaces.value.filter((i) => i.id !== item.id);

    emit('update:modelValue', spaces.value);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
