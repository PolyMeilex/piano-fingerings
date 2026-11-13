export const scalesHtml = (scales, svg, quality) =>
  scales
    .map(
      (scale) => `
    <section>
      <h2>${scale.name} ${quality}</h2>
      <h3>Right hand</h3>
      ${svg(scale, "right")}
      <h3>Left hand</h3>
      ${svg(scale, "left")}
    </section>`,
    )
    .join("");
