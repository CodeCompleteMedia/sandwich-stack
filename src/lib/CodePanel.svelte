<script>
  import { flashCodeLine, revealPanel } from './animate.js'

  let { layers, hoveredUid, onhover } = $props()

  let lineEls = $state({})

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
      ><span class="tag-line">&lt;<span class="tag">div</span> <span class="attr"
          >class</span
        >=<span class="str">"sandwich"</span>&gt;</span
      >{#each layers as layer (layer.uid)}<span
          class="tag-line child"
          class:hot={hoveredUid === layer.uid}
          bind:this={lineEls[layer.uid]}
          onmouseenter={() => onhover(layer.uid)}
          onmouseleave={() => onhover(null)}
          role="presentation"
        >  &lt;<span class="tag">div</span> <span class="attr">class</span>=<span
            class="str">"layer {layer.id}"</span
          >&gt;&lt;/<span class="tag">div</span>&gt;</span
        >{:else}<span class="comment">  &lt;!-- empty: click an ingredient --&gt;</span
        >{/each}<span class="tag-line">&lt;/<span class="tag">div</span>&gt;</span
      ></code
    ></pre>

  {#if layers.length}
    <p class="note">
      <strong>Read it top to bottom:</strong> the first child is the
      <em>bottom</em> of the sandwich. Each new element is added after the last one, so
      it sits higher on the pile. Hover a line to find its slice.
    </p>
  {:else}
    <p class="note">
      Every ingredient becomes an element <em>inside</em>
      <code class="inline">&lt;div class="sandwich"&gt;</code>. That is
      containment: the sandwich holds its layers.
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
