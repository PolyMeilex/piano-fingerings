import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as major from "./major-scales.js";
import * as minor from "./minor-scales.js";
import { scalesHtml } from "./render.js";

const template = readFileSync(new URL("./template.html", import.meta.url), "utf8");

const pages = [
  { file: "major.html", title: "Major scales", scales: major.SCALES, svg: major.majorScaleSvg, quality: "major" },
  { file: "minor.html", title: "Natural minor scales", scales: minor.SCALES, svg: minor.minorScaleSvg, quality: "minor" },
];

mkdirSync("dist", { recursive: true });
for (const { file, title, scales, svg, quality } of pages) {
  const html = template
    .replace("<title>Piano fingering</title>", `<title>${title}</title>`)
    .replace(
      '<main id="scales"></main>',
      `<main id="scales">${scalesHtml(scales, svg, quality)}\n    </main>`,
    );

  if (!html.includes(`<title>${title}</title>`) || !html.includes("<svg")) {
    throw new Error("main: template.html did not match expected structure");
  }

  writeFileSync(`dist/${file}`, html);
  console.log(`dist/${file} (${(html.length / 1024).toFixed(1)} KiB)`);
}

const links = pages
  .map(({ file, title }) => `\n          <li><a href="dist/${file}">${title}</a></li>`)
  .join("");
const index = template
  .replace("</style>", "  a {\n        color: #d0bcff;\n      }\n    </style>")
  .replace(
    '<main id="scales"></main>',
    `<main>
      <section>
        <h2>Piano fingering</h2>
        <ul>${links}
        </ul>
      </section>
    </main>`,
  );

if (!index.includes('<a href="')) {
  throw new Error("main: template.html did not match expected structure");
}

writeFileSync("index.html", index);
console.log("index.html");

const example = major.majorScaleSvg(
  major.SCALES.find((scale) => scale.name === "B"),
  "right",
);
mkdirSync("docs", { recursive: true });
writeFileSync("docs/b-major-right.svg", `${example}\n`);
console.log("docs/b-major-right.svg");
