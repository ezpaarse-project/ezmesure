<template>
  <v-card :raised="drag" class="dropzone">
    <v-card-text class="text-center grey--text">
      <v-layout column>
        <v-flex>
          <v-icon medium class="grey--text">
            mdi-cloud-upload
          </v-icon>
        </v-flex>
        <v-flex>Cliquez ou glissez-déposez vos fichiers ici</v-flex>
      </v-layout>
    </v-card-text>

    <input
      ref="fileInput"
      type="file"
      accept=".csv,.gz"
      multiple
      :disabled="false"
      @dragenter="drag = true"
      @dragleave="drag = false"
      @drop="drag = false"
      @change="onFileChange"
    >
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      drag: false,
    };
  },
  methods: {
    onFileChange($event) {
      const files = $event.target.files || $event.dataTransfer.files;
      this.$emit('change', Array.from(files));
      this.$refs.fileInput.value = null;
    },
  },
};
</script>

<style scoped>
.dropzone {
  position: relative;
}
.dropzone input {
  cursor: pointer;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
</style>
