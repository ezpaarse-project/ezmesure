<template>
  <v-dialog
    v-model="show"
    scrollable
    width="600"
  >
    <RepositoriesInstitutionsManager :repository="repository" @change="hasChanged = true">
      <template #actions>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="show = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </template>
    </RepositoriesInstitutionsManager>
  </v-dialog>
</template>

<script>
import RepositoriesInstitutionsManager from '~/components/repositories/RepositoriesInstitutionsManager.vue';

export default {
  components: {
    RepositoriesInstitutionsManager,
  },
  data() {
    return {
      show: false,
      hasChanged: false,
      repository: null,
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
    async display(repository) {
      this.repository = repository;
      this.hasChanged = false;
      this.show = true;
    },
  },
};
</script>
