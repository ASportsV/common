export async function wait(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

export async function waitUntil(checkFun: () => boolean, interval = 70) {
  return new Promise(resolve => {
    setInterval(() => {
      if (checkFun())
        resolve(null)
    }, interval)
  })
}