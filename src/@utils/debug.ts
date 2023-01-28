function bytesToMB(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2)
}

export function debugMem() {
  const memory: any = (performance as any).memory
  console.debug(`Used / Total: ${bytesToMB(memory.usedJSHeapSize)}mb / ${bytesToMB(memory.totalJSHeapSize)}mb`)
}

export function debugLog() {
  return (target: any, prop: string, descriptior: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, prop)!) => {
    const originalMethod = descriptior.value;

    if (descriptior.value[Symbol.toStringTag] === 'AsyncFunction') {
      //editing the descriptor/value parameter
      descriptior.value = async function (...args: any[]) {
        // note usage of originalMethod here
        console.group(`%c>>>>> Call:${prop}`, 'background: #222; color: #bada55');
        const ret = await originalMethod.apply(this, args);
        console.groupEnd()
        // console.groupEnd(`%c<<<< End:${prop}`, 'background: #222; color: #bada55');
        return ret
      };

    } else {
      //editing the descriptor/value parameter
      descriptior.value = function (...args: any[]) {
        // note usage of originalMethod here
        console.log(`%c>>>>> Call:${prop}`, 'background: #222; color: #bada55');
        const ret = originalMethod.apply(this, args);
        console.log(`%c<<<< End:${prop}`, 'background: #222; color: #bada55');
        return ret
      };
    }

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptior;
  }
}
