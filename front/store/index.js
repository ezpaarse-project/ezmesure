/* eslint-disable import/no-extraneous-dependencies */
import Vue from 'vue';
import Vuex from 'vuex';
import auth from './auth';
import snacks from './snacks';

const store = () => new Vuex.Store({
  modules: {
    auth,
    snacks,
  },
  state: {
    establishments: [],
    establishment: null,
    drawer: true,
  },
  actions: {
    async getEstablishment({ commit }) {
      return this.$axios.$get('/correspondents/myestablishment')
        .then(establishment => commit('setEstablishment', establishment))
        .catch(() => {});
    },
    setEstablishment({ commit }, establishment) {
      commit('setEstablishment', establishment);
    },
    getEstablishments({ commit }) {
      return this.$axios.$get('/correspondents/list')
        .then((establishments) => {
          commit('setEstablishments', establishments);
        })
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
    SET_ESTABLISHMENT({ commit }, value) {
      commit('setEstablishments', value);
    },
    SET_DRAWER({ commit }, drawer) {
      commit('setDrawer', drawer);
    },
  },
  mutations: {
    setEstablishments(state, establishments) {
      Vue.set(state, 'establishments', establishments);
    },
    setEstablishment(state, establishment) {
      Vue.set(state, 'establishment', establishment);
    },
    setDrawer(state, drawer) {
      Vue.set(state, 'drawer', drawer);
    },
  },
});

export default store;
