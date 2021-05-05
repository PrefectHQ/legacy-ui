// Returns a promise that awaits a message from a passed worker on a provisioned channel
export const promiseChannel = (worker, signalType, payload) =>
  new Promise((res, rej) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = data => {
      channel.port1.close()
      if (data.type == 'error') {
        rej(data)
      } else {
        res(data.data.payload)
      }
    }

    worker.port.postMessage({ type: signalType, payload: payload }, [
      channel.port2
    ])
  })
