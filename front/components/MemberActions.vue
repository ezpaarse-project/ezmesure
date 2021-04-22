<template>
  <v-menu>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        small
        color="primary"
        :disabled="isContact"
        v-bind="attrs"
        v-on="on"
      >
        {{ $t('actions') }}
        <v-icon right>
          mdi-menu-down
        </v-icon>
      </v-btn>
    </template>

    <v-list min-width="200">
      <v-list-item
        v-for="action in actions"
        :key="action.icon"
        @click="action.callback()"
      >
        <v-list-item-icon>
          <v-icon>{{ action.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title v-text="action.label" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  props: {
    member: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {};
  },
  computed: {
    isContact() {
      const isTech = this.member?.roles?.includes('tech_contact');
      const isDoc = this.member?.roles?.includes('doc_contact');
      return (isTech || isDoc);
    },
    actions() {
      return [
        {
          icon: 'mdi-shield',
          label: this.$t('institutions.members.changePermissions'),
          callback: () => { this.$emit('permissions'); },
        },
        {
          icon: 'mdi-delete',
          label: this.$t('delete'),
          callback: () => { this.$emit('delete'); },
        },
      ];
    },
  },
};
</script>
