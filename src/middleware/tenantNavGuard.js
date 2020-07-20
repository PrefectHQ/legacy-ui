import store from '@/store/index'

const tenantNavGuard = async (to, from, next) => {
  /* eslint-disable */
  if (true) return next()

  const passedTenantSlug = to.params.tenant

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
