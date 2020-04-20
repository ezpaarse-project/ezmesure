export default {
  state: () => ({
    establishments: [],
  }),
  actions: {
    async getEstablishments({ commit }) {
      return this.$axios.$get('/correspondents/list')
        .then(establishments => commit('setEstablishments', establishments))
        .catch(() => commit('setEstablishments', []));
    },
    // eslint-disable-next-line no-unused-vars
    deleteEstablishments({ commit }, ids) {
      return this.$axios.$post('/correspondents/delete', ids);
    },
    // eslint-disable-next-line no-unused-vars
    updateEstablishment({ commit }, establishment) {
      return this.$axios.$put('/correspondents/update', establishment);
    },
  },
  mutations: {
    setEstablishments(state, establishments) {
      state.establishments = establishments;
    },
  },
};
