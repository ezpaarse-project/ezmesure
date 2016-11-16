<template>
  <nav class="navbar navbar-inverse navbar-static-top">
    <div class="navbar-header">
      <router-link to="/" exact class="navbar-brand">
        <img alt="Brand" src="assets/images/logo.png" height="20">
      </router-link>
    </div>
    <ul class="nav navbar-nav">
      <router-link tag="li" to="/" exact>
        <a>Accueil</a>
      </router-link>
      <router-link tag="li" to="/profile" exact>
        <a>Profil</a>
      </router-link>
      <li>
        <a href="/kibana/">Tableaux de bord</a>
      </li>
    </ul>
  </nav>
</template>

<script>
  export default {
    data() {
      return {}
    }
  }
</script>