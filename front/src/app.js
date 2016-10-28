import Vue from 'vue'
import VueRouter from 'vue-router';
import VueResource from 'vue-resource'

import App from './components/App.vue'
import Home from './components/Home.vue'
import Profile from './components/Profile.vue'
import Navigation from './components/Navigation.vue'
import NotFound from './components/NotFound.vue'

Vue.use(VueRouter)
Vue.use(VueResource)
Vue.component('navigation', Navigation)

export var http = Vue.http

import auth from './auth'
auth.checkAuth()

const routes = [
  { path: '/', component: Home },
  { path: '/profile', component: Profile },
  { path: '*', component: NotFound }
]

export const router = new VueRouter({
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
