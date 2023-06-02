<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    :nudge-width="200"
    offset-y
    bottom
    left
    @input="resetForm"
  >
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="{ ...scope, saving }" />
    </template>

    <v-card>
      <v-card-text>
        <v-alert
          type="error"
          dense
          outlined
          dismissible
          :value="!!errorMessage"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form
          :id="formId"
          ref="spaceForm"
          v-model="formIsValid"
          @submit.prevent="saveSpace"
        >
          <v-select
            v-model="spaceType"
            :items="spaceTypes"
            :label="$t('type')"
            outlined
            dense
            @change="applyPreset"
          />
          <v-text-field
            v-model="spaceId"
            :label="`${$t('identifier')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            :prefix="`${namespace}-`"
            outlined
            autofocus
            required
            dense
          />
          <v-text-field
            v-model="spaceName"
            :label="`${$t('name')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            required
            dense
          />
          <v-text-field
            v-model="spaceInitials"
            :label="$t('initials')"
            :rules="[v => !v || v.length <= 2 || $t('maxLength', { n: 2 })]"
            outlined
            dense
          />
          <v-textarea
            v-model="spaceDescription"
            :label="$t('description')"
            outlined
            dense
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          text
          @click="show = false"
        >
          {{ $t('cancel') }}
        </v-btn>
        <v-btn
          type="submit"
          :form="formId"
          color="primary"
          :loading="saving"
          :disabled="!formIsValid"
        >
          {{ $t(editMode ? 'update' : 'add') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
let counter = 0;

export default {
  props: {
    institution: {
      type: Object,
      default: () => ({}),
    },
    space: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    counter += 1;

    return {
      show: false,
      saving: false,
      formIsValid: false,

      formId: `space-form-${counter}`,
      errorMessage: '',

      spaceId: '',
      spaceType: 'ezpaarse',
      spaceName: '',
      spaceInitials: '',
      spaceDescription: '',
    };
  },
  computed: {
    editMode() {
      return !!this.space?.id;
    },
    spaceTypes() {
      return [
        { text: this.$t('spaces.types.ezpaarse'), value: 'ezpaarse' },
        { text: this.$t('spaces.types.counter5'), value: 'counter5' },
      ];
    },
    namespace() {
      return this.institution?.namespace;
    },
  },
  methods: {
    resetForm() {
      this.$refs.spaceForm?.resetValidation?.();
      this.errorMessage = '';

      this.spaceType = this.space?.type || 'ezpaarse';
      this.spaceId = this.space?.id || '';
      this.spaceName = this.space?.name || '';
      this.spaceInitials = this.space?.initials || '';
      this.spaceDescription = this.space?.description || '';

      if (!this.space?.id) {
        this.applyPreset();
      }
    },

    applyPreset() {
      const spaceDesc = this.$te(`spaces.descriptions.${this.spaceType}`)
        ? this.$t(`spaces.descriptions.${this.spaceType}`)
        : this.spaceType;
      this.spaceId = this.spaceType.toLowerCase();
      this.spaceName = `${this.institution?.name} (${this.spaceType})`;
      this.spaceDescription = `${spaceDesc} (id: ${this.namespace}-${this.spaceId})`;
    },

    async saveSpace() {
      this.saving = true;
      this.errorMessage = '';

      try {
        const { data: newSpace, status } = await this.$axios({
          method: this.editMode ? 'PATCH' : 'POST',
          url: this.editMode ? `/kibana-spaces/${this.space.id}` : '/kibana-spaces',
          data: {
            id: this.spaceId,
            type: this.spaceType,
            name: this.spaceName,
            initials: this.spaceInitials,
            description: this.spaceDescription,
            institutionId: this.institution?.id,
          },
        });

        this.$emit(status === 201 ? 'space-created' : 'space-updated', newSpace);
        this.show = false;
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.saving = false;
    },
  },
};
</script>
