import { OktaAuth } from '@okta/okta-auth-js'
import { mapActions } from 'vuex'
const { VUE_APP_PUBLIC_CLIENT_ID, VUE_APP_PUBLIC_ISSUER } = process.env

const authClient = new OktaAuth({
  clientId: VUE_APP_PUBLIC_CLIENT_ID,
  issuer: VUE_APP_PUBLIC_ISSUER,
  redirectUri: 'http://localhost:8080',
  scopes: ['openid', 'profile', 'email'],
  responseType: 'token',
  //   authorizeUrl: 'http://localhost:8081',
  testing: {
    disableHttpsCheck: true
  }
})

export const authMixin = {
  data() {
    return {
      email: null,
      error: null,
      password: null
    }
  },
  methods: {
    ...mapActions('auth', ['authenticate']),
    async checkSession() {
      const session = await authClient.session.exists()
      // eslint-disable-next-line
      console.log(session)
    },
    async getSession() {
      const sessionExists = await authClient.session.exists()

      if (sessionExists) {
        await this.getTokens()
      }
    },
    async getTokens(sessionToken) {
      const { tokens } = await authClient.token.getWithoutPrompt({
        responseType: 'id_token',
        sessionToken: sessionToken // this is optional depending on session cookies
      })

      this.authenticate(tokens)
    },
    async login() {
      // eslint-disable-next-line
      console.log('login pressed')

      const { sessionToken } = await authClient.signInWithCredentials({
        username: this.email,
        password: this.password
      })

      await this.getTokens(sessionToken)

      this.$router.push({ name: 'dashboard' })
    },
    loginWithGitHub() {
      // eslint-disable-next-line
      console.log('logging in with GitHub')
    },
    loginWithGoogle() {
      // eslint-disable-next-line
      console.log('logging in with Google')
    }
  }
}
