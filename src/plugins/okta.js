import Vue from 'vue'

// import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'

const { VUE_APP_PUBLIC_CLIENT_ID, VUE_APP_PUBLIC_ISSUER } = process.env

// const config = new OktaAuth({
//   clientId: VUE_APP_PUBLIC_CLIENT_ID,
//   issuer: VUE_APP_PUBLIC_ISSUER,
//   redirectUri: 'http://localhost:8080/login',
//   scopes: ['openid', 'profile', 'email'],
//   pkce: true,
//   testing: {
//     disableHttpsCheck: true
//   }
// })

const config = {
  clientId: VUE_APP_PUBLIC_CLIENT_ID,
  issuer: VUE_APP_PUBLIC_ISSUER,
  redirectUri: 'http://localhost:8080/login',
  scopes: ['openid', 'profile', 'email'],
  pkce: true,
  testing: {
    disableHttpsCheck: true
  }
}

Vue.use(OktaVue, { ...config })

export default config
