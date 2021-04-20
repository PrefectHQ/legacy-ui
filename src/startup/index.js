/* 
    Authenticate
    Authorize
    Fetch tenants
*/
import { authenticate } from './authentication.js'
import { authorize } from './authorization.js'
import { fetchTenants, fetchTenantDetails } from './tenant.js'

export const startup = async () => {
  await authenticate()
  await authorize()
  await fetchTenants()
  await fetchTenantDetails()
}
