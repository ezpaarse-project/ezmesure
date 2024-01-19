<template>
  <div />
</template>

<script>
export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
};
</script>
