// Every animation in the game lives here so the components stay declarative.
// Each layer in the stack is three nested elements, which keeps GSAP tweens from
// fighting over the same transform:
//
//   .layer     -> the fall (y, rotation)
//   .shaker    -> the wobble when something lands on top of it
//   .squasher  -> the squash-and-stretch on impact
//
import { gsap } from 'gsap'

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Drop a freshly added layer in from above the screen and let it settle. */
export function dropIn(layerEl, { onImpact, onSettled } = {}) {
  const shaker = layerEl.querySelector('.shaker')
  const squasher = layerEl.querySelector('.squasher')

  if (reduceMotion) {
    gsap.from(layerEl, { autoAlpha: 0, duration: 0.2, onComplete: () => onSettled?.() })
    onImpact?.()
    return
  }

  // Start above the top of the window, whatever the layer's resting height is.
  const fallFrom = -(layerEl.getBoundingClientRect().bottom + 140)
  const tilt = gsap.utils.random(-9, 9)

  const tl = gsap.timeline({ onComplete: () => onSettled?.() })

  tl.fromTo(
    layerEl,
    { y: fallFrom, rotation: tilt, autoAlpha: 1 },
    { y: 0, rotation: 0, duration: 0.62, ease: 'power2.in' },
  )
    // impact: squash wide and flat, then spring back
    .call(() => onImpact?.())
    .to(squasher, { scaleY: 0.7, scaleX: 1.15, duration: 0.09, ease: 'power2.out' })
    .to(squasher, {
      scaleY: 1,
      scaleX: 1,
      duration: 0.85,
      ease: 'elastic.out(1, 0.4)',
    })
    // a small sideways shimmy so it does not look mechanical
    .fromTo(
      shaker,
      { rotation: gsap.utils.random(-2.5, 2.5) },
      { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' },
      '<',
    )
}

/** Everything already on the plate takes the hit and wobbles. */
export function jiggleStack(layerEls) {
  if (reduceMotion || !layerEls.length) return

  layerEls.forEach((el, i) => {
    const shaker = el.querySelector('.shaker')
    // layers nearer the top of the pile feel it more
    const strength = 0.35 + (i / layerEls.length) * 0.65
    gsap
      .timeline()
      .to(shaker, { y: 4 * strength, duration: 0.07, ease: 'power2.out' })
      .to(shaker, {
        y: 0,
        duration: 0.6 + i * 0.02,
        ease: 'elastic.out(1, 0.45)',
      })
  })
}

/** The plate flexes and its shadow spreads under the weight of a landing. */
export function thumpPlate(plateEl, shadowEl) {
  if (reduceMotion) return
  gsap
    .timeline()
    .to(plateEl, { scaleY: 0.93, scaleX: 1.03, duration: 0.08, ease: 'power2.out' })
    .to(plateEl, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
  gsap
    .timeline()
    .to(shadowEl, { scaleX: 1.09, opacity: 0.5, duration: 0.08, ease: 'power2.out' })
    .to(shadowEl, { scaleX: 1, opacity: 0.34, duration: 0.6, ease: 'power2.out' })
}

/** Slide the whole pile down so a tall sandwich still fits on screen. */
export function fitStack(stackEl, scale) {
  gsap.to(stackEl, {
    scale,
    duration: reduceMotion ? 0 : 0.5,
    ease: 'power3.out',
    overwrite: 'auto',
  })
}

/** Topple the sandwich off the plate, then hand control back to clear the state. */
export function sweepAway(layerEls, done) {
  if (reduceMotion || !layerEls.length) {
    done()
    return
  }

  // Top of the pile goes first, so it unbuilds the way it was built.
  const ordered = [...layerEls].reverse()

  gsap.to(ordered, {
    y: () => gsap.utils.random(-40, -90),
    x: () => gsap.utils.random(80, 260),
    rotation: () => gsap.utils.random(35, 95),
    autoAlpha: 0,
    duration: 0.55,
    ease: 'power2.in',
    stagger: 0.045,
    onComplete: done,
  })
}

/** Lift the top layer back off the sandwich. */
export function liftOff(layerEl, done) {
  if (reduceMotion || !layerEl) {
    done()
    return
  }
  gsap.to(layerEl, {
    y: -160,
    rotation: gsap.utils.random(-14, 14),
    autoAlpha: 0,
    duration: 0.34,
    ease: 'power2.in',
    onComplete: done,
  })
}

/** Nudge a tray button when it is clicked. */
export function pressButton(el) {
  if (reduceMotion) return
  gsap
    .timeline()
    .to(el, { scale: 0.93, duration: 0.09, ease: 'power2.out' })
    .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
}

/** Flash the newest line in the code panel so students see what just appeared. */
export function flashCodeLine(el) {
  if (!el) return
  if (reduceMotion) return
  gsap.fromTo(
    el,
    { backgroundColor: 'rgba(240, 165, 0, 0.45)' },
    { backgroundColor: 'rgba(240, 165, 0, 0)', duration: 1.1, ease: 'power2.out' },
  )
}

/** Slide the HTML panel in when it is opened. Used as a Svelte action. */
export function revealPanel(el) {
  if (reduceMotion) return
  gsap.from(el, {
    xPercent: -12,
    autoAlpha: 0,
    duration: 0.4,
    ease: 'power3.out',
    clearProps: 'transform,opacity,visibility',
  })
}
