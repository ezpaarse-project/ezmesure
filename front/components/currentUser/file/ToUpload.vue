<template>
  <v-card :title="modelValue.file.name" :subtitle="subtitle">
    <template v-if="modelValue.status !== 'running'" #prepend>
      <v-icon :icon="statusIcon.icon" :color="statusIcon.color" />
    </template>
    <template v-else #prepend>
      <v-progress-circular
        color="info"
        size="24"
        width="3"
        indeterminate
      />
    </template>

    <template v-if="modelValue.status !== 'running'" #append>
      <v-btn
        icon="mdi-delete"
        density="comfortable"
        variant="text"
        color="red"
        @click="$emit('click:delete', modelValue)"
      />
    </template>
    <template v-else #append>
      <ConfirmPopover
        :agree="() => $emit('click:delete', modelValue)"
      >
        <template #activator="{ props: confirm }">
          <v-btn
            icon="mdi-close"
            density="comfortable"
            variant="text"
            v-bind="confirm"
          />
        </template>
      </ConfirmPopover>
    </template>

    <template v-if="modelValue.status === 'pending'" #text>
      <v-form ref="formRef">
        <v-row>
          <v-col cols="6">
            <v-select
              :model-value="modelValue.target?.repository"
              :label="$t('files.affectedRepository')"
              :items="repositories"
              prepend-icon="mdi-database-arrow-up"
              variant="underlined"
              density="comfortable"
              hide-details
              @update:model-value="updateRepository($event)"
            >
              <template #prepend-item>
                <ConfirmPopover
                  :text="$t('files.letAdminDesc')"
                  :agree="() => updateRepository('')"
                  location="end"
                >
                  <template #activator="{ props: confirm }">
                    <v-list-item
                      :title="$t('files.letAdmin')"
                      append-icon="mdi-folder-arrow-up-outline"
                      v-bind="confirm"
                    />
                  </template>
                </ConfirmPopover>
              </template>
            </v-select>
          </v-col>

          <v-col v-if="modelValue.target?.repository" cols="6">
            <v-select
              :model-value="modelValue.target?.index"
              :label="$t('files.affectedIndex')"
              :items="indices ?? []"
              prepend-icon="mdi-harddisk"
              variant="underlined"
              density="comfortable"
              hide-details
              @update:model-value="updateIndex($event)"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  indices: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits({
  'update:target': (value) => !!value,
  'click:delete': (value) => !!value,
});

const { t } = useI18n();
const { reposPermissions, institutions } = storeToRefs(useCurrentUserStore());

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const statusIcon = computed(() => {
  switch (props.modelValue.status) {
    case 'failed':
      return { icon: 'mdi-alert-circle-outline', color: 'error' };
    case 'cancelled':
      return { icon: 'mdi-cancel', color: 'error' };
    case 'running':
      return { icon: 'mdi-progress-upload', color: 'info' };
    case 'finished':
      return { icon: 'mdi-check', color: 'success' };
    default:
      return { icon: 'mdi-dots-horizontal' };
  }
});

const subtitle = computed(() => {
  const { target, status } = props.modelValue;
  // If pending, infos are already displayed
  if (status === 'pending') {
    return undefined;
  }

  // If finished and uploaded to team, just print so
  if (!target.repository && status === 'finished') {
    return `${t('files.uploaded')}, ${t('files.letAdminDesc').toLowerCase()}`;
  }

  // Prepare label
  let targetLabel = '';
  if (target.repository) {
    targetLabel = target.repository;
    if (target.index) {
      targetLabel += ` (${target.index})`;
    }
  }

  let statusLabel = '';
  switch (status) {
    case 'cancelled':
      statusLabel = t('canceled');
      break;
    case 'failed':
      statusLabel = `${t('error')}: ${props.modelValue.error.message}`;
      break;
    case 'running':
      statusLabel = t('files.loadingInProgress');
      break;
    case 'finished':
      statusLabel = t('files.loaded');
      break;
    default:
      break;
  }

  return [targetLabel, statusLabel].filter((v) => !!v).join(' - ');
});

const repositories = computed(() => {
  const repos = reposPermissions.value
    .filter((p) => !p.readonly && p.repository.type === 'ezpaarse')
    .map((p) => {
      const institution = institutions.value.find(({ id }) => id === p.institutionId);
      return { ...p.repository, institution };
    });

  const reposPerInstitution = Object.groupBy(repos, (r) => r.institutionId);

  return Object.values(reposPerInstitution).map((r) => [
    // There's no way to add "headers", "groups" or "children" into a
    // VSelect (and other derivate), so headers are items with custom style
    {
      title: r[0].institution?.name || 'Unknown',
      value: r[0].institution?.id,
      props: {
        disabled: true,
      },
    },

    ...r.map(({ pattern }) => ({
      title: pattern,
      value: pattern,
      props: {
        style: {
          paddingLeft: '2rem',
        },
      },
    })),
  ]).flat();
});

function updateRepository(pattern) {
  const target = { ...(props.modelValue.target ?? {}) };
  target.repository = pattern;
  emit('update:target', target);
}

function updateIndex(index) {
  const target = { ...(props.modelValue.target ?? {}) };
  target.index = index;
  emit('update:target', target);
}
</script>
