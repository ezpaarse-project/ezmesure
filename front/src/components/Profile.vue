<template>
  <div>
    <div class="page-header">
        <h1>Profile</h1>
    </div>

    <div v-if="auth.user">
      <form>
        <div class="form-group">
          <label for="idp">IDP</label>
          <input v-model="auth.user.idp" type="text" class="form-control" id="idp" placeholder="IDP" readonly>
        </div>
        <div class="form-group">
          <label for="username">Name</label>
          <input v-model="auth.user.username" type="text" class="form-control" id="username" placeholder="Name">
        </div>
        <div class="form-group">
          <label for="email">Email address</label>
          <input v-model="auth.user.mail" type="email" class="form-control" id="email" placeholder="Email">
        </div>
        <div class="form-group">
          <label for="org">Organization</label>
          <input v-model="auth.user.org" type="text" class="form-control" id="org" placeholder="Organization">
        </div>
        <button type="submit" class="btn btn-default">Submit</button>
      </form>
    </div>

    <div v-else>
      <p>You are <strong>not</strong> authenticated.</p>
      <a v-bind:href="redirectUrl">Sign in</a>
    </div>

    <button v-on:click="checkAuth()">pouet</button>
  </div>
</template>

<script>
  import auth from '../auth'

  export default {
    data() {
      return {
        auth,
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`
      }
    },
    methods: {
      checkAuth() {
        auth.checkAuth(this)
      }
    }
  }
</script>