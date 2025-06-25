<template>
  <v-card
    :title="$t('spaces.spaces')"
    :subtitle="showInstitution ? institution.name : undefined"
    prepend-icon="mdi-tab"
  >
    <template v-if="!userSpaced" #append>
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
      <div v-if="spaceCount <= 0" class="text-center text-grey pt-5">
        {{ $t('spaces.noSpace') }}
      </div>

      <template v-else>
        <v-row v-if="sortedSpaces.length > 0" dense>
          <v-col v-if="sortedForeignSpaces.length > 0" cols="12" class="pt-0">
            <v-list-subheader>
              <v-icon icon="mdi-tab" start />
              {{ $t('spaces.ownedSpaces') }}
            </v-list-subheader>
          </v-col>

          <v-col
            v-for="space in sortedSpaces"
            :key="space.id"
            cols="12"
          >
            <SpaceCard :model-value="space">
              <template v-if="!userSpaced" #append>
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
                  v-if="user.isAdmin"
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
            </SpaceCard>
          </v-col>
        </v-row>

        <v-divider v-if="sortedForeignSpaces.length > 0 && sortedSpaces.length > 0" class="mt-4 mb-2" />

        <v-row v-if="sortedForeignSpaces.length > 0" dense>
          <v-col cols="12">
            <v-list-subheader>
              <v-icon icon="mdi-tab-plus" start />
              {{ $t('spaces.foreignSpaces') }}
            </v-list-subheader>
          </v-col>

          <v-col
            v-for="{ space, elasticRole } in sortedForeignSpaces"
            :key="space.id"
            cols="12"
          >
            <SpaceCard :model-value="space">
              <template v-if="!userSpaced" #append>
                <v-chip
                  v-tooltip:left="$t('elasticRoles.grantedBy')"
                  :text="elasticRole.name"
                  append-icon="mdi-account-tag"
                  color="secondary"
                  variant="outlined"
                  size="small"
                  label
                />
              </template>
            </SpaceCard>
          </v-col>
        </v-row>
      </template>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <SpaceFormDialog
      v-if="!userSpaced && user.isAdmin"
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
  userSpaced: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { t } = useI18n();
const { data: user } = useAuthState();
const snacks = useSnacksStore();

/** @type {Ref<object[]>} */
const spaces = ref(props.institution.spaces || []);
/** @type {Ref<object[]>} */
const elasticRoles = ref(props.institution.elasticRoles || []);

const spaceFormDialogRef = useTemplateRef('spaceFormDialogRef');

const sortedSpaces = computed(() => spaces.value.toSorted((a, b) => a.name.localeCompare(b.name)));

const sortedForeignSpaces = computed(() => {
  const entries = elasticRoles.value.flatMap((elasticRole) => {
    const perms = elasticRole.spacePermissions ?? [];
    return perms.map(({ space }) => [space.id, { space, elasticRole }]);
  });

  return Array.from(new Map(entries).values())
    .toSorted((a, b) => a.space.name.localeCompare(b.space.name));
});

const spaceCount = computed(() => sortedSpaces.value.length + sortedForeignSpaces.value.length);

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
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}
</script>
