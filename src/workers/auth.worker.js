import { client } from '@/workers/util/apollo'

const ports = []
const channelPorts = []

/*
    values in the tokens Array<Object> take the form:
    
    interface TenantTokens {
        tenantId: string
        authorizationToken: string
        idToken: string
        refreshToken: string
    }

*/
const state = {
  tokens: []
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect
