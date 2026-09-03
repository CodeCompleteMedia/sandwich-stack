<script>
  import Stage from './lib/Stage.svelte'
  import Tray from './lib/Tray.svelte'
  import CodePanel from './lib/CodePanel.svelte'
  import { sweepAway, liftOff, pressButton } from './lib/animate.js'

  let layers = $state([])
  let showCode = $state(false)
  let hoveredUid = $state(null)
  let busy = $state(false)

  let nextUid = 0
  let stage

  // Until the HTML panel is open, the game talks about "layers" rather than
  // "elements" — the markup vocabulary arrives with the lesson, not before it.
  const noun = $derived(showCode ? 'element' : 'layer')
  const countLabel = $derived(
    `${layers.length} ${noun}${layers.length === 1 ? '' : 's'}`,
  )

  function toggleCode(event) {
    pressButton(event.currentTarget)
    showCode = !showCode
    // Hover-linking only means anything while the code is on screen.
    hoveredUid = null
  }

  function add(ingredient) {
    layers = [...layers, { uid: nextUid++, id: ingredient.id }]
  }

  function undo() {
    if (!layers.length || busy) return
    busy = true
    const els = stage.getLayerEls()
    liftOff(els.at(-1), () => {
      layers = layers.slice(0, -1)
      busy = false
    })
  }

  function reset() {
    if (!layers.length || busy) return
    busy = true
    hoveredUid = null
    sweepAway(stage.getLayerEls(), () => {
      layers = []
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
      <button type="button" class="ghost" onclick={undo} disabled={!layers.length || busy}>
        Undo
      </button>
      <button type="button" class="danger" onclick={reset} disabled={!layers.length || busy}>
        Reset
      </button>
    </div>
  </header>

  <main>
    {#if showCode}
      <CodePanel {layers} {hoveredUid} onhover={(uid) => (hoveredUid = uid)} />
    {/if}

    <Stage
      bind:this={stage}
      {layers}
      {hoveredUid}
      linked={showCode}
      onhover={(uid) => (hoveredUid = uid)}
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
