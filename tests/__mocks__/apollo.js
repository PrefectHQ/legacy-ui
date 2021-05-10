export const query = jest.fn()
export const mutate = jest.fn()

export const Client = jest.fn(() => {
  return {
    query: query,
    mutate: mutate
  }
})

Client.query = query
Client.mutate = mutate
console.log('hello!')
export default Client
