<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
  >
    <v-card
      :title="cardTitle"
      :subtitle="session.id"
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

      <v-card-text style="max-height: 100%; overflow-y: hidden; padding: 0;">
        <SushiHarvestGlobalMatrix
          :model-value="data?.matrix"
          :loading="status === 'pending'"
          class="matrix"
        >
          <template v-if="error" #top>
            <v-alert
              :text="getErrorMessage(error)"
              type="error"
            />
          </template>

          <template #column-header="{ item }">
            <div class="institution-header">
              <nuxt-link v-tooltip:bottom="item.name" :to="`/admin/institutions/${item.id}/sushi`">
                {{ item.name }}
              </nuxt-link>
            </div>
            <div class="d-flex justify-center pb-4">
              <SushiHarvestGlobalMatrixCell :model-value="summaryByColumn.get(item.id)" />
            </div>
          </template>

          <template #row-header="{ item }">
            <nuxt-link :to="`/admin/endpoints/${item.id}`">
              {{ item.vendor }}
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
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
});

const { data: user } = useAuthState();
const { t } = useI18n();

const isOpen = shallowRef(false);

const {
  data,
  refresh,
  error,
  status,
} = useFetch(`/api/harvests-sessions/${props.session.id}/_matrix`, {
  params: {
    retryCode: 425,
  },

  // Try for 1 minute
  retry: 60,
  retryDelay: 1000,
  retryStatusCodes: [425],

  lazy: true,
  immediate: false,
});

const cardTitle = computed(() => {
  const title = t('sushi.globalHarvestState.harvest-session.title');
  if (!user.value.isAdmin) {
    return title;
  }

  return `${title} - ${t('harvest.sessions.title')}`;
});

const summaryByColumn = computed(() => new Map(
  data.value?.summary.map((cell) => [cell.id, cell]),
));

async function open() {
  isOpen.value = true;
  await refresh();
}

defineExpose({
  open,
});
</script>

<style lang="css" scoped>
.institution-header {
  height: 200px;
  position: relative;
}

.institution-header > a {
  bottom: 10px;
  left: 50%;
  position: absolute;
  transform: rotate(-45deg);
  transform-origin: center left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.matrix :deep(.matrix--row-header) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}
</style>
