import store from '@/store/index'

const newTenantChecks = async (to, from, next) => {
  if (store.getters['tenant/tenant'].role !== 'TENANT_ADMIN') return next()

  if (!store.getters['tenant/tenant'].settings.teamNamed) {
    return next({
      name: 'welcome',
      params: {
        tenant: store.getters['tenant/tenant'].slug
      }
    })
  }
  return next()
}

export default newTenantChecks
