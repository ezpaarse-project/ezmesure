/* eslint-disable import/no-extraneous-dependencies */
import Vue from 'vue';

export default {
  state: () => ({
    drawer: true,
  }),
  actions: {
    SET_DRAWER({ commit }, drawer) {
      commit('setDrawer', drawer);
    },
  },
  mutations: {
    setDrawer(state, drawer) {
      Vue.set(state, 'drawer', drawer);
    },
  },
};
