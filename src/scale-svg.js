import { pianoKeyboardSvg } from "./piano-keyboard.js";

function scaleNotes(steps, tonic, { fingers, crossings, y }) {
  let midi = tonic;
  return fingers.map((finger, i) => {
    if (i > 0) midi += steps[(i - 1) % steps.length];
    return { midi, finger, y: y[i] / 100, crossing: crossings.includes(i) };
  });
}

export const scaleSvg =
  ({ steps, lowestNote, highestNote }) =>
  (scale, hand) =>
    pianoKeyboardSvg({
      lowestNote,
      highestNote,
      notes: scaleNotes(steps, scale.tonic, scale[hand]),
    });
