export function wrapWorker<In extends unknown[], Out>(workerFunc: { new(): Worker }, key: string): (...args: In) => Promise<Out> {
  const worker = new workerFunc()
  return async (...args: In) => {
    worker.postMessage([key, ...args])
    return await new Promise<Out>(resolve => {
      const handler = (e: MessageEvent<any>) => {
        if (e.data[0] !== key) return
        worker.removeEventListener('message', handler)
        resolve(e.data[1])
      }
      worker.addEventListener('message', handler)
    })
  }
}