import { http } from '../app'

const PROFILE_URL  = '/api/profile'
const TOKEN_URL    = '/api/profile/token'
const PASSWORD_URL = '/api/profile/password'
const RESET_URL    = '/api/profile/password/reset'

export default {

  authenticated: false,
  user: null,
  token: null,

  checkAuth() {
    http.get(PROFILE_URL)
    .then(response => response.json())
    .then(data => {
      this.authenticated = true
      this.user = data;

      http.get(TOKEN_URL)
      .then(response => response.text())
      .then(token => {
        this.token = token;
      });
    })
    .catch(err => {
      this.user = null;
    });
  },

  resetPassword() {
    return http.put(RESET_URL)
  },

  logout() {
    localStorage.removeItem('token')
    this.authenticated = false
    this.user = null
  },

  getAuthHeader() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
}
