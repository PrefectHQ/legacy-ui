import LogRocket from 'logrocket'

const blockedResponses = [
  'CreateAPIToken',
  'APITokens',
  'CreateRunnerToken',
  'CreateAPIKey'
]
const blockedRequests = ['SetSecret']

const initializeLogrocket = () => {
  if (
    process.env.VUE_APP_LOG_ROCKET_PUBLIC_ID &&
    process.env.VUE_APP_BACKEND === 'CLOUD'
  ) {
    LogRocket.init(process.env.VUE_APP_LOG_ROCKET_PUBLIC_ID, {
      release: process.env.VUE_APP_RELEASE_TIMESTAMP,
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
}

try {
  initializeLogrocket()
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize LogRocket: ', e)
}
