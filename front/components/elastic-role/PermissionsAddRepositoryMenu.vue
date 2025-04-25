<template>
  <v-menu v-model="isOpen" :close-on-content-click="false" width="300">
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card>
      <template #text>
        <v-form id="repositoryForm" @submit.prevent="submit()">
          <v-row>
            <v-col>
              <RepositoryAutoComplete
                :model-value="repository"
                @update:model-value="applyRepository($event)"
              />
            </v-col>
          </v-row>
        </v-form>
      </template>

      <template #actions>
        <v-spacer />

        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />

        <v-btn
          :text="$t('add')"
          :disabled="!repository.exist"
          prepend-icon="mdi-plus"
          type="submit"
          form="repositoryForm"
          variant="elevated"
          color="primary"
        />
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  role: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (repository) => !!repository,
});

const isOpen = ref(false);
/** @type {Ref<object|undefined>} */
const repository = ref({});

function applyRepository(item) {
  if (!item || typeof item === 'string') {
    repository.value.pattern = item;
    repository.value.exist = undefined;
  } else {
    repository.value = { ...item, exist: true };
  }
}

function submit() {
  emit('update:modelValue', {
    repositoryPattern: repository.value.pattern,
    repository: { ...repository.value, exist: undefined },
    elasticRoleName: props.role.name,
    elasticRole: { ...props.role },
    readonly: false,
  });
  repository.value = {};
  isOpen.value = false;
}
</script>
