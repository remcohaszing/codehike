import React from "react"
import { debugEntries } from "./debugger"
import { useWindowHeight } from "./use-window-height"

export { Scroller, Step }

const ObserverContext = React.createContext<
  IntersectionObserver | undefined
>(undefined)

const useLayoutEffect =
  typeof window !== "undefined"
    ? React.useLayoutEffect
    : React.useEffect

type ScrollerProps = {
  onStepChange: (stepIndex: number) => void
  children: React.ReactNode
  getRootMargin?: (
    vh: number,
    triggerPositon?: TriggerPositon
  ) => string
  triggerPositon?: TriggerPositon
  debug?: boolean
}

type StepElement = {
  stepIndex: any
}

function Scroller({
  onStepChange,
  children,
  getRootMargin = defaultRootMargin,
  triggerPositon,
  debug = false,
}: ScrollerProps) {
  const [observer, setObserver] =
    React.useState<IntersectionObserver>()
  const vh = useWindowHeight()

  useLayoutEffect(() => {
    const windowHeight = vh || 0
    const handleIntersect: IntersectionObserverCallback =
      entries => {
        if (debug || (window as any).chDebugScroller) {
          debugEntries(entries)
        }
        entries.forEach(entry => {
          if (entry.intersectionRatio > 0) {
            const stepElement =
              entry.target as unknown as StepElement
            onStepChange(+stepElement.stepIndex)
          }
        })
      }
    const observer = newIntersectionObserver(
      handleIntersect,
      getRootMargin(windowHeight, triggerPositon)
    )
    setObserver(observer)

    return () => observer.disconnect()
  }, [vh])

  return (
    <ObserverContext.Provider value={observer}>
      {children}
    </ObserverContext.Provider>
  )
}

function Step({
  as = "section",
  index,
  ...props
}: {
  as: any
  index: number
  children?: React.ReactNode
} & React.HTMLProps<HTMLElement>) {
  const ref = React.useRef<HTMLElement>(null!)
  const observer = React.useContext(ObserverContext)

  useLayoutEffect(() => {
    if (observer) {
      observer.observe(ref.current)
    }
    return () => observer && observer.unobserve(ref.current)
  }, [observer])

  useLayoutEffect(() => {
    const stepElement =
      ref.current as unknown as StepElement
    stepElement.stepIndex = index
  }, [index])

  return React.createElement(as, { ...props, ref })
}

function newIntersectionObserver(
  handleIntersect: IntersectionObserverCallback,
  rootMargin: string
) {
  return new IntersectionObserver(handleIntersect, {
    rootMargin,
    threshold: 0.000001,
    root: null,
  })
}

type TriggerPositon = `${number}px` | `${number}%`

function defaultRootMargin(
  vh: number,
  triggerPositon = "50%"
) {
  let y = vh * 0.5

  if (triggerPositon.endsWith("%")) {
    const percent = parseFloat(
      triggerPositon.replace("%", "")
    )
    y = vh * (percent / 100)
  } else if (triggerPositon.endsWith("px")) {
    y = parseFloat(triggerPositon.replace("px", ""))
  }

  if (y < 0) {
    y = vh + y
  }

  return `-${y - 2}px 0px -${vh - y - 2}px`
}
