import { fallbackApolloClient } from '@/vue-apollo'
import { prefectTenants } from '@/middleware/prefectAuth'

const state = {
  tenant: {
    id: null,
    name: null,
    info: null,
    slug: null,
    role: null,
    licenses: [],
    settings: {},
    prefectAdminSettings: {},
    stripeCustomerID: ''
  },
  tenantIsSet: false,
  tenants: []
}

const getters = {
  defaultTenant(state, rootGetters) {
    const defaultMembershipId = rootGetters['user/defaultMembershipId']
    const defaultTenant = rootGetters['user/memberships']?.find(
      membership => membership.id === defaultMembershipId
    )
    const firstTenant = rootGetters['user/memberships']?.[0] || state.tenants[0]
    if (!defaultMembershipId || rootGetters['api/isServer']) return firstTenant
    return defaultTenant || firstTenant
  },
  role(state) {
    if (state) return state.tenant.role
  },
  tenant(state) {
    return state.tenant
  },
  tenantIsSet(state) {
    return state.tenantIsSet
  },
  tenants(state) {
    return state.tenants
  }
}

const mutations = {
  setTenant(state, tenant) {
    if (!tenant || !Object.keys(tenant).length) {
      throw new Error('passed invalid or empty tenant object')
    }
    state.tenant = { ...tenant }
    state.tenantIsSet = true
  },
  setTenants(state, tenants) {
    if (tenants?.length === 0) {
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
      stripeCustomerID: ''
    }
    state.tenantIsSet = false
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
  async getTenants({ commit, getters }) {
    try {
      const tenants = await prefectTenants()
      commit('setTenants', tenants)
    } catch {
      // Do nothing since the GraphQL error should be logged by Apollo afterware
    }

    return getters['tenants']
  },
  async setCurrentTenant({ commit, dispatch, getters, rootGetters }, slug) {
    try {
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

      commit('setTenant', tenant)

      if (rootGetters['api/isCloud']) {
        // Get our new auth token
        const tenantToken = await fallbackApolloClient.mutate({
          mutation: require('@/graphql/Tenant/tenant-token.gql'),
          variables: {
            tenantId: tenant.id
          },
          fetchPolicy: 'no-cache'
        })

        // Set our new auth token
        await dispatch(
          'auth0/updateAuthorization',
          tenantToken.data.switch_tenant,
          {
            root: true
          }
        )

        // Get the current license
        await dispatch('license/getLicense', null, { root: true })
      }
    } catch (e) {
      throw new Error('Problem setting tenant: ', e)
    }
    return getters['tenant']
  },
  async updateTenantSettings({ commit }, settings) {
    try {
      if (!settings || !Object.keys(settings).length) {
        throw new Error('passed invalid or empty settings object')
      }
      const response = await fallbackApolloClient.mutate({
        mutation: require('@/graphql/Mutations/update-tenant-settings.gql'),
        variables: {
          settings
        },
        error(error) {
          throw error
        }
      })

      const newSettings = response.data.update_tenant_settings.tenant.settings
      commit('updateTenantSettings', newSettings)
    } catch (e) {
      throw new Error('Problem updating tenant settings: ', e)
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
