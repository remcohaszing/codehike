import { useMemo } from "react"
import { stagger, TweenParams } from "./tween"

type Element = React.ReactNode
type Key = number

export type Line = {
  element: Element
  key: Key
}

type LineData = {
  element: Element
  key: Key
  // the line index in prevLines (null if missing)
  prevIndex: number | null
  // the line index in nextLines (null if missing)
  nextIndex: number | null
  // 0 for the first line entering, 1 for the second...
  enterIndex: number | null
  // 0 for the first line exiting, 1 for the second...
  exitIndex: number | null
}

type LineTransition = {
  element: React.ReactNode
  key: number
  tweenY: TweenParams
  tweenX: TweenParams
}

export function useLineTransitions(
  prevLines: Line[],
  nextLines: Line[]
) {
  return useMemo(
    () => getLineTransitions(prevLines, nextLines),
    [prevLines, nextLines]
  )
}

function getLineTransitions(
  prevLines: Line[],
  nextLines: Line[]
) {
  const sortedKeys = sortUniqueConcat(
    prevLines.map(l => l.key),
    nextLines.map(l => l.key)
  )

  let enterIndex = 0
  let exitIndex = 0
  const linesData: LineData[] = sortedKeys.map(key => {
    const prevIndex = prevLines.findIndex(
      l => l.key === key
    )
    const nextIndex = nextLines.findIndex(
      l => l.key === key
    )

    const prevLine = prevLines[prevIndex]
    const nextLine = nextLines[nextIndex]

    return {
      key,
      element: prevLine?.element || nextLine.element!,
      prevIndex: !prevLine ? null : prevIndex,
      nextIndex: !nextLine ? null : nextIndex,
      enterIndex: !prevLine ? enterIndex++ : null,
      exitIndex: !nextLine ? exitIndex++ : null,
    }
  })

  const enterCount = enterIndex
  const exitCount = exitIndex

  // console.log({ linesData })

  return linesData.map(lineData =>
    getLineTransition(lineData, enterCount, exitCount)
  )
}

function getLineTransition(
  {
    element,
    key,
    prevIndex,
    nextIndex,
    enterIndex,
    exitIndex,
  }: LineData,
  enterCount: number,
  exitCount: number
): LineTransition {
  // startY is the progress when we start moving vertically
  // endY is when we stop
  const [startY, endY] = verticalInterval(
    enterCount,
    exitCount
  )

  if (prevIndex == null) {
    return {
      element,
      key,
      tweenY: { fixed: true, value: nextIndex! },
      tweenX: {
        fixed: false,
        extremes: [1, 0],
        interval: stagger(
          [endY, 1],
          enterIndex!,
          enterCount
        ),
      },
    }
  }

  if (nextIndex == null) {
    return {
      element,
      key,
      tweenY: { fixed: true, value: prevIndex },
      tweenX: {
        fixed: false,
        extremes: [0, -1],
        interval: stagger(
          [0, startY],
          exitIndex!,
          exitCount
        ),
      },
    }
  }

  return {
    element,
    key,
    tweenY: {
      fixed: false,
      extremes: [prevIndex, nextIndex],
      interval: [startY, endY],
    },
    tweenX: { fixed: true, value: 0 },
  }
}

function sortUniqueConcat(a: number[], b: number[]) {
  return [...new Set(a.concat(b))].sort((x, y) => x - y)
}

function verticalInterval(
  enterCount: number,
  exitCount: number
) {
  if (enterCount <= 0 && exitCount <= 0) return [0, 1]
  if (enterCount <= 0 && exitCount >= 1) return [0.33, 1]
  if (enterCount >= 1 && exitCount <= 0) return [0, 0.67]
  return [0.25, 0.75]
}
