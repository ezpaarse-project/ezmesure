<template>
  <v-row v-if="modelValue.length > 0">
    <v-col cols="12">
      <v-toolbar color="transparent">
        <span
          class="text-overline"
          style="white-space: nowrap;"
        >{{ label }}</span>

        <v-divider class="mx-2" />

        <slot name="actions" />
      </v-toolbar>
    </v-col>

    <v-col cols="12">
      <v-row v-for="upload in modelValue" :key="upload.id">
        <v-col>
          <CurrentUserFileToUpload
            :model-value="upload"
            :indices="indicesOfRepositories.get(upload.target?.repository)"
            @update:target="onTargetUpdate(upload, $event)"
            @click:delete="deleteUpload(upload)"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: '',
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value,
  'ready:upload': (value) => !!value,
});

const snacks = useSnacksStore();
const { t } = useI18n();

const indicesOfRepositories = ref(new Map());

async function onRepositoryUpdate(upload, target) {
  if (!target.repository) {
    // No pattern means "transfer to team" so upload is ready
    return target;
  }

  let indices = [];
  try {
    indices = await $fetch(`/api/repositories/${target.repository}/_resolve`);
    indicesOfRepositories.value.set(target.repository, indices.map((i) => i.name));
  } catch {
    snacks.error(t('anErrorOccurred'));
  }

  if (indices.length === 0) {
    return { ...target, index: undefined };
  }
  if (indices.length === 1) {
    // Auto select index if only one available
    return { ...target, index: indices[0]?.name };
  }
  return target;
}

async function onTargetUpdate(upload, target) {
  const newUpload = { ...upload, target };

  if (upload.target?.repository !== target.repository) {
    newUpload.target = await onRepositoryUpdate(upload, target);
  }

  // Update upload in current list
  const uploads = [...props.modelValue];
  const uploadIndex = uploads.findIndex((u) => u.id === newUpload.id);
  uploads.splice(uploadIndex, 1, newUpload);
  emit('update:modelValue', uploads);

  if (!newUpload.target) {
    return;
  }

  // If no repository or (repository and index) -> upload is ready
  const hasRepository = newUpload.target?.repository;
  const hasIndex = hasRepository && newUpload.target?.index;
  if (!hasRepository || hasIndex) {
    emit('ready:upload', newUpload);
  }
}

function deleteUpload(upload) {
  upload.cancel?.();
  const uploads = props.modelValue.filter((u) => u !== upload);
  emit('update:modelValue', uploads);
}
</script>
