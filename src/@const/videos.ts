// import { EventData } from '../@videos'

// type VideoKeys = keyof typeof EventData
// export const VideoIDs = (Object.keys(EventData) as Array<VideoKeys>)
//     .reduce((o, k) => {
//         o[k] = k
//         return o
//     }, {} as Record<keyof typeof EventData, keyof typeof EventData>)


export const VideoIDs = {
    mavsfan: 'mavsfan',
    top2trik: 'top2trik',
    top22019: 'top22019',
    w19wf_5_20: 'w19wf_5_20',
    w19wf_41_37: 'w19wf_41_37',
    usopen15_53: 'usopen15_53',
    usopen15_1_44_: 'usopen15_1_44_',
    wc19m_2_1_5: 'wc19m_2_1_5',
    wc19m_3_0_0: 'wc19m_3_0_0',
    japanopen19m_3: 'japanopen19m_3',
    au21_1_47: 'au21_1_47'
}

export const RenderingFrameRate = 60