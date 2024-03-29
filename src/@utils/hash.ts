let _intervalIdGen = 0
export function intervalIdGen() {
    return ++_intervalIdGen
}

export function getHash(input: string) {
    let hash = 0, len = input.length;
    for (var i = 0; i < len; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0; // to 32bit integer
    }
    return hash;
}