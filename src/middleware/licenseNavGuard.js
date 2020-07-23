import store from '@/store/index'

const hasLicense = () => {
  return store.getters['license/hasLicense']
}

const licenseNavGuards = async (to, from, next) => {
  if (!store.getters['api/isCloud']) return next()

  if (!hasLicense()) {
    await store.dispatch(
      'license/getLicense',
      store.getters['tenant/tenant'].id
    )
  }

  if (hasLicense()) {
    return next()
  }

  // We allow users to visit the support page
  // even if they don't have a license
  if (to.name == 'help') {
    return next()
  }

  return next({
    name: 'welcome'
  })
}

export default licenseNavGuards
