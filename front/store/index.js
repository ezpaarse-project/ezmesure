export default {
  state: () => ({
    establishments: [],
    establishment: {
      organisation: {
        name: '',
        uai: '',
        website: '',
        logoUrl: '',
      },
      contacts: [
        {
          fullName: '',
          email: '',
          type: [],
          confirmed: false,
        },
      ],
      index: {
        count: 0,
        prefix: '',
        suggested: '',
      },
    },
  }),
  actions: {
    async getEstablishment({ commit, state }) {
      return this.$axios.$get('/correspondents/myestablishment')
        .then(establishment => commit('setEstablishment', establishment.length ? establishment[0] : state.establishment))
        .catch(() => {});
    },
    setEstablishment({ commit }, establishment) {
      commit('setEstablishment', establishment);
    },
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
    storeOrUpdateEstablishment({ commit }, establishment) {
      return this.$axios.$post('/correspondents/', establishment, {
        headers: {
          // eslint-disable-next-line no-underscore-dangle
          'Content-Type': `multipart/form-data; boundary=${establishment._boundary}`,
        },
      });
    },
  },
  mutations: {
    setEstablishments(state, establishments) {
      state.establishments = establishments;
    },
    setEstablishment(state, establishment) {
      state.establishment = establishment;
    },
  },
};
