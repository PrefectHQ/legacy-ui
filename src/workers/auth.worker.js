import { client } from '@/workers/util/apollo'

const ports = []
const channelPorts = []

/*
    values in the tokens Array<Object> take the form:
    
    interface TenantTokens {
        tenantId: string
        authorizationToken: string
        refreshToken: string
    }

*/
const state = {
  idToken: null,
  tokens: []
}

const postToConnections = payload => {
  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage(payload)
  }
}

const postToChannelPorts = payload => {
  for (let i = 0; i < ports.length; ++i) {
    channelPorts[i]?.postMessage(payload)
  }
  channelPorts.length = 0
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)

  // Immediately post idToken to the connection, if we have it
  if (state.idToken) {
    port.postMessage({
      type: 'idToken',
      payload: state.idToken
    })
  }

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect
