const assert = require('node:assert/strict')

async function main () {
  const { resolveMobileViewport } = await import('../src/components/chat-dialog/viewport-utils.mjs')

  const transientZero = resolveMobileViewport({
    visualHeight: 0,
    innerHeight: 506,
    layoutHeight: 874,
    lastStableHeight: 520,
    offsetTop: 420,
    inputFocused: true
  })
  assert.ok(transientZero.height >= 120, 'transient visualViewport.height=0 must not collapse the chat root')
  assert.notEqual(transientZero.source, 'visual', 'an invalid visual height must use a stable fallback')

  const pannedViewport = resolveMobileViewport({
    visualHeight: 506,
    innerHeight: 506,
    layoutHeight: 874,
    expandedHeight: 874,
    lastStableHeight: 520,
    offsetTop: 84,
    scale: 1,
    inputFocused: true
  })
  assert.equal(pannedViewport.top, 84, 'visual viewport pan must keep the chat aligned with the visible viewport')
  assert.equal(pannedViewport.height, 506)
  assert.equal(pannedViewport.keyboardOpen, true)

  const keyboardClosed = resolveMobileViewport({
    visualHeight: 874,
    innerHeight: 874,
    layoutHeight: 874,
    expandedHeight: 874,
    lastStableHeight: 506,
    offsetTop: 24,
    scale: 1,
    inputFocused: false
  })
  assert.equal(keyboardClosed.top, 0, 'blurred input must clear residual WebKit viewport offsets')
  assert.equal(keyboardClosed.height, 874)
  assert.equal(keyboardClosed.keyboardOpen, false)

  const oversizedPan = resolveMobileViewport({
    visualHeight: 506,
    innerHeight: 506,
    layoutHeight: 874,
    expandedHeight: 874,
    lastStableHeight: 506,
    offsetTop: 900,
    scale: 1,
    inputFocused: true,
    keyboardSession: false
  })
  assert.equal(oversizedPan.top, 368, 'WebKit pan must be clamped inside the expanded layout viewport')

  const blurBeforeDismissal = resolveMobileViewport({
    visualHeight: 506,
    innerHeight: 506,
    layoutHeight: 874,
    expandedHeight: 874,
    lastStableHeight: 506,
    offsetTop: 90,
    scale: 1,
    inputFocused: false,
    keyboardSession: true
  })
  assert.equal(blurBeforeDismissal.keyboardOpen, true, 'blur must retain the keyboard session until the viewport expands')
  assert.equal(blurBeforeDismissal.top, 90)

  const pinchZoom = resolveMobileViewport({
    visualHeight: 437,
    innerHeight: 874,
    layoutHeight: 874,
    expandedHeight: 874,
    lastStableHeight: 506,
    offsetTop: 120,
    scale: 2,
    inputFocused: true,
    keyboardSession: false
  })
  assert.equal(pinchZoom.height, 874, 'pinch zoom must preserve the layout height')
  assert.equal(pinchZoom.top, 0)
  assert.equal(pinchZoom.keyboardOpen, false)

  console.log('Mobile viewport regression checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
