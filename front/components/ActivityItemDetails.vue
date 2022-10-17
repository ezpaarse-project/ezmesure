<template>
  <div>
    <div
      v-for="(meta, index) in metadata"
      :key="index"
    >
      <span class="font-weight-bold">{{ meta.name }}</span><span>{{ meta.value }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
    };
  },
  computed: {
    metadata() {
      const metadataItems = Object
        .entries(this.item?.metadata || {})
        .map(([name, value]) => ({ name, value }));

      if (this.item?.index) {
        metadataItems.push({
          name: 'index',
          value: this.item?.index,
        });
      }

      return metadataItems;
    },
  },
  methods: {
  },
};
</script>
