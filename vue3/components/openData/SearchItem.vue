<template>
  <v-list-item
    :title="title"
    :subtitle="subtitle"
    :active="active"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  click: () => true,
});

const title = computed(() => {
  const name = props.item.uo_lib_officiel || props.item.uo_lib;
  if (props.item.sigle) {
    return `${name} (${props.item.sigle})`;
  }
  return `${name}`;
});

const subtitle = computed(() => {
  const infos = [];
  if (props.item.localisation) { infos.push(`${props.item.localisation}`); }
  if (props.item.uai) { infos.push(`UAI ${props.item.uai}`); }
  return infos.join(' - ');
});
</script>
