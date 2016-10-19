<template>
  <div>
    <div class="page-header">
        <h1>Register</h1>
    </div>

    <form>
      <div class="form-group">
        <label for="idp">IDP</label>
        <input v-model="user.idp" type="text" class="form-control" id="idp" placeholder="IDP" readonly>
      </div>
      <div class="form-group">
        <label for="username">Name</label>
        <input v-model="user.username" type="text" class="form-control" id="username" placeholder="Name">
      </div>
      <div class="form-group">
        <label for="email">Email address</label>
        <input v-model="user.mail" type="email" class="form-control" id="email" placeholder="Email">
      </div>
      <div class="form-group">
        <label for="org">Organization</label>
        <input v-model="user.org" type="text" class="form-control" id="org" placeholder="Organization">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" class="form-control" id="password" placeholder="Password">
      </div>
      <button type="submit" class="btn btn-default">Submit</button>
    </form>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        user: {
          idp: 'some:idp',
          mail: 'some@mail.com'
        }
      }
    }
  }
</script>