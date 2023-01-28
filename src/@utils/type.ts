import { Point } from "../@types/basic"

/**
 * type grauding
 */
// export function isEnitity(t: SpacyRet) {
//     return t.ent_type !== '' || ['NOUN', 'VERB', 'AUX'].includes(t.pos) || t.tag.startsWith('VB') || t.coref?.some(r => r.ent_type)
// }

export const isPoint = (p: any): p is Point => typeof p === 'object' &&
    'x' in p &&
    'y' in p &&
    typeof p['x'] === 'number' &&
    typeof p['y'] === 'number' 