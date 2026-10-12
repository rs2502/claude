/**
 * The films are portrait (9:16). Phones show them full-bleed; from tablet up
 * they sit on the paper as a framed plate, like a photograph on a page.
 */
export const PLATE =
  "absolute inset-0 overflow-hidden bg-paper md:inset-auto md:aspect-[9/16] md:h-[84svh] md:rounded-[3px] md:shadow-lift";
/** Same box without clipping, for annotation layers that sit around a plate. */
export const PLATE_BOX = "absolute inset-0 md:inset-auto md:aspect-[9/16] md:h-[84svh]";
