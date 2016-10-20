import { router, http } from '../app'

const PROFILE_URL = '/api/auth'
const TOKEN_URL   = '/api/auth/token'

export default {

  authenticated: false,
  user: null,

  logout() {
    localStorage.removeItem('token')
    this.authenticated = false
    this.user = null
  },

  checkAuth(context) {
    // this.authenticated = !!localStorage.getItem('token')

    http.get(PROFILE_URL).then(response => {

      return response.json().then(data => {
        this.authenticated = true
        this.user = data;
      })
    }, err => {
      context.authError = err
      this.user = null;
    })
  },

  getAuthHeader() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
}
