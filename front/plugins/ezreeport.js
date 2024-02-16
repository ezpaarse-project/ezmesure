// eslint-disable-next-line import/no-extraneous-dependencies
import Vue from 'vue';

import ezReeportVuePlugin from '@ezpaarse-project/ezreeport-vue';
import '@ezpaarse-project/ezreeport-vue/dist/style.css';

// eslint-disable-next-line func-names
const ezrNuxt = ({ i18n }) => {
  Vue.use(ezReeportVuePlugin, { i18n });
};

export default ezrNuxt;
