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
    } catch (error) {
      // Do nothing for now
      // throw error
    }
  },
  async getTenant({ rootGetters, commit, dispatch }, membershipId) {
    if (rootGetters['api/backend'] == 'SERVER') {
      await dispatch('getTenants')
      await dispatch('getServerTenant')
      return
    }

    let tenantId
    try {
      const tenantIDQuery = await fallbackApolloClient.query({
        query: require('@/graphql/Tenant/membership.gql'),
        variables: {
          membershipId: membershipId
        },
        fetchPolicy: 'no-cache'
      })
      tenantId = tenantIDQuery.data.membership[0].tenant.id

      const getTenantToken = await fallbackApolloClient.mutate({
        mutation: require('@/graphql/Tenant/tenant-token.gql'),
        variables: {
          tenantId: tenantId
        },
        fetchPolicy: 'no-cache'
      })

      await dispatch(
        'auth0/updateAuthorization',
        getTenantToken.data.switch_tenant,
        {
          root: true
        }
      )

      const membershipQuery = await fallbackApolloClient.query({
        query: require('@/graphql/Tenant/membership.gql'),
        variables: {
          membershipId: membershipId
        },
        fetchPolicy: 'no-cache'
      })
      const membership = membershipQuery.data.membership[0]
      commit('setTenant', {
        ...membership.tenant,
        role: membership.role
      })
    } catch (error) {
      // If the above failed, it's most likely because
      // the user doesn't have a default_membership_id.
      // In that case, we'll get the tenant associated
      // with their first membership and then call the switch
      // tenant route to update the default_membership_id
      const tenantIDQuery = await fallbackApolloClient.query({
        query: require('@/graphql/Tenant/tenant-id-by-membership-id.gql'),
        variables: {
          membershipId: rootGetters['user/memberships'][0].id
        },
        fetchPolicy: 'no-cache'
      })
      tenantId = tenantIDQuery.data.membership[0].tenant.id

      const getTenantToken = await fallbackApolloClient.mutate({
        mutation: require('@/graphql/Tenant/tenant-token.gql'),
        variables: {
          tenantId: tenantId
        },
        fetchPolicy: 'no-cache'
      })

      await dispatch(
        'auth0/updateAuthorization',
        getTenantToken.data.switch_tenant,
        {
          root: true
        }
      )

      await dispatch('user/getUser', null, {
        root: true
      })

      const membershipQuery = await fallbackApolloClient.query({
        query: require('@/graphql/Tenant/membership.gql'),
        variables: {
          membershipId: tenantIDQuery.data.membership[0].id
        },
        fetchPolicy: 'no-cache'
      })
      const membership = membershipQuery.data.membership[0]
      commit('setTenant', {
        ...membership.tenant,
        role: membership.role
      })
    }
  },
  async getServerTenant({ commit, getters }, tenantId) {
    try {
      const tenant = await fallbackApolloClient.query({
        query: require('@/graphql/Tenant/tenant-by-pk.gql'),
        variables: {
          id: tenantId ? tenantId : getters['tenants']?.[0].id
        }
      })

      commit('setTenant', {
        ...tenant?.data?.tenant_by_pk
      })
    } catch {
      commit('unsetTenant')
    }
  },
  async getTenants({ commit }) {
    try {
      const tenants = await prefectTenants()
      commit('setTenants', tenants)
    } catch {
      commit('unsetTenants')
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
