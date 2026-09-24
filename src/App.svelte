<script>
  import Stage from './lib/Stage.svelte'
  import Tray from './lib/Tray.svelte'
  import CodePanel from './lib/CodePanel.svelte'
  import { sweepAway, liftOff, pressButton } from './lib/animate.js'

  let layers = $state([])
  let showCode = $state(false)
  let hoveredUid = $state(null)
  let busy = $state(false)
  // Internet gravity: the pile hangs from the ceiling and grows downward, so each
  // new layer is added *under* the last one rather than on top of it.
  let inverted = $state(false)

  let nextUid = 0
  let stage

  // The code is read top-down, so the *top* slice of bread is the opening <section>
  // tag and the slice under the fillings is the closing one. Slices therefore
  // alternate as you go up the pile: close, open, close, open — each pair being one
  // sandwich, stacked as sibling <section> elements.
  //
  //   inside === true  -> a sandwich is open and fillings have somewhere to land
  //   inside === false -> between sandwiches; only bread can start the next one
  //
  // `layers` is kept in pile order, bottom to top. New layers land on whichever end
  // is growing — the top under table gravity, the bottom under internet gravity —
  // so that is the end we walk towards. Coming up from the bottom, a closing slice
  // opens a sandwich; coming down from the top, an opening slice does.
  //
  // Walked rather than counted, so it stays right after Undo, Reset, or an
  // ingredient falling off.
  const inside = $derived.by(() => {
    const walk = inverted ? [...layers].reverse() : layers
    const opener = inverted ? 'open' : 'close'
    let open = false
    for (const layer of walk) {
      if (layer.role === 'close' || layer.role === 'open') open = layer.role === opener
    }
    return open
  })

  // Uids only ever count up, so the newest layer is the highest one — wherever in
  // the pile it ended up.
  const newest = $derived(
    layers.reduce((top, l) => (top && top.uid > l.uid ? top : l), null),
  )

  // Undo only takes back a layer under the gravity that put it there. Flip the
  // switch and the newest layer is on the far end of the pile — pulling it off
  // against gravity would mean reaching past the whole sandwich.
  const canUndo = $derived(!!newest && newest.under === inverted)

  // What fell off is not on the table, so it does not get counted.
  const onTable = $derived(layers.filter((l) => l.role !== 'fallen'))

  // Until the HTML panel is open, the game talks about "layers" rather than
  // "elements" — the markup vocabulary arrives with the lesson, not before it.
  const noun = $derived(showCode ? 'element' : 'layer')
  const countLabel = $derived(
    `${onTable.length} ${noun}${onTable.length === 1 ? '' : 's'}`,
  )

  function toggleCode(event) {
    pressButton(event.currentTarget)
    showCode = !showCode
    // Hover-linking only means anything while the code is on screen.
    hoveredUid = null
  }

  function add(ingredient) {
    // Bread always has somewhere to go: it either seals the sandwich that is open
    // or starts a new one beyond the last. A filling only stays if a sandwich is
    // open to hold it. Growing upward, the first slice is the bottom of a sandwich
    // (its closing tag); growing downward, the first slice is the top (its opening
    // tag) — either way the pile reads the same once the sandwich is sealed.
    const opener = inverted ? 'open' : 'close'
    const sealer = inverted ? 'close' : 'open'
    const role = ingredient.container
      ? inside
        ? sealer
        : opener
      : inside
        ? 'filling'
        : 'fallen'

    const layer = { uid: nextUid++, id: ingredient.id, role, under: inverted }
    layers = inverted ? [layer, ...layers] : [...layers, layer]
  }

  // It slid off the table, so it leaves the list too. Until this fires the layer is
  // still here — it has to be, or there would be nothing to animate falling — but
  // the code panel never writes it, so it was never part of the markup.
  function fell(uid) {
    layers = layers.filter((l) => l.uid !== uid)
  }

  function undo() {
    if (!canUndo || busy) return
    busy = true
    const { uid, under } = newest
    liftOff(stage.getLayerEl(uid), under, () => {
      layers = layers.filter((l) => l.uid !== uid)
      busy = false
    })
  }

  function reset() {
    if (!layers.length || busy) return
    busy = true
    hoveredUid = null
    sweepAway(stage.getLayerEls(), () => {
      layers = []
      // A clean table starts right way up. The gravity switch is locked until a
      // sandwich is built, so otherwise it would be stuck hanging from the ceiling.
      inverted = false
      busy = false
    })
  }
</script>

<div class="app">
  <header class="bar">
    <h1>
      <!-- The title is also the switch for the HTML panel. It is styled to read
           as plain text so the class does not go hunting through the markup
           before the teacher is ready to talk about it. -->
      <button
        type="button"
        class="logo"
        aria-pressed={showCode}
        aria-label={showCode ? 'Hide the HTML panel' : 'Show the HTML panel'}
        onclick={toggleCode}
      >
        Sandwich <span>Stack</span>
      </button>
    </h1>

    <div class="meta">
      <span class="count">{countLabel}</span>
    </div>

    <div class="actions">
      <button type="button" class="ghost" onclick={undo} disabled={!canUndo || busy}>
        Undo
      </button>
      <button type="button" class="danger" onclick={reset} disabled={!layers.length || busy}>
        Reset
      </button>
    </div>
  </header>

  <main>
    {#if showCode}
      <CodePanel {layers} newestUid={newest?.uid} {hoveredUid} onhover={(uid) => (hoveredUid = uid)} />
    {/if}

    <Stage
      bind:this={stage}
      {layers}
      bind:inverted
      {hoveredUid}
      linked={showCode}
      onhover={(uid) => (hoveredUid = uid)}
      onfell={fell}
    />

    <Tray onadd={add} disabled={busy} />
  </main>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 1.1rem;
    background: var(--tray-bg);
    border-bottom: 1px solid var(--edge);
  }

  h1 {
    margin: 0;
  }

  /* Deliberately gives away nothing: no button chrome, no pointer cursor, no
     hover state, no tooltip. It looks and behaves like the title until the
     teacher clicks it. */
  .logo {
    padding: 0;
    font: inherit;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--cream);
    background: none;
    border: 0;
    border-radius: 0.4rem;
    cursor: default;
  }

  .logo span {
    color: var(--accent2);
  }

  .meta {
    flex: 1 1 auto;
  }

  .count {
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.45rem 0.9rem;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button:focus-visible {
    outline: 3px solid var(--accent2);
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ghost {
    color: var(--cream);
    background: var(--chip);
    border: 1px solid var(--edge);
  }

  .ghost:hover:not(:disabled) {
    background: var(--chip-hover);
  }

  .ghost[aria-pressed='true'] {
    color: #21160f;
    background: var(--accent2);
    border-color: var(--accent2);
  }

  .danger {
    color: #ffe8e2;
    background: transparent;
    border: 1px solid var(--accent);
  }

  .danger:hover:not(:disabled) {
    background: var(--accent);
  }

  main {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }

</style>
