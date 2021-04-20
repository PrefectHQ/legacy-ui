import { TokenWorker } from '@/main'

const authorize = () =>
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

    TokenWorker.port.postMessage({ type: 'authorization' }, [channel.port2])
  })

// Authorizes the user with Prefect Cloud
export const authorize = async () => {}
