import { fallbackApolloClient } from '@/vue-apollo'
import { prefectTenants } from '@/middleware/prefectAuth'

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
    stripeCustomerID: ''
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
    return state.tenant
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
      stripeCustomerID: ''
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
    } catch {
      // Do nothing since the GraphQL error should be logged by Apollo afterware
    }

    return getters['tenants']
  },
  async setCurrentTenant({ commit, dispatch, getters, rootGetters }, slug) {
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

        tenant.role = rootGetters['user/memberships'].find(
          membership => membership.tenant.id == tenant.id
        )?.role
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
