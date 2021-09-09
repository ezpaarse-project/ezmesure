/* eslint-disable import/no-extraneous-dependencies */
import Vue from 'vue';

export default {
  namespaced: true,
  state: () => ({
    drawer: false,
  }),
  actions: {
    setDrawer({ commit }, drawer) {
      commit('setDrawer', drawer);
    },
  },
  mutations: {
    setDrawer(state, drawer) {
      Vue.set(state, 'drawer', drawer);
    },
  },
};
