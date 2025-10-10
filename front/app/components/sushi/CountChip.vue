<template>
  <v-chip
    :text="`${modelValue.length}`"
    :variant="!modelValue.length ? 'outlined' : undefined"
    :to="to"
    prepend-icon="mdi-key"
    size="small"
  />

  <v-menu
    location="start center"
    offset="5"
    open-delay="50"
    open-on-hover
  >
    <template #activator="{ props: menu }">
      <ProgressLinearStack
        :model-value="bars"
        height="8"
        v-bind="menu"
        class="mt-1"
      />
    </template>

    <v-sheet min-width="300">
      <v-table density="comfortable">
        <tbody>
          <tr>
            <th colspan="2">
              {{ $t('institutions.sushi.connectionStatus') }}
            </th>
          </tr>

          <template v-for="row in bars">
            <tr v-if="row.value > 0" :key="row.key">
              <td>
                <v-icon
                  v-if="row.icon"
                  :icon="row.icon"
                  :color="row.iconColor || row.color"
                  start
                />

                {{ row.label }}
              </td>

              <td class="text-right">
                {{ row.valueStr }}
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-sheet>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  to: {
    type: String,
    default: undefined,
  },
});

const { t, locale } = useI18n();

const enabledSushis = computed(() => props.modelValue.filter(
  (sushi) => !sushi.archived && sushi.active && (sushi.endpoint?.active ?? true),
));

const bars = computed(() => {
  const formatter = new Intl.NumberFormat(locale.value, { style: 'percent' });

  const entries = [
    ...sushiStatus.entries(),
    [undefined, { color: 'grey-lighten-3', icon: 'mdi-help-circle-outline', iconColor: 'grey' }],
  ];

  return entries.map(
    ([key, style]) => {
      // Get label from status
      let label;
      switch (key) {
        case 'success':
          label = t('institutions.sushi.operational');
          break;
        case 'unauthorized':
          label = t('institutions.sushi.invalidCredentials');
          break;
        case 'failed':
          label = t('error');
          break;
        default:
          label = t('institutions.sushi.untested');
          break;
      }

      const count = enabledSushis.value.filter((sushi) => key === sushi.connection?.status).length;
      const value = count / enabledSushis.value.length;

      return {
        key,
        label,
        value,
        valueStr: formatter.format(value),
        ...style,
      };
    },
  );
});
</script>
