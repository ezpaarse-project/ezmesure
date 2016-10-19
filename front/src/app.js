import Vue from 'vue'
import VueRouter from 'vue-router';

import App from './components/App.vue'
import Home from './components/Home.vue'
import Register from './components/Register.vue'
import Navigation from './components/Navigation.vue';
import NotFound from './components/NotFound.vue';

Vue.use(VueRouter);
Vue.component('navigation', Navigation);

const routes = [
  { path: '/', component: Home },
  { path: '/register', component: Register },
  { path: '*', component: NotFound }
]

const router = new VueRouter({
  hashbang: false,
  mode: 'hash',
  linkActiveClass: 'active',
  routes
});

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
