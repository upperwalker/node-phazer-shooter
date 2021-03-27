import axios from 'axios'
export default class AuthState {

    constructor() {
      this._authentificated = false;
      this._username = '';
    }
  
    async getAuth() {
			const payload = await axios.get('auth')
	    this.state = payload.data
    }

    async login(credentials) {
      const payload = await axios.post('login', credentials)
      await this.getAuth()
    }

    get authentificated() {
      return this._authentificated;
    }

    get username() {
        return this._username;
    }
  
    set state(newState) {
        return Object.assign(this, newState)
    }
  }
  