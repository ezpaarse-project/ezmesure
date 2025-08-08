<template>
  <v-container style="height: 100%;">
    <iframe
      ref="iframe"
      title="Swagger UI"
      width="100%"
      height="100%"
      frameborder="0"
    />
  </v-container>
</template>

<script setup>
import setupSwaggerUI from '@/lib/swaggerUI';

const iframe = useTemplateRef('iframe');

function setupIframe() {
  if (!iframe.value) {
    return;
  }

  const doc = iframe.value.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(setupSwaggerUI());
    doc.close();
  }
}

onMounted(() => {
  setupIframe();
});
</script>
