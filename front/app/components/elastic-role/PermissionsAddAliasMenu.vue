<template>
  <v-menu v-model="isOpen" :close-on-content-click="false" width="300">
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card>
      <template #text>
        <v-form id="aliasForm" @submit.prevent="submit()">
          <v-row>
            <v-col>
              <RepositoryAliasAutoComplete v-model="alias" />
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
          :disabled="!alias"
          prepend-icon="mdi-plus"
          type="submit"
          form="aliasForm"
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
  'update:modelValue': (alias) => !!alias,
});

const isOpen = shallowRef(false);
/** @type {Ref<object|undefined>} */
const alias = ref();

function submit() {
  emit('update:modelValue', {
    aliasPattern: alias.value.pattern,
    alias: { ...alias.value },
    elasticRoleName: props.role.name,
    elasticRole: { ...props.role },
  });
  alias.value = undefined;
  isOpen.value = false;
}
</script>
