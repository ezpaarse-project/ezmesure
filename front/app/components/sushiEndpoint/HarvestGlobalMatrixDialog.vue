<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
  >
    <v-card
      :title="cardTitle"
      :subtitle="endpoint.vendor"
      :loading="status === 'pending' && 'primary'"
      prepend-icon="mdi-table-headers-eye"
    >
      <template #append>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="isOpen = false"
        />
      </template>

      <v-card-text class="pa-0" style="max-height: 100%; overflow-y: hidden;">
        <SushiHarvestGlobalMatrix
          v-model:period="period"
          :model-value="data?.matrix"
          :loading="status === 'pending'"
          :max="MAX_HARVEST_MONTH"
          column-key=""
          class="matrix"
        >
          <template v-if="error" #top>
            <v-alert
              :text="getErrorMessage(error)"
              type="error"
            />
          </template>

          <template #column-header="{ item }">
            <span class="text-uppercase">{{ item }}</span>
          </template>

          <template #row-header="{ item }">
            <nuxt-link :to="`/admin/institutions/${item.id}/sushi`">
              {{ item.name }}
            </nuxt-link>
          </template>
        </SushiHarvestGlobalMatrix>
      </v-card-text>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { format } from 'date-fns';

import { getQuarterPeriod } from '@/lib/sushi';
import { getErrorMessage } from '@/lib/errors';

const NOW = new Date();
const MAX_HARVEST_MONTH = format(NOW, 'yyyy-MM');

const props = defineProps({
  endpoint: {
    type: Object,
    required: true,
  },
});

const { data: user } = useAuthState();
const { t } = useI18n();

const isOpen = shallowRef(false);
const period = ref(getQuarterPeriod(NOW, -1));

const {
  data,
  status,
  error,
  refresh,
} = useFetch(`/api/sushi-endpoints/${props.endpoint.id}/_matrix`, {
  params: {
    retryCode: 425,
    'period:from': computed(() => period.value.beginDate),
    'period:to': computed(() => period.value.endDate),
  },

  // Try for 1 minute
  retry: 60,
  retryDelay: 1000,
  retryStatusCodes: [425],

  lazy: true,
  immediate: false,
});

const cardTitle = computed(() => {
  const title = t('sushi.globalHarvestState.endpoint.title');
  if (!user.value.isAdmin) {
    return title;
  }

  return `${title} - ${t('endpoints.endpoint')}`;
});

async function open() {
  isOpen.value = true;
  await refresh();
}

defineExpose({
  open,
});
</script>

<style lang="css" scoped>
.matrix :deep(.matrix--row-header) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}
</style>
