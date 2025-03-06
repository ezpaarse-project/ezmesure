<template>
  <v-list-item
    :title="institution.name"
    :subtitle="institution.acronym"
    :active="isActive"
    color="primary"
    class="text-grey-darken-3"
  >
    <template #prepend>
      <InstitutionAvatar :institution="institution" />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
});

const route = useRoute();

const isActive = computed(() => {
  const regex = new RegExp(`^.+/institutions/${props.institution.id}`, 'i');
  return regex.test(route.path);
});
</script>
