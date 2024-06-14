<template>
  <div class="d-flex" style="gap: 1rem;">
    <CredentialHarvestState :harvests="item.harvests" />

    <SushiConnectionIcon
      :connection="item.connection"
      :state="state"
      @checkConnection="$emit('checkConnection')"
    />

    <LocalDate :date="item.updatedAt" style="width: 175px; text-align: end;" />
  </div>
</template>

<script setup>
import SushiConnectionIcon from '~/components/SushiConnectionIcon.vue';
import CredentialHarvestState from '~/components/sushis/CredentialHarvestState.vue';
import LocalDate from '~/components/LocalDate.vue';

defineProps({
  item: {
    type: Object,
    required: true,
  },
  state: {
    type: String,
    default: undefined,
  },
});
</script>
