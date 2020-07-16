// Core
import Vue from 'vue'
import Vuex from 'vuex'

// Plugins
import LogRocket from 'logrocket'
import createPlugin from 'logrocket-vuex'

// Modules
import agent from '@/store/agent'
import auth0 from '@/store/auth0'
import license from '@/store/license'
import refresh from '@/store/refresh'
import sideDrawer from '@/store/sideDrawer'
import sideNav from '@/store/sideNav'
import tenant from '@/store/tenant'
import user from '@/store/user'
import alert from '@/store/alert'

Vue.use(Vuex)

const logrocketPlugin = createPlugin(LogRocket, mutation => {
  if (
    mutation.type === 'setAuthenticationTokens' ||
    mutation.type === 'setAuthorizationToken' ||
    mutation.type === 'setUser'
  ) {
    return {
      type: mutation.type
    }
  }

  return mutation
})

const store = new Vuex.Store({
  modules: {
    agent,
    auth0,
    license,
    refresh,
    sideDrawer,
    sideNav,
    tenant,
    user,
    alert
  },
  strict: process.env.NODE_ENV !== 'production',
  plugins: [logrocketPlugin]
})

export default store
