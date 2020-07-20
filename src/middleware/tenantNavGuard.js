import store from '@/store/index'

const backend = async () => {
  if (!store.getters['api/backend']) {
    await store.dispatch('api/getApi')
  }
  return store.getters['api/backend']
}

const isServer = () => {
  return store.getters['api/backend'] == 'SERVER'
}

const tenantNavGuard = async (to, from, next) => {
  await backend()

  const passedTenantSlug = to.params.tenant

  let tenantId
  if (isServer()) {
    if (store.getters['tenant/tenants']?.length === 0) {
      await store.dispatch('tenant/getTenants')

      if (store.getters['tenant/tenants']?.length === 0) {
        return next({
          name: 'new-tenant'
        })
      }
    }

    if (store.getters['tenant/tenantIsSet']) {
      if (passedTenantSlug) {
        if (passedTenantSlug == store.getters['tenant/tenant'].slug) {
          return next()
        } else {
          let tenant = store.getters['tenant/tenants'].find(
            tenant => tenant.slug == passedTenantSlug
          )

          if (!tenant)
            return next({
              name: 'not-found'
            })

          tenantId = tenant.id
        }
      }
    } else {
      if (passedTenantSlug) {
        let tenant = store.getters['tenant/tenants'].find(
          tenant => tenant.slug == passedTenantSlug
        )

        if (!tenant)
          return next({
            name: 'not-found'
          })

        tenantId = tenant.id
      } else {
        tenantId = store.getters['tenant/tenants']?.[0].id
      }
    }

    await store.dispatch('tenant/getServerTenant', tenantId)
  } else {
    // Memberships don't exist in Server
    // so we skip this logic
    let membershipId
    if (store.getters['tenant/tenantIsSet']) {
      if (passedTenantSlug) {
        if (passedTenantSlug == store.getters['tenant/tenant'].slug) {
          return next()
        } else {
          let membership = store.getters['user/memberships'].find(
            memb => memb.tenant.slug == passedTenantSlug
          )
          if (!membership)
            return next({
              name: 'not-found'
            })
          membershipId = membership.id
        }
      } else {
        let membership = store.getters['user/memberships'].find(
          memb => memb.tenant.id == store.getters['tenant/tenant'].id
        )
        if (!membership)
          return next({
            name: 'not-found'
          })
        membershipId = membership.id
      }
    } else {
      if (passedTenantSlug) {
        let membership = store.getters['user/memberships'].find(
          memb => memb.tenant.slug == passedTenantSlug
        )
        if (!membership)
          return next({
            name: 'not-found'
          })
        membershipId = membership.id
      } else {
        membershipId = store.getters['user/defaultMembershipId']
      }
    }

    if (membershipId) {
      await store.dispatch('tenant/getTenant', membershipId)
    } else {
      await store.dispatch(
        'tenant/getTenant',
        store.getters['user/memberships'][0].id
      )
    }

    await store.dispatch('license/getLicense')
  }

  /* eslint-disable require-atomic-updates */
  to.params.tenant = store.getters['tenant/tenant'].slug
  /* eslint-enable require-atomic-updates */

  return next({
    name: to.name,
    replace: true,
    params: to.params,
    query: to.query
  })
}

export default tenantNavGuard
