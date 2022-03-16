import store from '@/store'

const {
  VUE_APP_SF_SFCID,
  VUE_APP_SF_TEAM,
  VUE_APP_SF_URL1,
  VUE_APP_SF_URL2,
  VUE_APP_SF_BASE_LIVE_AGENT_CONTENT_URL,
  VUE_APP_SF_DEPLOYMENT_ID,
  VUE_APP_SF_BUTTON_ID,
  VUE_APP_SF_BASE_LIVE_AGENT_URL
} = process.env

export const initializeSalesforceChat = () => {
  const license = store.getters['license/license']

  const initESW = function(gslbBaseURL) {
    window.embedded_svc.settings.displayHelpButton = true // Or false
    window.embedded_svc.settings.language = '' // For example, enter 'en' or 'en-US'
    window.embedded_svc.settings.defaultMinimizedText = 'Chat With Us'
    window.embedded_svc.settings.enabledFeatures = ['LiveAgent']
    window.embedded_svc.settings.entryFeature = 'LiveAgent'
    window.embedded_svc.settings.extraPrechatFormDetails = [
      {
        label: 'Account Name',
        transcriptFields: ['AccountId'],
        value: license.terms.salesforce_account_id || ''
      }
    ]
    window.embedded_svc.init(
      VUE_APP_SF_URL1,
      VUE_APP_SF_URL2,
      gslbBaseURL,
      VUE_APP_SF_SFCID,
      VUE_APP_SF_TEAM,
      {
        baseLiveAgentContentURL: VUE_APP_SF_BASE_LIVE_AGENT_CONTENT_URL,
        deploymentId: VUE_APP_SF_DEPLOYMENT_ID,
        buttonId: VUE_APP_SF_BUTTON_ID,
        baseLiveAgentURL: VUE_APP_SF_BASE_LIVE_AGENT_URL,
        eswLiveAgentDevName: VUE_APP_SF_TEAM,
        isOfflineSupportEnabled: false
      }
    )
  }

  if (!window.embedded_svc) {
    const s = document.createElement('script')
    s.setAttribute(
      'src',
      'https://prefect.my.salesforce.com/embeddedservice/5.0/esw.min.js'
    )
    s.onload = function() {
      initESW(null)
    }
    document.body.appendChild(s)
  } else {
    initESW('https://service.force.com')
  }
}
