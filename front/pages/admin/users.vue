<template>
  <section>
    <ToolBar title="Administration: Utilisateurs">
      <slot>
        <v-spacer />

        <v-btn text>
          <v-icon left>
            mdi-refresh
          </v-icon>
          Actualiser
        </v-btn>
      </slot>
    </ToolBar>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
  },
  methods: {
  },
};
</script>