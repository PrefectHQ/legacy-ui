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

// Apex charts component
import VueApexCharts from 'vue-apexcharts'
Vue.use(VueApexCharts)
Vue.component('apexchart', VueApexCharts)

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
  Vue.config.performance = true
}

const blockedResponses = ['CreateAPIToken', 'APITokens', 'CreateRunnerToken']
const blockedRequests = ['SetSecret']

if (
  process.env.NODE_ENV === 'production' &&
  process.env.VUE_APP_LOG_ROCKET_PUBLIC_ID &&
  process.env.VUE_APP_BASE_URL?.includes('cloud.prefect.io')
) {
  LogRocket.init(process.env.VUE_APP_LOG_ROCKET_PUBLIC_ID, {
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
Vue.config.errorHandler = function(error, vm, trace) {
  if (error?.message?.includes("Cannot read property '_observe' of null"))
    return
  if (process.env.NODE_ENV === 'development')
    // eslint-disable-next-line no-console
    console.log('Vue Global Error Handler', { error, vm, trace })
  LogRocket.captureException(error)
  LogRocket.log('Related to error', vm, error)
}

Vue.config.warnHandler = function(error, vm, trace) {
  if (error?.message?.includes("Cannot read property '_observe' of null"))
    return
  if (process.env.NODE_ENV === 'development')
    // eslint-disable-next-line no-console
    console.log('Vue Global Warn Handler', { error, vm, trace })
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

// This is a global mixin used to clean up any
// references a component may have after it's destroyed.
// It's a pretty heavy-handed approach to what we're trying
// to accomplish but Vue doesn't seem to be removing all references
// itself, which is leading to large memory leaks on data-heavy pages
// as Apollo polls and when navigating between pages.
// This could be more elegant and may be fixed by upgrading to Vue 3.
const blockedProps = [
  '$data',
  '$listeners',
  'theme',
  '$attrs',
  '$props',
  'timeline',
  'windowGroup',
  'expansionPanel',
  'expansionPanels',
  'tabsBar',
  'listItemGroup',
  'btnToggle'
]

Vue.mixin({
  destroyed() {
    const prepForGC = () => {
      try {
        this.$el?.remove()
        this.elm = null
        this.$el = null
        this.parent = null
        this.$parent = null
        this.data = null
        // this.$data = null // Unsetting this throws internal Vue errors
        // this.options = null // Unsetting this throws internal Vue errors
        this.$options = null
        this.$vnode = null
        this.listeners = null
        // this.$listeners = null // Unsetting this throws internal Vue errors
        this._vnode = null
        this._watcher = null
        this._watchers = null
        this._computedWatchers = null
        this.$slots = null
        this.slots = null
        this.$scopedSlots = null
        this.scopedSlots = null
        this.$children = null
        this.children = null
        this.store = null
        this.$store = null

        // $apollo has no setter so we clear props instead
        if (this.$apollo) {
          this.$apollo.vm = null
        }

        Object.keys(this).forEach(key => {
          try {
            !blockedProps.includes(key) &&
              !(key in this[key]?.$props) &&
              (this[key] = null)
          } catch {
            /* */
          }
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error in destroyed garbage collector mixin', e)
      }
    }

    // If the element has already been removed from the DOM
    // we run the GC prep method immediately
    if (!document.body.contains(this.$el)) {
      prepForGC()
      return
    }

    // Otherwise we can assume there's some sort of transition
    // on the component and we wait for it to complete
    // Note: this is obviously rough but Observer methods
    // were performing exceedingly poorly.
    setTimeout(prepForGC, 1500)
  }
})

// Create application
// eslint-disable-next-line no-unused-vars
let PrefectUI = new Vue({
  vuetify,
  router,
  store,
  apolloProvider: defaultApolloProvider,
  render: h => h(App)
}).$mount('#app')

// This can be used in testing to destroy the entire application and remove
// the root node associated with it.
// Use this to test persistant objects that V8 can't garbage collect.
// function DestroyPrefectUI() {
//   PrefectUI.$destroy()
//   PrefectUI = null
// }
// setTimeout(DestroyPrefectUI, 30000)

try {
  if (navigator?.platform !== 'MacIntel') {
    document.body.classList.add('not-mac')
  }
} catch {
  // eslint-disable-next-line no-console
  console.info('Unable to apply platform-specific scrollbar styles.')
}
