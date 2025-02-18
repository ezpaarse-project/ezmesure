<template>
  <v-menu v-model="isOpen" :close-on-content-click="false" width="500">
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card>
      <template #text>
        <v-form id="spaceForm" @submit.prevent="submit()">
          <v-row>
            <v-col>
              <SpaceAutoComplete v-model="space" />
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
          :disabled="!space"
          prepend-icon="mdi-plus"
          type="submit"
          form="spaceForm"
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
  'update:modelValue': (space) => !!space,
});

const isOpen = ref(false);
/** @type {Ref<object|undefined>} */
const space = ref();

function submit() {
  emit('update:modelValue', {
    spaceId: space.value.id,
    space: { ...space.value },
    elasticRoleName: props.role.name,
    elasticRole: { ...props.role },
    readonly: false,
  });
  space.value = undefined;
  isOpen.value = false;
}
</script>
