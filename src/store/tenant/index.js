import { fallbackApolloClient } from '@/vue-apollo'
import { prefectTenants } from '@/middleware/prefectAuth'
import { TokenWorker } from '@/main'

const getTenantTokens = (id, slug) =>
  new Promise((res, rej) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = data => {
      channel.port1.close()
      if (data.type == 'error') {
        rej(data)
      } else {
        res(data.data.payload)
      }
    }

    TokenWorker.port.postMessage(
      { type: 'switch-tenant', payload: { tenantId: id, slug: slug } },
      [channel.port2]
    )
  })

const state = {
  defaultTenant: null,
  tenant: {
    id: null,
    name: null,
    info: null,
    slug: null,
    role: null,
    licenses: [],
    settings: {},
    prefectAdminSettings: {},
    stripe_customer: null
  },
  isLoadingTenant: false,
  tenantIsSet: false,
  tenants: []
}

const getters = {
  defaultTenant(state) {
    return state.defaultTenant
  },
  isLoadingTenant(state) {
    return state.isLoadingTenant
  },
  role(state) {
    return state.tenant.role
  },
  tenant(state) {
    return state.tenant || state.defaultTenant
  },
  tenantIsSet(state) {
    return !!state.tenant?.id
  },
  tenants(state) {
    return state.tenants
  }
}

const mutations = {
  setDefaultTenant(state, tenant) {
    if (
      !tenant ||
      typeof tenant !== 'object' ||
      Array.isArray(tenant) ||
      Object.keys(tenant) < 1
    ) {
      throw new Error('passed invalid or empty tenant object')
    }
    state.defaultTenant = tenant
  },
  setIsLoadingTenant(state, value) {
    if (typeof value !== 'boolean') {
      throw new Error(
        `passed invalid value to setIsLoadingTenant mutation, got ${typeof val}, expected Boolean.`
      )
    }

    state.isLoadingTenant = value
  },
  setTenant(state, tenant) {
    if (
      !tenant ||
      typeof tenant !== 'object' ||
      Array.isArray(tenant) ||
      Object.keys(tenant) < 1
    ) {
      throw new Error('passed invalid or empty tenant object')
    }
    state.tenant = { ...tenant }
  },
  setTenants(state, tenants) {
    if (!tenants || tenants?.length === 0) {
      throw new Error('passed invalid or empty tenant array')
    }
    state.tenants = tenants
  },
  unsetTenant(state) {
    state.tenant = {
      id: null,
      name: null,
      info: null,
      slug: null,
      role: null,
      licenses: [],
      settings: {},
      prefectAdminSettings: {},
      stripe_customer: null
    }
  },
  unsetTenants(state) {
    state.tenants = []
  },
  updateTenantSettings(state, settings) {
    if (!settings || !Object.keys(settings).length) {
      throw new Error('passed invalid or empty settings object')
    }
    state.tenant.settings = settings
  }
}

const actions = {
  async getTenants({ commit, getters, rootGetters }) {
    try {
      const tenants = await prefectTenants(rootGetters['api/isCloud'])
      commit('setTenants', tenants)

      // Make sure the current tenant object is updated
      if (getters['tenantIsSet']) {
        let tenant = getters['tenants']?.find(
          t => t.id === getters['tenant'].id
        )

        tenant.role = rootGetters['user/memberships'].find(
          membership => membership.tenant.id == tenant.id
        )?.role_detail?.name
        commit('setTenant', tenant)
      }
    } catch {
      // Do nothing since the GraphQL error should be logged by Apollo afterware
    }

    return getters['tenants']
  },
  async setCurrentTenant({ commit, dispatch, getters, rootGetters }, slug) {
    slug = slug || getters['defaultTenant']?.slug || getters['tenants'][0]?.slug

    if (!slug) {
      throw new Error(
        'No slug was provided when trying to set the current tenant'
      )
    }

    try {
      commit('setIsLoadingTenant', true)

      let tenant = getters['tenants']?.find(t => t.slug === slug)

      if (!tenant) {
        // If the tenant doesn't exist
        // try to retrieve tenants again

        await dispatch('getTenants')
      }

      tenant = getters['tenants']?.find(t => t.slug === slug)
      if (!tenant) {
        throw new Error("Unable to set current tenant: tenant doesn't exist")
      }

      if (rootGetters['api/isCloud']) {
        // We only need to get new tokens if we have a tenant
        // already - otherwise tokens are fetched through the initial
        // authorization process
        if (getters['tenantIsSet']) {
          let tokens
          if (typeof window.SharedWorker !== 'undefined') {
            tokens = await getTenantTokens(tenant.id, slug)

            // Set our new auth token
            await dispatch('auth/updateAuthorizationTokens', tokens, {
              root: true
            })
          } else {
            // Get our new auth token
            const tenantToken = await fallbackApolloClient.mutate({
              mutation: require('@/graphql/Tenant/tenant-token.gql'),
              variables: {
                tenantId: tenant.id
              },
              fetchPolicy: 'no-cache'
            })

            tokens = tenantToken.data.switch_tenant
            // Set our new auth token
            await dispatch('auth/updateAuthorization', tokens, {
              root: true
            })
          }
        }

        // Get the current license
        await dispatch('license/getLicense', null, { root: true })

        tenant.role = rootGetters['user/memberships'].find(
          membership => membership.tenant.id == tenant.id
        )?.role_detail?.name
      } else {
        tenant.role = 'TENANT_ADMIN'
      }

      commit('setTenant', tenant)
    } catch (e) {
      throw new Error(`Problem setting tenant: ${e}`)
    }

    commit('setIsLoadingTenant', false)
    return getters['tenant']
  },
  async updateTenantSettings({ dispatch }, settings) {
    try {
      if (!settings || !Object.keys(settings).length) {
        throw new Error('passed invalid or empty settings object')
      }
      await fallbackApolloClient.mutate({
        mutation: require('@/graphql/Mutations/update-tenant-settings.gql'),
        variables: {
          settings
        },
        error(error) {
          throw error
        }
      })
      await dispatch('getTenants')
    } catch (e) {
      throw new Error(`Problem updating tenant settings: ${e}`)
    }
  }
}

export default {
  actions,
  getters,
  mutations,
  state,
  namespaced: true
}
