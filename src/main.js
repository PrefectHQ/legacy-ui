import { login } from '@/auth/login.js'

export const logOut = async () => {
  // try sending the request to the token worker
  // if we have a service worker, ping that for a token
  // otherwise we go through the okta logout process directly
}

const start = async () => {
  console.log('starting')
  if (process.env.VUE_APP_BACKEND === 'CLOUD') {
    // we run this when the application starts or a user returns to the page after some time away
    const tokens = await login()
    console.log('got tokens', tokens)
  }
}

start()
