// Ingredient catalogue.
//
// `img` holds the alpha bounding box of each source file, measured once from the
// artwork itself. Every picture has a different amount of transparent padding, so
// without these numbers the layers would not line up when stacked. With them we can
// place each image by its *content* rather than by its file edges:
//
//   contentWidth  -> how wide the food itself should render
//   contentBottom -> sits exactly on the stack line
//   contentCenter -> sits exactly on the stack's centre line
//
// `width` is a fraction of BASE_WIDTH. `lift` is how much taller the sandwich gets
// when this layer is added — roughly the thickness of the front edge you can see,
// which is much less than the full height of the picture because the food is shot
// at a three-quarter angle.

import bread from '../assets/ingredients/bread.webp'
import meat from '../assets/ingredients/meat.webp'
import cheese from '../assets/ingredients/cheese.webp'
import tomatoes from '../assets/ingredients/tomatoes.webp'
import pickles from '../assets/ingredients/pickles.webp'
import ketchup from '../assets/ingredients/ketchup.webp'
import mustard from '../assets/ingredients/mustard.webp'

export const BASE_WIDTH = 380

export const INGREDIENTS = [
  {
    id: 'bread',
    // `container: true` is what makes bread structural rather than a filling: the
    // first slice writes the closing tag, the second writes the opening one and
    // seals the sandwich. See `add()` in App.svelte.
    container: true,
    label: 'Bread',
    src: bread,
    img: { w: 800, h: 378, padL: 31, padB: 61, cw: 754, ch: 255 },
    width: 1.0,
    lift: 44,
  },
  {
    id: 'meat',
    label: 'Meat',
    src: meat,
    img: { w: 800, h: 391, padL: 39, padB: 75, cw: 739, ch: 230 },
    width: 0.95,
    lift: 30,
  },
  {
    id: 'cheese',
    label: 'Cheese',
    src: cheese,
    img: { w: 800, h: 360, padL: 5, padB: 84, cw: 792, ch: 180 },
    width: 0.97,
    lift: 24,
  },
  {
    id: 'tomatoes',
    label: 'Tomatoes',
    src: tomatoes,
    img: { w: 800, h: 198, padL: 76, padB: 24, cw: 651, ch: 154 },
    width: 0.87,
    lift: 34,
  },
  {
    id: 'pickles',
    label: 'Pickles',
    src: pickles,
    img: { w: 800, h: 262, padL: 95, padB: 46, cw: 639, ch: 189 },
    width: 0.82,
    lift: 30,
  },
  {
    id: 'ketchup',
    label: 'Ketchup',
    src: ketchup,
    img: { w: 800, h: 169, padL: 48, padB: 29, cw: 709, ch: 114 },
    width: 0.84,
    lift: 17,
  },
  {
    id: 'mustard',
    label: 'Mustard',
    src: mustard,
    img: { w: 800, h: 167, padL: 106, padB: 43, cw: 599, ch: 95 },
    width: 0.8,
    lift: 17,
  },
]

export const BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]))

/**
 * Turn an ingredient's measurements into the pixel box for its <img>, plus the
 * offsets that pull the picture so its content — not its file edge — lands on the
 * stack's centre line and current height.
 */
export function layout(ingredient) {
  const { img } = ingredient
  const contentWidth = ingredient.width * BASE_WIDTH
  const imgWidth = contentWidth * (img.w / img.cw)
  const imgHeight = imgWidth * (img.h / img.w)

  return {
    contentWidth,
    contentHeight: contentWidth * (img.ch / img.cw),
    imgWidth,
    imgHeight,
    // distance from the wrapper point to the image's left / bottom edge
    offsetX: -((img.padL + img.cw / 2) / img.w) * imgWidth,
    offsetY: -(img.padB / img.h) * imgHeight,
  }
}
