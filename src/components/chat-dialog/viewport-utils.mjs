export function resolveMobileViewport ({
  visualHeight,
  innerHeight,
  layoutHeight,
  lastStableHeight,
  offsetTop,
  pageTop,
  scrollY,
  inputFocused
}) {
  const rawVisualHeight = Number(visualHeight)
  const rawInnerHeight = Number(innerHeight)
  const rawLayoutHeight = Number(layoutHeight)
  const rawStableHeight = Number(lastStableHeight)
  const referenceHeight = firstUsableHeight(
    [rawLayoutHeight, rawStableHeight, rawInnerHeight, rawVisualHeight],
    874
  )
  const minimumUsableHeight = Math.max(120, Math.min(240, referenceHeight * .25))
  const maximumUsableHeight = Math.max(referenceHeight * 1.35, minimumUsableHeight)
  const visualHeightReliable = isUsableHeight(rawVisualHeight, minimumUsableHeight, maximumUsableHeight)
  const innerHeightReliable = isUsableHeight(rawInnerHeight, minimumUsableHeight, maximumUsableHeight)
  const stableHeightReliable = isUsableHeight(rawStableHeight, minimumUsableHeight, maximumUsableHeight)

  let height = referenceHeight
  let source = 'layout'
  if (visualHeightReliable) {
    height = rawVisualHeight
    source = 'visual'
  } else if (innerHeightReliable) {
    height = rawInnerHeight
    source = 'inner'
  } else if (stableHeightReliable) {
    height = rawStableHeight
    source = 'stable'
  }

  height = Math.max(minimumUsableHeight, Math.round(height))
  const relativePageTop = Number(pageTop) - (Number(scrollY) || 0)
  const visualTop = visualHeightReliable
    ? Math.max(0, Math.round(Number(offsetTop) || 0), Math.round(Number.isFinite(relativePageTop) ? relativePageTop : 0))
    : 0
  const keyboardOpen = Boolean(inputFocused) && (
    height < referenceHeight - 80 || visualTop > 0
  )
  return {
    height,
    top: keyboardOpen ? visualTop : 0,
    keyboardOpen,
    source,
    visualHeightReliable
  }
}

function isUsableHeight (value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum
}

function firstUsableHeight (values, fallback) {
  const value = values.find(candidate => Number.isFinite(candidate) && candidate > 0)
  return value || fallback
}
