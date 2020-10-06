export const mockAuthorize = jest.fn()

export const mockLogout = jest.fn()

export const mockParseHashResult = {
  accessToken: '654334335242321',
  idToken: '1432g435ewgh55y'
}

export const mockParseHash = jest
  .fn()
  .mockImplementationOnce(callback => {
    callback(null, mockParseHashResult)
  })
  .mockImplementationOnce(callback => {
    callback(new Error('test error'))
  })

class WebAuth {
  constructor() {
    this.authorize = mockAuthorize
    this.logout = mockLogout
    this.parseHash = mockParseHash
  }
}

const mock = {
  WebAuth
}

export default mock
