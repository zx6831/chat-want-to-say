export function resolveMobileViewport ({
  visualHeight,
  innerHeight,
  layoutHeight,
  expandedHeight,
  lastStableHeight,
  offsetTop,
  scale = 1,
  inputFocused,
  keyboardSession = false,
  viewportWidth,
  previousViewportWidth
}) {
  const rawVisualHeight = Number(visualHeight)
  const rawInnerHeight = Number(innerHeight)
  const rawLayoutHeight = Number(layoutHeight)
  const rawExpandedHeight = Number(expandedHeight)
  const rawStableHeight = Number(lastStableHeight)
  const referenceHeight = firstUsableHeight(
    [rawExpandedHeight, rawLayoutHeight, rawStableHeight, rawInnerHeight, rawVisualHeight],
    874
  )
  const minimumUsableHeight = Math.max(120, Math.min(240, referenceHeight * .25))
  const maximumUsableHeight = Math.max(referenceHeight * 1.35, minimumUsableHeight)
  const visualHeightReliable = isUsableHeight(rawVisualHeight, minimumUsableHeight, maximumUsableHeight)
  const innerHeightReliable = isUsableHeight(rawInnerHeight, minimumUsableHeight, maximumUsableHeight)
  const stableHeightReliable = isUsableHeight(rawStableHeight, minimumUsableHeight, maximumUsableHeight)
  const layoutHeightReliable = isUsableHeight(rawLayoutHeight, minimumUsableHeight, maximumUsableHeight)
  const expandedHeightReliable = isUsableHeight(rawExpandedHeight, minimumUsableHeight, maximumUsableHeight)
  const zoomed = Math.abs((Number(scale) || 1) - 1) > .01
  const widthChanged = Number.isFinite(Number(viewportWidth)) &&
    Number.isFinite(Number(previousViewportWidth)) &&
    Number(viewportWidth) !== Number(previousViewportWidth)

  let nextExpandedHeight = expandedHeightReliable ? rawExpandedHeight : referenceHeight
  if ((!inputFocused && !keyboardSession) || widthChanged) {
    nextExpandedHeight = firstUsableHeight(
      [rawInnerHeight, rawLayoutHeight, rawVisualHeight, nextExpandedHeight],
      referenceHeight
    )
  }

  let height = referenceHeight
  let source = 'layout'
  if (zoomed && innerHeightReliable) {
    height = rawInnerHeight
    source = 'inner-zoom'
  } else if (visualHeightReliable) {
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
  const reliableInnerHeight = innerHeightReliable ? rawInnerHeight : 0
  const reliableLayoutHeight = layoutHeightReliable ? rawLayoutHeight : 0
  const effectiveLayoutHeight = Math.max(reliableInnerHeight, reliableLayoutHeight, nextExpandedHeight, height)
  const obscuredHeight = Math.max(reliableInnerHeight, nextExpandedHeight) - height
  const keyboardOpen = Boolean(inputFocused || keyboardSession) && !zoomed && obscuredHeight > 96
  const maximumTop = Math.max(0, Math.round(effectiveLayoutHeight - height))
  const visualTop = keyboardOpen && visualHeightReliable
    ? clamp(Math.round(Number(offsetTop) || 0), 0, maximumTop)
    : 0

  return {
    height,
    top: visualTop,
    keyboardOpen,
    source,
    visualHeightReliable,
    expandedHeight: nextExpandedHeight,
    viewportWidth: Number.isFinite(Number(viewportWidth)) ? Number(viewportWidth) : previousViewportWidth,
    obscuredHeight,
    zoomed
  }
}

function isUsableHeight (value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum
}

function firstUsableHeight (values, fallback) {
  const value = values.find(candidate => Number.isFinite(candidate) && candidate > 0)
  return value || fallback
}

function clamp (value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}
