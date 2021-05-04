import { logIn, logOut, start } from '@/main.js'

describe('logIn', () => {
  it('attempts to retreive tokens from the token worker', async () => {
    await logIn()
  })
})
