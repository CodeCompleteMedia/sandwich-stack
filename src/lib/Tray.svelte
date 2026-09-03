<script>
  import { INGREDIENTS } from './ingredients.js'
  import { pressButton } from './animate.js'

  let { onadd, disabled } = $props()

  function handle(event, ingredient) {
    pressButton(event.currentTarget)
    onadd(ingredient)
  }
</script>

<aside class="tray">
  <h2>Ingredients</h2>
  <p class="hint">Click one and watch it drop.</p>

  <ul>
    {#each INGREDIENTS as ingredient (ingredient.id)}
      <li>
        <button type="button" {disabled} onclick={(e) => handle(e, ingredient)}>
          <span class="thumb">
            <img src={ingredient.src} alt="" draggable="false" />
          </span>
          <span class="label">{ingredient.label}</span>
        </button>
      </li>
    {/each}
  </ul>
</aside>

<style>
  .tray {
    flex: 0 0 auto;
    width: 15rem;
    padding: 1.25rem 1rem 1.5rem;
    background: var(--tray-bg);
    border-left: 1px solid var(--edge);
    overflow-y: auto;
  }

  h2 {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .hint {
    margin: 0.35rem 0 1rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 0.5rem;
    font: inherit;
    font-weight: 600;
    color: var(--cream);
    text-align: left;
    background: var(--chip);
    border: 1px solid var(--edge);
    border-radius: 0.85rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  button:hover:not(:disabled) {
    background: var(--chip-hover);
    border-color: var(--accent);
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .thumb {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 3.25rem;
    height: 2.5rem;
    overflow: hidden;
  }

  .thumb img {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  }

  .label {
    font-size: 1rem;
  }
</style>
