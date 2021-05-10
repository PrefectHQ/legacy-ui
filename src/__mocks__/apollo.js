export const query = jest.fn()
export const mutate = jest.fn()

export const Client = jest.fn(() => {
  return {
    query: query,
    mutate: mutate
  }
})

export default Client
