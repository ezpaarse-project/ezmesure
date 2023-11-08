<template>
  <v-menu
    :close-on-content-click="false"
    :nudge-width="200"
    offset-y
    bottom
    left
    v-bind="$attrs"
  >
    <template #activator="props">
      <slot name="activator" v-bind="props">
        <v-badge
          color="primary"
          :content="nbSelected"
          :value="badge && nbSelected"
          overlap
          small
        >
          <v-btn
            :text="!iconButton"
            :icon="iconButton"
            small
            v-bind="props.attrs"
            v-on="props.on"
          >
            <v-icon small>
              {{ icon }}
            </v-icon>
            <v-icon v-if="!iconButton">
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </v-badge>
      </slot>
    </template>

    <v-card>
      <v-list flat>
        <v-list-item-group
          :value="value"
          multiple
          @change="$emit('input', $event)"
        >
          <v-list-item
            v-for="item in items"
            :key="item?.[itemValue]"
            :value="item?.[itemValue]"
          >
            <template #default="{ active }">
              <v-list-item-action>
                <v-checkbox
                  :input-value="active"
                  :color="color"
                />
              </v-list-item-action>

              <v-list-item-content>
                <v-list-item-title>{{ item?.[itemText] }}</v-list-item-title>
              </v-list-item-content>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    items: {
      type: Array,
      default: () => [],
    },
    itemText: {
      type: String,
      default: () => 'text',
    },
    itemValue: {
      type: String,
      default: () => 'value',
    },
    color: {
      type: String,
      default: () => 'primary',
    },
    icon: {
      type: String,
      default: () => 'mdi-form-select',
    },
    iconButton: {
      type: Boolean,
      default: () => false,
    },
    badge: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {};
  },
  computed: {
    nbSelected() {
      return this.value?.length;
    },
  },
};
</script>
