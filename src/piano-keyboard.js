const W = 40;

const WHITE_KEY_HEIGHT_RATIO = 5;

const BLACK_KEY_WIDTH_RATIO = 0.6;
const BLACK_KEY_HEIGHT_RATIO = 0.65;

const BLACK_KEY_OFFSET = {
  1: -0.1, // C#
  3: 0.1, // D#
  6: -0.12, // F#
  8: 0.0, // G#
  10: 0.12, // A#
};

const COLORS = {
  whiteKey: "#FFFFFF",
  blackKey: "#838383",
  blackKeyOutline: "#4F4E52",
  ink: "#1B1A1E",
  fingers: {
    1: { fill: "#FF8FAB", on: "#4A0F22" },
    2: { fill: "#7CC4FF", on: "#062C4A" },
    3: { fill: "#6EDC9A", on: "#08361C" },
    4: { fill: "#C9A6FF", on: "#2A1066" },
    5: { fill: "#FFB547", on: "#3D2600" },
  },
};

const UNKNOWN_FINGER = { fill: COLORS.whiteKey, on: COLORS.ink };

const isBlack = (midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

function countWhiteKeys(from, to) {
  let count = 0;
  for (let midi = from; midi <= to; midi++) {
    if (!isBlack(midi)) count++;
  }
  return count;
}

const n = (value) => Math.round(value * 100) / 100;

const rect = (x, y, width, height, radius, attrs) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" ` +
  `rx="${n(radius)}" ${attrs}/>`;

const escapeAttr = (value) =>
  String(value).replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);

let nextId = 0;

export function pianoKeyboardSvg({
  lowestNote,
  highestNote,
  notes = [],
  width,
  fontFamily = "system-ui, sans-serif",
  background = "#141218",
}) {
  if (!Number.isInteger(lowestNote) || !Number.isInteger(highestNote)) {
    throw new Error("lowestNote and highestNote must be integer MIDI numbers");
  }
  if (lowestNote > highestNote) {
    throw new Error("lowestNote must not be higher than highestNote");
  }
  notes = notes.map(({ midi, finger, y, crossing = false }) => {
    if (!Number.isInteger(midi) || !Number.isInteger(finger)) {
      throw new Error("Each note needs integer midi and finger numbers");
    }
    if (!(Number.isFinite(y) && y >= 0 && y <= 1)) {
      throw new Error("A note's y must be a number from 0 (top) to 1 (bottom)");
    }
    return { midi, finger, y, crossing: Boolean(crossing) };
  });

  const whiteCount = countWhiteKeys(lowestNote, highestNote);
  const totalWidth = whiteCount * W;
  const height = W * WHITE_KEY_HEIGHT_RATIO;
  const blackWidth = W * BLACK_KEY_WIDTH_RATIO;
  const blackHeight = height * BLACK_KEY_HEIGHT_RATIO;
  const gap = W * 0.04;

  const whiteRects = new Map();
  const blackRects = new Map();
  let whiteIndex = 0;
  for (let midi = lowestNote; midi <= highestNote; midi++) {
    if (isBlack(midi)) {
      if (whiteIndex === 0) continue;
      const pitchClass = ((midi % 12) + 12) % 12;
      const centerX = (whiteIndex + BLACK_KEY_OFFSET[pitchClass]) * W;
      blackRects.set(midi, {
        x: centerX - blackWidth / 2,
        y: 0,
        width: blackWidth,
        height: blackHeight,
      });
    } else {
      whiteRects.set(midi, { x: whiteIndex * W, y: 0, width: W, height });
      whiteIndex++;
    }
  }

  const maskId = `pk-mask-${nextId++}`;
  const parts = [];

  const whiteRadius = W * 0.08;
  const blackRadius = blackWidth * 0.1;
  const blackKeys = [...blackRects.values()].map((r) => ({
    ...r,
    y: r.y + gap / 2,
    height: r.height - gap / 2,
  }));

  parts.push(
    `<mask id="${maskId}" maskUnits="userSpaceOnUse">`,
    rect(0, 0, totalWidth, height, 0, 'fill="#fff"'),
    ...blackKeys.map((k) =>
      rect(
        k.x - gap,
        k.y - gap,
        k.width + gap * 2,
        k.height + gap * 2,
        blackRadius + gap,
        'fill="#000"',
      ),
    ),
    "</mask>",
    `<g mask="url(#${maskId})" fill="${COLORS.whiteKey}">`,
    ...[...whiteRects.values()].map((r) =>
      rect(
        r.x + gap / 2,
        r.y + gap / 2,
        r.width - gap,
        r.height - gap,
        whiteRadius,
        "",
      ),
    ),
    "</g>",
  );

  for (const k of blackKeys) {
    parts.push(
      rect(
        k.x,
        k.y,
        k.width,
        k.height,
        blackRadius,
        `fill="${COLORS.blackKey}"`,
      ),
      rect(
        k.x + gap / 4,
        k.y + gap / 4,
        k.width - gap / 2,
        k.height - gap / 2,
        Math.max(0, blackRadius - gap / 4),
        `fill="none" stroke="${COLORS.blackKeyOutline}" stroke-width="${n(gap / 2)}"`,
      ),
    );
  }

  function markerCenter(note) {
    const key = blackRects.get(note.midi) ?? whiteRects.get(note.midi);
    if (!key) return null;
    return { x: key.x + key.width / 2, y: note.y * height };
  }

  const radius = W * 0.3;
  const lineWidth = radius * 0.3;

  const visible = notes
    .map((note) => ({ note, center: markerCenter(note) }))
    .filter(({ center }) => center !== null);

  for (let i = 0; i + 1 < visible.length; i++) {
    const { center: a } = visible[i];
    const { note: to, center: b } = visible[i + 1];
    const dots = to.crossing
      ? ` stroke-dasharray="0 ${n(lineWidth * 2.5)}"`
      : "";
    parts.push(
      `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" ` +
        `stroke="${COLORS.ink}" stroke-width="${n(lineWidth)}" ` +
        `stroke-linecap="round"${dots}/>`,
    );
  }

  for (const { note, center } of visible) {
    const color = COLORS.fingers[note.finger] ?? UNKNOWN_FINGER;
    parts.push(
      `<circle cx="${n(center.x)}" cy="${n(center.y)}" r="${n(radius)}" ` +
        `fill="${color.fill}" stroke="${COLORS.ink}" ` +
        `stroke-width="${n(radius * 0.15)}"/>`,
      `<text x="${n(center.x)}" y="${n(center.y)}" fill="${color.on}" ` +
        `dominant-baseline="central">` +
        `${note.finger}</text>`,
    );
  }

  const fontAttr = escapeAttr(fontFamily);
  const widthAttr = width === undefined ? "" : ` width="${escapeAttr(width)}"`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(totalWidth)} ${n(height)}"` +
    `${widthAttr} role="img" aria-label="Piano keyboard fingering" ` +
    `font-family="${fontAttr}" font-size="${n(radius * 1.2)}" font-weight="600" ` +
    `text-anchor="middle">` +
    rect(0, 0, totalWidth, height, 0, `fill="${escapeAttr(background)}"`) +
    parts.join("") +
    "</svg>"
  );
}
