<template>
  <v-dialog
    v-model="show"
    scrollable
    width="600"
  >
    <SpacesManager :institution-id="institution?.id" @change="hasChanged = true">
      <template #actions>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="show = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </template>
    </SpacesManager>
  </v-dialog>
</template>

<script>
import SpacesManager from '~/components/SpacesManager.vue';

export default {
  components: {
    SpacesManager,
  },
  data() {
    return {
      show: false,
      hasChanged: false,
      institution: null,
    };
  },
  watch: {
    show(visible) {
      if (!visible && this.hasChanged) {
        this.$emit('updated');
      }
    },
  },
  methods: {
    display(institution) {
      this.institution = institution;
      this.hasChanged = false;
      this.show = true;
    },
  },
};
</script>
