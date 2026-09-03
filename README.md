# Sandwich Stack

A small browser game for teaching high-school students how HTML elements stack and
nest. Students click ingredients; each one drops from the top of the screen and lands
on the pile. A hidden panel shows the markup they have been building, revealed when
the teacher is ready for it.

Built with **Svelte 5** + **Vite** (small, fast-loading) and **GSAP** for the animation.

## Running it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually <http://localhost:5173>).

To hand it out or put it on a school server:

```bash
npm run build
```

That writes a plain static site to `dist/` — no server-side anything. Copy the folder
to any web host, or open it behind a simple static server. Total weight is about
280 KB, so it loads fast on a classroom Chromebook.

## The HTML panel is hidden behind the logo

**Click the "Sandwich Stack" title in the top-left corner to show or hide the HTML
panel.** There is no button for it. The title is styled to look like plain text —
no pointer cursor, no hover state, no tooltip — so the class does not find the markup
before you want to talk about it.

Until the panel is open, the game counts "layers". Once it is open, it counts
"elements". The markup vocabulary arrives with the lesson rather than ahead of it.

A student who clicks the title will still find the panel. If you want it harder to
stumble onto, say so and it can be moved behind a modifier-click or a key combination.

## Using it in a lesson

- **Click any ingredient** in the right-hand tray. It falls, lands, and the layers
  underneath take the hit and wobble.
- **Click the logo** when you are ready. Every ingredient turns out to be a `<div>`
  *inside* `<div class="sandwich">` — that is the containment idea, made literal.
- **Hover a line of code** and the matching slice lights up while the rest dim.
  Hover a slice and its line of code lights up. This is the part worth dwelling on.
  The linking is only live while the panel is open.
- **The order trips people up on purpose.** The first child in the code is the
  *bottom* of the sandwich, because each new element is added after the last one.
  Reading the code top-to-bottom is reading the sandwich bottom-to-top. Ask students
  to predict the code before they open the panel.
- **Undo** removes the top layer; **Reset** topples the whole thing.

Nothing stops a student from putting ketchup under the bottom slice of bread or
stacking twenty pickles. Those "wrong" sandwiches are usually the useful ones to talk
about — the browser will happily render nonsense too.

## How it is put together

```
src/
  App.svelte              layout, the layer list, the logo switch, Undo / Reset
  lib/
    ingredients.js        the seven ingredients and their measurements
    Stage.svelte          the plate, the pile, and how tall each layer sits
    Layer.svelte          one slice
    Tray.svelte           the ingredient buttons
    CodePanel.svelte      the live HTML view
    animate.js            every GSAP animation in the game
art-source/               the original full-size PNGs
```

### The measurements in `ingredients.js`

Each photo has a different amount of transparent padding around the food, so the
files cannot simply be centred on each other. `ingredients.js` records the alpha
bounding box of every image, which lets `layout()` place each picture by its
*content* — the food itself lands on the stack's centre line and on the top of the
layer below.

Two numbers are hand-tuned per ingredient:

- `width` — how wide the food renders, as a fraction of the bread.
- `lift` — how much taller the sandwich gets when this layer is added. It is much
  less than the height of the picture, because the food is photographed at an angle
  and each layer only shows its front edge once something sits on top of it.

Change those two to change how the sandwich packs together.

### The art

`art-source/` holds the original PNGs (about 11 MB). The versions the game actually
loads are in `src/assets/ingredients/` — resized to 800 px wide and converted to
WebP, which brought them down to 236 KB with no visible difference at the size they
render. To swap in new artwork, drop a transparent PNG in `art-source/`, make a WebP
of it, and update that ingredient's `img` measurements.

### Animation

All of it lives in `animate.js`. Each layer is three nested elements so that separate
GSAP tweens never fight over the same transform: `.layer` handles the fall, `.shaker`
the wobble, `.squasher` the squash on impact. The file also honours
`prefers-reduced-motion` — if a student has that set, layers appear without the drop.
