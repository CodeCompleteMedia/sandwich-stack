<script>
  import Layer from './Layer.svelte'
  import { BY_ID, layout } from './ingredients.js'
  import {
    dropIn,
    tumbleOff,
    jiggleStack,
    thumpTable,
    fitStack,
    flipGravity,
    pressButton,
  } from './animate.js'

  let { layers, hoveredUid, onhover, onfell, linked } = $props()

  // Widest thing on the table, used to keep the sandwich inside the stage.
  const NATURAL_WIDTH = 480

  let stageEl, stackEl, shadowEl
  let inverted = $state(false)

  // How close the pile hangs to the top of the stage once gravity flips.
  const CEILING = 24
  let layerEls = $state({})
  let stageW = $state(0)
  let stageH = $state(0)

  // What is actually on the table. A layer that fell off keeps its place in the
  // list — it is still in the document, just not in the pile.
  const onTable = $derived(layers.filter((l) => l.role !== 'fallen'))

  // Height of the stack line for each layer: everything added before it, piled up.
  // A fallen layer is given the height it would have hit at, so it falls the same
  // distance as anything else, but it adds nothing to the pile.
  const positions = $derived.by(() => {
    let height = 0
    return layers.map((layer) => {
      const bottom = height
      if (layer.role !== 'fallen') height += BY_ID[layer.id].lift
      return bottom
    })
  })

  // The top of the pile is the last layer that is actually on it — walked by index
  // so this stays in step with `positions` above.
  const stackHeight = $derived.by(() => {
    let top = 0
    layers.forEach((layer, i) => {
      if (layer.role === 'fallen') return
      top = positions[i] + layout(BY_ID[layer.id]).contentHeight
    })
    return top
  })

  // Shrink the pile so a tall sandwich — or a narrow window — never clips it.
  const scale = $derived.by(() => {
    if (!stageW || !stageH) return 1
    const byWidth = (stageW - 24) / NATURAL_WIDTH
    const byHeight = stackHeight ? (stageH - 140) / stackHeight : 1
    return Math.max(0.25, Math.min(1, byWidth, byHeight))
  })

  $effect(() => {
    if (!stageEl) return
    const ro = new ResizeObserver(([entry]) => {
      stageW = entry.contentRect.width
      stageH = entry.contentRect.height
    })
    ro.observe(stageEl)
    return () => ro.disconnect()
  })

  $effect(() => {
    if (stackEl) fitStack(stackEl, scale)
  })

  // Set by the button so the effect below knows this change is a deliberate flip
  // and deserves the full performance, rather than a quiet correction.
  let pendingFlip = false
  let appliedY = 0

  function toggleGravity(event) {
    pressButton(event.currentTarget)
    pendingFlip = true
    inverted = !inverted
  }

  // Under internet gravity the pile hangs from the top, so it is the *top* edge
  // that has to stay put — otherwise adding a layer would push it off the screen.
  // Recomputing on every change means the pile grows downward from the ceiling.
  // offsetTop is the untransformed layout position, so the tween cannot feed itself.
  $effect(() => {
    const height = stackHeight * scale
    void stageH // reposition the hanging pile when the window changes size
    if (!stackEl) return

    const y = inverted ? CEILING + height - stackEl.offsetTop : 0
    const whimsical = pendingFlip
    pendingFlip = false

    if (!whimsical && y === appliedY) return
    appliedY = y

    flipGravity(stackEl, y, {
      whimsical,
      shadowEl,
      layerEls: onTable.map((l) => layerEls[l.uid]).filter(Boolean),
    })
  })

  // Drop each new layer in exactly once. Tracked by id rather than by count so
  // that a fast clicker never gets a layer that skips its fall and just appears.
  const dropped = new Set()

  $effect(() => {
    layers.forEach((layer, i) => {
      if (dropped.has(layer.uid)) return

      const el = layerEls[layer.uid]
      if (!el) return // not bound yet; the effect re-runs when it is

      dropped.add(layer.uid)

      const below = layers
        .slice(0, i)
        .filter((l) => l.role !== 'fallen')
        .map((l) => layerEls[l.uid])
        .filter(Boolean)

      // A slice falling past the cursor would otherwise trigger its own hover
      // and leave the sandwich stuck in the highlighted state, because the
      // browser only fires mouseleave once the *pointer* moves again.
      el.style.pointerEvents = 'none'

      const onImpact = () => {
        jiggleStack(below)
        // Nothing is touching the table while the pile hangs off the ceiling, and
        // thumping would fade the shadow back in behind our back.
        if (!inverted) thumpTable(shadowEl)
      }

      // Nothing open to land in: it clips the pile and carries on off the table.
      // Its pointer events stay off for good, because it is no longer there.
      if (layer.role === 'fallen') {
        tumbleOff(el, { onImpact, onGone: () => onfell?.(layer.uid), fromBelow: inverted })
        return
      }

      dropIn(el, {
        onImpact,
        fromBelow: inverted,
        onSettled: () => {
          el.style.pointerEvents = ''
        },
      })
    })
  })

  export function getLayerEls() {
    return layers.map((l) => layerEls[l.uid]).filter(Boolean)
  }
</script>

<div class="stage" bind:this={stageEl}>
  <div class="table"></div>

  <div class="stack" bind:this={stackEl}>
    <div class="shadow" bind:this={shadowEl}></div>

    {#each layers as layer, i (layer.uid)}
      <div class="slot" bind:this={layerEls[layer.uid]}>
        <Layer
          ingredient={BY_ID[layer.id]}
          bottom={positions[i]}
          index={i}
          highlighted={hoveredUid === layer.uid}
          dimmed={hoveredUid !== null && hoveredUid !== layer.uid}
          onhover={(on) => linked && onhover(on ? layer.uid : null)}
        />
      </div>
    {/each}
  </div>

  {#if !onTable.length}
    <p class="empty">Pick an ingredient to start your sandwich</p>
  {/if}

  <button
    type="button"
    class="gravity"
    class:on={inverted}
    aria-pressed={inverted}
    onclick={toggleGravity}
  >
    <span class="arrow" aria-hidden="true">↑</span>
    {inverted ? 'Internet gravity' : 'Table gravity'}
  </button>
</div>

<style>
  .stage {
    position: relative;
    flex: 1 1 auto;
    /* The sandwich is the point of the screen — it keeps its room. */
    min-width: 17rem;
    overflow: hidden;
    background: radial-gradient(120% 90% at 50% 0%, #5c4433 0%, #2b1d15 62%, #201510 100%);
  }

  /* The bare table the sandwich lands on. */
  .table {
    position: absolute;
    inset: auto 0 0 0;
    height: 5.5rem;
    background: linear-gradient(#7a5334, #59391f);
    border-top: 3px solid #96693f;
  }

  .stack {
    position: absolute;
    left: 50%;
    /* Sits on the table's top edge, which is exactly the table's height. */
    bottom: 5.5rem;
    width: 0;
    /* Grows upward from the table, and scales about the same point. */
    transform-origin: 50% 100%;
  }

  /* The sandwich's own contact shadow, now that nothing sits under it. Sized to
     the bread (380px of content) rather than to the plate that used to be here. */
  .shadow {
    position: absolute;
    left: 50%;
    bottom: -0.75rem;
    width: 23rem;
    height: 1.5rem;
    margin-left: -11.5rem;
    background: radial-gradient(50% 50%, rgba(0, 0, 0, 0.72), transparent 72%);
    opacity: 0.55;
    filter: blur(6px);
  }

  .slot {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 0;
  }

  /* Bottom-right of the stage, sitting on the table like a light switch. */
  .gravity {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.8rem;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--cream);
    background: rgba(24, 15, 10, 0.72);
    border: 1px solid var(--edge);
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease;
  }

  .gravity:hover {
    background: rgba(24, 15, 10, 0.92);
  }

  .gravity.on {
    color: #21160f;
    background: var(--accent2);
    border-color: var(--accent2);
  }

  /* Points whichever way gravity is currently pulling. */
  .arrow {
    display: inline-block;
    font-size: 0.95rem;
    line-height: 1;
    transform: rotate(180deg);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .gravity.on .arrow {
    transform: rotate(0deg);
  }

  .empty {
    position: absolute;
    left: 50%;
    bottom: 9rem;
    width: min(22rem, 80%);
    margin: 0;
    transform: translateX(-50%);
    text-align: center;
    color: rgba(255, 248, 239, 0.62);
    font-size: 1.05rem;
  }
</style>
