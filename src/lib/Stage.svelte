<script>
  import Layer from './Layer.svelte'
  import { BY_ID, layout } from './ingredients.js'
  import { dropIn, jiggleStack, thumpPlate, fitStack } from './animate.js'

  let { layers, hoveredUid, onhover, linked } = $props()

  // Widest thing on the plate, used to keep the sandwich inside the stage.
  const NATURAL_WIDTH = 480

  let stageEl, stackEl, plateEl, shadowEl
  let layerEls = $state({})
  let stageW = $state(0)
  let stageH = $state(0)

  // Height of the stack line for each layer: everything added before it, piled up.
  const positions = $derived.by(() => {
    let height = 0
    return layers.map((layer) => {
      const bottom = height
      height += BY_ID[layer.id].lift
      return bottom
    })
  })

  const stackHeight = $derived.by(() => {
    if (!layers.length) return 0
    const top = BY_ID[layers.at(-1).id]
    return positions.at(-1) + layout(top).contentHeight
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
        .map((l) => layerEls[l.uid])
        .filter(Boolean)

      // A slice falling past the cursor would otherwise trigger its own hover
      // and leave the sandwich stuck in the highlighted state, because the
      // browser only fires mouseleave once the *pointer* moves again.
      el.style.pointerEvents = 'none'

      dropIn(el, {
        onImpact: () => {
          jiggleStack(below)
          thumpPlate(plateEl, shadowEl)
        },
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
  <div class="counter"></div>

  <div class="stack" bind:this={stackEl}>
    <div class="shadow" bind:this={shadowEl}></div>
    <div class="plate" bind:this={plateEl}></div>

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

  {#if !layers.length}
    <p class="empty">Pick an ingredient to start your sandwich</p>
  {/if}
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

  /* The counter top the plate sits on. */
  .counter {
    position: absolute;
    inset: auto 0 0 0;
    height: 5.5rem;
    background: linear-gradient(#7a5334, #59391f);
    border-top: 3px solid #96693f;
  }

  .stack {
    position: absolute;
    left: 50%;
    bottom: 4.6rem;
    width: 0;
    /* Grows upward from the plate, and scales about the same point. */
    transform-origin: 50% 100%;
  }

  .plate {
    position: absolute;
    left: 50%;
    bottom: -0.9rem;
    width: 27rem;
    height: 2.1rem;
    margin-left: -13.5rem;
    background: linear-gradient(#f6efe4, #cdbfae 55%, #a9998a);
    border-radius: 50%;
    box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.7);
    transform-origin: 50% 100%;
  }

  .shadow {
    position: absolute;
    left: 50%;
    bottom: -1.4rem;
    width: 30rem;
    height: 2.2rem;
    margin-left: -15rem;
    background: radial-gradient(50% 50%, rgba(0, 0, 0, 0.55), transparent 70%);
    opacity: 0.34;
    filter: blur(6px);
  }

  .slot {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 0;
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
