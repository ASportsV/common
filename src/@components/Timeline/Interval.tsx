import React from "react";
import clsx from 'clsx';

import { Interval as TInterval } from '../../@types'

type Direction = 'e' | 'w'

interface Props extends TInterval {
  id: number
  focused: boolean
  initializing: boolean
  x: number
  w: number
  style?: React.CSSProperties
  onMoving: (id: number, updateInterval: { x: number, w: number }) => void
  onAdjusting: (id: number, updateInterval: { x: number, w: number }) => void
  onAdjustingEnd: (id: number, resizeIntervalEnd: { x: number, w: number }, end_?: boolean) => void
  getEW: (id: number) => { ex: number, wx: number } | undefined
  onClickInterval: (id: number) => void
}

interface State {
  isMoving: { ox: number } | null
  isAdjusting: {
    direction: Direction,
    oBBox: { x: number, w: number },
    ox: number
  } | null
  cursorStatus: 'movable' | 'resizable' | null
}

export class Interval extends React.Component<Props, State> {

  state: State = {
    isMoving: null,
    isAdjusting: null,
    cursorStatus: null, //鼠标指针状态
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.onMoving)
    window.addEventListener('mouseup', this.onMoveEnd)
    window.addEventListener('mousemove', this.onResizing)
    window.addEventListener('mouseup', this.onResizeEnd)
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMoving)
    window.removeEventListener('mouseup', this.onMoveEnd)
    window.removeEventListener('mousemove', this.onResizing)
    window.removeEventListener('mouseup', this.onResizeEnd)
  }

  /** Resizing the bbox */
  onResizeStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: Direction) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const { x, w } = this.props
    // 全局坐标
    const mx = e.clientX

    this.setState({
      isAdjusting: {
        direction,
        oBBox: { x, w },
        ox: mx // 记录初始鼠标位置, 全局坐标
      },
      cursorStatus: 'resizable'
    })
    document.body.classList.add('adjusting', direction)
  }

  onResizing = (e: MouseEvent) => {
    const { isAdjusting } = this.state
    if (isAdjusting === null || e.button !== 0) return
    e.preventDefault()
    e.stopImmediatePropagation()

    let { x, w, id } = this.props
    const { direction, oBBox, ox } = isAdjusting
    const mx = e.clientX
    const dx = mx - ox

    const { wx, ex } = this.props.getEW(id)!
    switch (direction) {
      case 'w':
        // 如果在左, 更新x和w
        x = Math.min(oBBox.x + oBBox.w, oBBox.x + dx) // 上限为原来的右边
        x = Math.max(wx, x) // 下限
        w = Math.min(oBBox.x + oBBox.w - wx, oBBox.w - dx)   // 上限
        w = Math.max(0, w) // 下限
        break
      case 'e':
        // 如果在右, 只更新w, 下限为0
        w = Math.max(0, oBBox.w + dx)
        w = Math.min(ex - x, w)  // 上限
        break
    }

    this.props.onAdjusting?.(this.props.id, { x, w })
  }

  onResizeEnd = (e: MouseEvent) => {
    const { isAdjusting } = this.state
    if (isAdjusting === null || e.button !== 0) return
    e.preventDefault()
    e.stopImmediatePropagation()

    let { x, w, id } = this.props
    this.props.onAdjustingEnd?.(id, { x, w }, true)

    this.setState({
      isAdjusting: null
    })
    document.body.classList.remove('adjusting', 'w', 'e', 's', 'n')
  }

  /** Dragging the bbox */
  onMoveStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // not left click
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()

    const { x } = this.props
    const mx = e.clientX;
    this.setState({
      isMoving: { ox: mx - x },
      cursorStatus: 'movable'
    })
  }

  onMoving = (e: MouseEvent) => {
    const { isMoving } = this.state
    if (isMoving === null) return
    e.preventDefault()
    e.stopImmediatePropagation()

    const mx = e.clientX
    let { w, id } = this.props
    const { wx, ex } = this.props.getEW(id)!
    let newx = Math.max(wx, mx - isMoving.ox)
    newx = Math.min(newx, ex - w)

    this.props.onMoving?.(this.props.id, { x: newx, w })
  }

  onMoveEnd = (e: MouseEvent) => {
    const { isMoving } = this.state
    if (isMoving === null || e.button !== 0) return
    e.preventDefault()
    e.stopImmediatePropagation()

    this.setState({ isMoving: null })
  }

  render() {
    const { x, w, focused, initializing, style = {} } = this.props
    const { isAdjusting, isMoving, cursorStatus } = this.state
    return <div className={clsx('interval-container', { focused })}
      style={{ left: x }}
    >
      <div
        className={clsx('interval', cursorStatus)}
        style={{ width: w, ...style }}
        onMouseDown={e => {
          const parentDim = e.currentTarget.parentElement!.getBoundingClientRect()
          // local coordinate
          const mx = e.clientX - parentDim.x

          // detect if left or right edge
          if (Math.abs(mx) < 3) {
            this.onResizeStart(e, 'w')
          } else if (Math.abs(mx - w) < 3) {
            this.onResizeStart(e, 'e')
          } else {
            // not on the edge
            this.onMoveStart(e)
          }
        }}
        onMouseMove={e => {
          if (isAdjusting || isMoving) return
          // icon for the cursor status
          const { w } = this.props
          const parentDim = e.currentTarget.parentElement!.getBoundingClientRect()
          // local coordinate in parent
          const mx = e.clientX - parentDim.x

          // detect if left or right edge
          if (Math.abs(mx) < 3 || Math.abs(mx - w) < 3) {
            this.setState({ cursorStatus: 'resizable' })
          } else {
            // not on the edge
            this.setState({ cursorStatus: 'movable' })
          }
        }}
        onClick={e => this.props.onClickInterval(this.props.id)}
      >
      </div>
    </div>
  }
}