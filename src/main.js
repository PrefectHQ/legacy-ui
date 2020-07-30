// Base imports
import Vue from 'vue'
import vuetify from '@/plugins/vuetify'
import Router from 'vue-router'
import App from '@/App.vue'

// Plugins
import store from '@/store'
import { defaultApolloProvider } from '@/vue-apollo'
import router from '@/router'

import LogRocket from 'logrocket'

// Filters
import duration from '@/filters/duration'
import {
  roundWhole,
  roundTenths,
  roundHundredths,
  roundThousandths,
  roundTens,
  roundHundreds,
  roundThousands
} from '@/filters/round'
import shorten from '@/filters/shorten'
import filterOnePercent from '@/filters/filterOnePercent'
import { insertedActions, updatedActions } from '@/directives/disable-read-only'

// Functional Components
import TransitionHeight from '@/components/Functional/Transition-Height'

// Prefect icon font
import '@/assets/fonts/prefect-icons/style.scss'

// Global and functional styles
import '@/styles/global.scss'

Vue.config.productionTip = false
Vue.config.devtools = true
Vue.config.performance = true
if (
  process.env.VUE_APP_ENVIRONMENT == 'staging' ||
  process.env.VUE_APP_ENVIRONMENT == 'dev'
) {
  Vue.config.devtools = true
}

const blockedResponses = ['createAPIToken', 'APITokens']
const blockedRequests = ['SetSecret']

if (process.env.NODE_ENV === 'production') {
  LogRocket.init(process.env.VUE_APP_LOG_ROCKET_PUBLIC_ID || '', {
    release: process.env.VUE_APP_BASE_URL,
    network: {
      // Requests in the blockedRequests list
      // will be sanitized from analytics
      requestSanitizer: request => {
        if (request.headers['authorization']) {
          request.headers['authorization'] = ''
        }

        if (!request.body) return request
        try {
          let res = JSON.parse(request.body)
          if (!res || !res.operationName) return request

          blockedRequests.forEach(term => {
            if (res.operationName == term) {
              request.body = null
            }
          })
        } catch (e) {
          request.body = null
        }

        return request
      },
      // Responses in the blockedResponses list
      // will be sanitized from analytics
      responseSanitizer: response => {
        if (!response.body) return response
        try {
          let res = JSON.parse(response.body)
          if (!res || !res.data) return response

          blockedResponses.forEach(term => {
            if (res.data[term]) {
              response.body = null
            }
          })
        } catch (e) {
          response.body = null
        }
        return response
      }
    }
  })
}

Vue.directive('disable-read-only-user', {
  inserted: (el, binding) => insertedActions(el, binding),
  update: (el, binding) => updatedActions(el, binding)
})

// Router
Vue.use(Router)

// Vue Global Error Handler
Vue.config.errorHandler = function(error, vm, info) {
  if (process.env.NODE_ENV === 'development')
    // eslint-disable-next-line no-console
    console.log('Vue Global Error Handler', JSON.stringify({ error, vm, info }))
  LogRocket.captureException(error)
  LogRocket.log('Related to error', vm, info)
}

// Catch the rest
window.onerror = function(error) {
  if (process.env.NODE_ENV === 'development')
    // eslint-disable-next-line no-console
    console.log('Window Error Handler', error)
  LogRocket.captureException(error)
}

// Add Filters
Vue.filter('duration', duration)
Vue.filter('shorten', shorten)
Vue.filter('filterOnePercent', filterOnePercent)

Vue.filter('roundWhole', roundWhole)
Vue.filter('roundTenths', roundTenths)
Vue.filter('roundHundredths', roundHundredths)
Vue.filter('roundThousandths', roundThousandths)
Vue.filter('roundTens', roundTens)
Vue.filter('roundHundreds', roundHundreds)
Vue.filter('roundThousands', roundThousands)

Vue.component('height-transition', TransitionHeight)

// Create application
new Vue({
  vuetify,
  router,
  store,
  apolloProvider: defaultApolloProvider,
  render: h => h(App)
}).$mount('#app')
