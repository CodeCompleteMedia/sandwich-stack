<script>
  import { flashCodeLine, revealPanel } from './animate.js'

  let { layers, hoveredUid, onhover } = $props()

  let lineEls = $state({})

  // The panel lists the pile top-down, so the top slice of bread is the opening
  // <section> tag and the first slice put down — the one at the bottom — is the
  // closing one. Indentation is walked here rather than stored on each layer, so a
  // half-built sandwich, or one with ingredients outside the bread, indents
  // honestly instead of pretending to nest.
  const lines = $derived.by(() => {
    const out = []
    let depth = 0
    for (const layer of [...layers].reverse()) {
      // Nothing held it, so nothing was ever written for it. It is still in
      // `layers` while it tumbles off the table, but it never reaches the markup.
      if (layer.role === 'fallen') continue
      if (layer.role === 'close') depth = Math.max(0, depth - 1)
      out.push({ ...layer, indent: '  '.repeat(depth) })
      if (layer.role === 'open') depth += 1
    }
    return out
  })

  // Flash whichever line was just written.
  $effect(() => {
    const newest = layers.at(-1)
    if (!newest) return
    const el = lineEls[newest.uid]
    if (el) flashCodeLine(el)
  })
</script>

<section class="panel" aria-label="Live HTML for the sandwich" use:revealPanel>
  <header>
    <h2>The HTML you are building</h2>
  </header>

  <pre><code
      >{#each lines as line (line.uid)}<span
          class="tag-line child"
          class:hot={hoveredUid === line.uid}
          bind:this={lineEls[line.uid]}
          onmouseenter={() => onhover(line.uid)}
          onmouseleave={() => onhover(null)}
          role="presentation"
        >{line.indent}{#if line.role === 'open'}&lt;<span class="tag">section</span
          > <span class="attr">class</span>=<span class="str">"{line.id}"</span
          >&gt;{:else if line.role === 'close'}&lt;/<span class="tag">section</span
          >&gt;{:else}&lt;<span class="tag">div</span> <span class="attr">class</span
          >=<span class="str">"layer {line.id}"</span>&gt;&lt;/<span class="tag"
            >div</span
          >&gt;{/if}</span
        >{:else}<span class="comment">&lt;!-- empty: click an ingredient --&gt;</span
        >{/each}</code
    ></pre>

  {#if lines.length}
    <p class="note">
      <strong>Read it top to bottom:</strong> each sandwich is a
      <code class="inline">&lt;section&gt;</code> — the slice on top opens it, the
      slice under the fillings closes it. Another slice on a finished sandwich starts
      the next one. Hover a line to find its slice.
    </p>
  {:else}
    <p class="note">
      Bread is not a filling — it is the element. Two slices open and close a
      <code class="inline">&lt;section&gt;</code>, and anything that does not land
      between them has nothing to belong to, so it slides off the table.
    </p>
  {/if}
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    /* Happy at 24rem, but gives ground before the sandwich does. */
    flex: 0 1 24rem;
    min-width: 13rem;
    padding: 1.25rem;
    background: var(--code-bg);
    border-right: 1px solid var(--edge);
    overflow-y: auto;
  }

  header h2 {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }

  pre {
    margin: 0;
    padding: 0.9rem;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid var(--edge);
    border-radius: 0.75rem;
    overflow-x: auto;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    line-height: 1.75;
    color: #d9e6df;
  }

  .tag-line {
    display: block;
    white-space: pre;
    border-radius: 0.3rem;
  }

  .child {
    cursor: default;
  }

  .child:hover,
  .hot {
    background: rgba(240, 165, 0, 0.22);
    box-shadow: inset 2px 0 0 var(--accent2);
  }

  .tag {
    color: #7fd1a8;
  }
  .attr {
    color: #9fc6ff;
  }
  .str {
    color: #ffcf7a;
  }
  .comment {
    display: block;
    color: #7b8a83;
    font-style: italic;
  }

  .note {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--muted);
  }

  .inline {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8rem;
    color: #ffcf7a;
  }
</style>
