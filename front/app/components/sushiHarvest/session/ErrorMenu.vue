<template>
  <v-menu location="start" offset="5" width="500" open-on-hover>
    <template #activator="{ props: menu }">
      <v-icon
        icon="mdi-alert"
        color="error"
        class="mr-2"
        style="opacity: 1;"
        v-bind="menu"
      />
    </template>

    <v-card>
      <v-card-title class="bg-error mb-2">
        <v-icon icon="mdi-truck-alert-outline" start />

        {{ $t('harvest.sessions.status.errors.title') }}
      </v-card-title>

      <v-card-text>
        <template v-if="cause?.type">
          <v-row>
            <v-col>
              <p>
                {{ $t(`harvest.sessions.status.errors.types.${cause.type}`) }}
              </p>

              <p v-if="cause.beginDate">
                {{ $t('harvest.sessions.status.errors.causes.beginDate', cause.beginDate) }}
              </p>

              <p v-if="cause.endDate">
                {{ $t('harvest.sessions.status.errors.causes.endDate', cause.endDate) }}
              </p>

              <v-btn
                v-if="cause.institutionId"
                :to="`/admin/institutions/${cause.institutionId}`"
                :text="$t('harvest.sessions.status.errors.causes.institution')"
                variant="flat"
                color="primary"
                block
                class="mt-2"
              />
            </v-col>
          </v-row>

          <v-divider class="my-2" />
        </template>

        <v-row>
          <v-col>
            <p class="text-subtitle-2">
              {{ $t('harvest.sessions.status.errors.api.title') }}
            </p>

            <code>{{ error.name }} - {{ error.message }}</code>
          </v-col>
        </v-row>

        <template v-if="modelValue.status === 'starting'">
          <v-divider class="my-2" />
          <v-row>
            <v-col>
              <p>
                {{ $t('harvest.sessions.status.errors.actions.restart') }}
              </p>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const error = computed(() => props.modelValue.error);
const cause = computed(() => error.value?.cause);
</script>
