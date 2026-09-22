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

/**
 * Drop a freshly added layer in and let it settle. Under internet gravity it is
 * pulled up from below the window instead, and lands on its top edge.
 */
export function dropIn(layerEl, { onImpact, onSettled, fromBelow = false } = {}) {
  const shaker = layerEl.querySelector('.shaker')
  const squasher = layerEl.querySelector('.squasher')

  if (reduceMotion) {
    gsap.from(layerEl, { autoAlpha: 0, duration: 0.2, onComplete: () => onSettled?.() })
    onImpact?.()
    return
  }

  // Start off-screen on whichever side gravity is pulling from.
  const fallFrom = travelStart(layerEl, fromBelow)
  const tilt = gsap.utils.random(-9, 9)

  // Squash against whichever edge took the impact.
  gsap.set(squasher, { transformOrigin: fromBelow ? '50% 0%' : '50% 100%' })

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

/** How far off-screen a layer starts, given which way gravity is pulling. */
function travelStart(layerEl, fromBelow) {
  const rect = layerEl.getBoundingClientRect()
  return fromBelow ? window.innerHeight - rect.top + 140 : -(rect.bottom + 140)
}

/**
 * Internet gravity. The pile lets go of the table and is pulled to the top of the
 * page, or dropped back onto it. `y` is where the stack's baseline has to end up —
 * the caller works that out, because it depends on how tall the pile currently is.
 *
 * The whimsy is three things at once: a crouch in the opposite direction before it
 * goes, an elastic overshoot on arrival, and a stagger down the layers so the stack
 * ripples like a slinky instead of moving like a brick.
 */
export function flipGravity(stackEl, y, { whimsical = true, layerEls = [], shadowEl } = {}) {
  const goingUp = y < 0

  // Nothing is resting on the table once it lets go.
  if (shadowEl) {
    gsap.to(shadowEl, {
      opacity: goingUp ? 0 : 0.55,
      duration: reduceMotion ? 0 : goingUp ? 0.25 : 0.45,
      delay: !reduceMotion && !goingUp && whimsical ? 0.45 : 0,
      overwrite: 'auto',
    })
  }

  if (reduceMotion || !whimsical) {
    gsap.to(stackEl, {
      y,
      duration: reduceMotion ? 0 : 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    })
    return
  }

  gsap
    .timeline()
    // crouch the other way first, so the launch has something to push off
    .to(stackEl, { y: goingUp ? 16 : -16, duration: 0.17, ease: 'power2.out', overwrite: 'auto' })
    .to(stackEl, { y, duration: 0.95, ease: 'elastic.out(1, 0.58)' })

  // the layers arrive out of step with each other, leading from the far end
  const ordered = goingUp ? [...layerEls].reverse() : [...layerEls]
  ordered.forEach((el, i) => {
    const shaker = el?.querySelector('.shaker')
    if (!shaker) return
    gsap
      .timeline({ delay: 0.17 + i * 0.035 })
      .to(shaker, {
        y: goingUp ? 18 : -18,
        rotation: gsap.utils.random(-5, 5),
        duration: 0.22,
        ease: 'power2.out',
      })
      .to(shaker, { y: 0, rotation: 0, duration: 0.95, ease: 'elastic.out(1, 0.4)' })
  })
}

/**
 * An ingredient with no open element to land in: it falls the same way, clips
 * whatever is on the table, and carries on off the side. `onGone` fires once it is
 * out of sight, so the caller can drop it — it never belonged to the document, so
 * it is not left behind in the markup either.
 */
export function tumbleOff(layerEl, { onImpact, onGone, fromBelow = false } = {}) {
  if (reduceMotion) {
    onImpact?.()
    gsap.set(layerEl, { autoAlpha: 0 })
    // Next tick, so the caller is not changing state inside its own effect.
    gsap.delayedCall(0, () => onGone?.())
    return
  }

  const fallFrom = travelStart(layerEl, fromBelow)
  const side = Math.random() < 0.5 ? -1 : 1

  gsap
    .timeline({ onComplete: () => onGone?.() })
    .fromTo(
      layerEl,
      { y: fallFrom, rotation: gsap.utils.random(-9, 9), autoAlpha: 1 },
      { y: 0, rotation: 0, duration: 0.62, ease: 'power2.in' },
    )
    .call(() => onImpact?.())
    // glances off and keeps going, on past the edge of the table
    .to(layerEl, {
      x: side * gsap.utils.random(170, 260),
      y: (fromBelow ? -1 : 1) * gsap.utils.random(130, 200),
      rotation: side * gsap.utils.random(55, 120),
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power2.in',
    })
}

/** Everything already on the table takes the hit and wobbles. */
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

/**
 * A table does not flex the way a plate did, so the weight of a landing shows in
 * the contact shadow alone: it spreads and darkens, then settles back.
 */
export function thumpTable(shadowEl) {
  if (reduceMotion) return
  gsap
    .timeline()
    .to(shadowEl, { scaleX: 1.12, opacity: 0.72, duration: 0.08, ease: 'power2.out' })
    .to(shadowEl, { scaleX: 1, opacity: 0.55, duration: 0.6, ease: 'power2.out' })
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

/** Topple the sandwich off the table, then hand control back to clear the state. */
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
