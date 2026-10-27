const assert = require('node:assert/strict')

async function main () {
  const { resolveMobileViewport } = await import('../src/components/chat-dialog/viewport-utils.mjs')

  const transientZero = resolveMobileViewport({
    visualHeight: 0,
    innerHeight: 506,
    layoutHeight: 874,
    lastStableHeight: 520,
    offsetTop: 420,
    pageTop: 420,
    scrollY: 0,
    inputFocused: true
  })
  assert.ok(transientZero.height >= 120, 'transient visualViewport.height=0 must not collapse the chat root')
  assert.notEqual(transientZero.source, 'visual', 'an invalid visual height must use a stable fallback')

  const delayedOffset = resolveMobileViewport({
    visualHeight: 506,
    innerHeight: 506,
    layoutHeight: 874,
    lastStableHeight: 520,
    offsetTop: 0,
    pageTop: 84,
    scrollY: 0,
    inputFocused: true
  })
  assert.equal(delayedOffset.top, 84, 'pageTop must compensate when offsetTop is delayed')
  assert.equal(delayedOffset.height, 506)
  assert.equal(delayedOffset.keyboardOpen, true)

  const keyboardClosed = resolveMobileViewport({
    visualHeight: 874,
    innerHeight: 874,
    layoutHeight: 874,
    lastStableHeight: 506,
    offsetTop: 24,
    pageTop: 24,
    scrollY: 0,
    inputFocused: false
  })
  assert.equal(keyboardClosed.top, 0, 'blurred input must clear residual WebKit viewport offsets')
  assert.equal(keyboardClosed.height, 874)
  assert.equal(keyboardClosed.keyboardOpen, false)

  console.log('Mobile viewport regression checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
