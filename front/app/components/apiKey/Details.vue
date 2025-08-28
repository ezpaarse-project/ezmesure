<template>
  <v-container fluid>
    <v-row>
      <DetailsField
        v-for="field in fields"
        :key="field.label"
        :value="field.value"
        :label="field.label"
        :cols="field.cols"
        style="word-wrap: anywhere;"
      />

      <DetailsField
        v-if="permissions.length > 0"
        :label="$t('api-keys.permissions')"
        cols="12"
      >
        <div class="d-flex ga-2">
          <v-chip
            v-for="perm in permissions"
            :key="perm.scope"
            v-tooltip:top="perm.value"
            :text="perm.title"
            :append-icon="perm.valueIcon"
            :color="perm.color"
            density="compact"
            variant="outlined"
          />
        </div>
      </DetailsField>

      <DetailsField
        v-if="modelValue.description"
        :value="modelValue.description"
        :label="$t('description')"
        cols="12"
      />
    </v-row>
  </v-container>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  institution: {
    type: Object,
    default: () => undefined,
  },
});

const { t, locale } = useI18n();

function formatDate(date) {
  return dateFormat(date, locale.value, 'PPPpp');
}

const fields = computed(() => [
  {
    value: formatDate(props.modelValue.createdAt),
    label: t('institutions.sushi.createdAt'),
    cols: 4,
  },
  {
    value: formatDate(props.modelValue.updatedAt),
    label: t('institutions.sushi.updatedAt'),
    cols: 4,
  },
  {
    value: props.institution ? props.modelValue.user.fullName : undefined,
    label: t('api-keys.institution.user'),
    cols: 4,
  },
].filter((f) => f.value));

const permissions = computed(() => props.modelValue.permissions.map((perm) => {
  const [scope, level] = perm.split(':');
  const { icon, color } = permLevelColors.get(level) ?? {};

  return {
    scope,
    title: t(`institutions.members.featureLabels.${scope}`),
    value: t(`permissions.${level}`),
    valueIcon: icon,
    color,
  };
}));
</script>
