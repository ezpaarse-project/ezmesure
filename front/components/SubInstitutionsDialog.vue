<template>
  <v-dialog
    v-model="show"
    scrollable
    width="600"
  >
    <SubInstitutionsManager :institution-id="institution?.id" @change="hasChanged = true">
      <template #actions>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="show = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </template>
    </SubInstitutionsManager>
  </v-dialog>
</template>

<script>
import SubInstitutionsManager from '~/components/SubInstitutionsManager.vue';

export default {
  components: {
    SubInstitutionsManager,
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
      if (!visible) {
        this.institution = null;
        if (this.hasChanged) {
          this.$emit('updated');
        }
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
