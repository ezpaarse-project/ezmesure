<template>
  <v-card outlined :style="borderStyle">
    <v-card-title>{{ space?.name }}</v-card-title>
    <v-card-subtitle>
      <v-chip
        small
        label
        outlined
        class="mr-1"
      >
        <v-icon left>
          mdi-identifier
        </v-icon>
        {{ spaceId }}
      </v-chip>

      <v-chip
        small
        label
        outlined
        :color="spaceColor"
      >
        {{
          $te(`spaces.types.${space.type}`)
            ? $t(`spaces.types.${space.type}`)
            : space.type
        }}
      </v-chip>
    </v-card-subtitle>

    <template v-if="space?.description">
      <v-divider />
      <v-card-title>{{ $t('description') }}</v-card-title>
      <v-card-text>
        {{ space?.description }}
      </v-card-text>
    </template>

    <v-card-actions v-if="$slots.actions">
      <v-btn
        :href="spaceLink"
        small
        text
      >
        <v-icon left>
          mdi-open-in-app
        </v-icon>
        {{ $t('open') }}
      </v-btn>
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script>
const colors = new Map([
  ['ezpaarse', 'teal'],
  ['counter5', 'red'],
]);

export default {
  props: {
    space: {
      type: Object,
      default: () => ({}),
    },
    namespace: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    borderStyle() {
      return {
        borderWidth: '2px',
        borderColor: this.spaceColor,
      };
    },
    spaceId() {
      return this.namespace ? `${this.namespace}-${this.space?.id}` : this.space?.id;
    },
    spaceColor() {
      return colors.get(this.space?.type) || 'grey';
    },
    spaceLink() {
      return `/kibana/s/${this.spaceId}`;
    },
  },
};
</script>
