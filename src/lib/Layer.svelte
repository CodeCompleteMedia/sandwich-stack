<script>
  import { layout } from './ingredients.js'

  let { ingredient, bottom, index, dimmed, highlighted, onhover } = $props()

  const box = $derived(layout(ingredient))
</script>

<div
  class="layer"
  class:dimmed
  class:highlighted
  style:bottom="{bottom}px"
  style:z-index={index + 1}
  data-ingredient={ingredient.id}
  onmouseenter={() => onhover?.(true)}
  onmouseleave={() => onhover?.(false)}
  role="presentation"
>
  <div class="shaker">
    <div class="squasher">
      <img
        src={ingredient.src}
        alt={ingredient.label}
        width={box.imgWidth}
        height={box.imgHeight}
        draggable="false"
        style:left="{box.offsetX}px"
        style:bottom="{box.offsetY}px"
      />
    </div>
  </div>
</div>

<style>
  /* The wrapper is a single point: the middle of the stack, at this layer's
     height. The image is then offset so its *content* lands on that point. */
  .layer {
    position: absolute;
    left: 50%;
    width: 0;
    height: 0;
    transition: filter 0.18s ease, opacity 0.18s ease;
  }

  .shaker,
  .squasher {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 0;
  }

  /* Squash from the bottom edge, the way something lands. */
  .squasher {
    transform-origin: 50% 100%;
  }

  img {
    position: absolute;
    display: block;
    max-width: none;
    filter: drop-shadow(0 6px 5px rgba(60, 24, 8, 0.26));
    user-select: none;
    -webkit-user-drag: none;
  }

  .dimmed {
    opacity: 0.35;
    filter: saturate(0.4);
  }

  .highlighted img {
    filter: drop-shadow(0 6px 5px rgba(60, 24, 8, 0.26))
      drop-shadow(0 0 10px rgba(240, 165, 0, 0.85)) brightness(1.1);
  }
</style>
