<template>
  <v-dialog
    v-model="show"
    max-width="400px"
  >
    <v-card>
      <v-card-title>
        {{ $t('areYouSure') }}
      </v-card-title>

      <v-card-text>
        {{ $t('institutions.deleteNbInstitutions', { number: institutions.length }) }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="removing" @click="deleteInstitutions">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
        <v-btn outlined @click="show = false">
          {{ $t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      removing: false,
      institutions: [],
    };
  },
  methods: {
    confirmDelete(institutions = []) {
      this.institutions = Array.isArray(institutions) ? institutions : [];
      this.show = true;
    },

    async deleteInstitutions() {
      if (this.institutions.length === 0) {
        return;
      }

      this.removing = true;

      const requests = this.institutions.map(async (item) => {
        let deleted = false;
        try {
          await this.$axios.$delete(`/institutions/${item.id}`);
          deleted = true;
        } catch (e) {
          deleted = false;
        }
        return { item, deleted };
      });

      const results = await Promise.all(requests);

      const { deleted, failed } = results.reduce((acc, result) => {
        const { item } = result;

        if (result.deleted) {
          acc.deleted.push(item);
        } else {
          this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id: item.name || item.id }));
          acc.failed.push(item);
        }
        return acc;
      }, { deleted: [], failed: [] });

      if (failed.length > 0) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: failed.length }));
      }
      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));
      }

      this.removing = false;
      this.show = false;
      this.$emit('removed', deleted.map((d) => d.id));
    },
  },
};
</script>
