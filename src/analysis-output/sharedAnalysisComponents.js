import * as d3 from "d3";

export const drawAreaBetweenCurves = (
  x,
  y,
  pointsy0,
  pointsy1,
  name,
  title,
  svg,
) => {
  const area = d3
    .area()
    .x((d) => {
      return x(pointsy0[d][0]);
    })
    .y0((d) => y(pointsy0[d][1]))
    .y1((d) => y(pointsy1[d][1]));

  const indecies = d3.range(pointsy0.length);

  svg
    .append("path")
    .datum(indecies)
    .attr("clip-path", "url(#clip)")
    .attr("class", name)
    .attr("fill-opacity", 0.3)
    .attr("d", area);
};

//generate n (step) points given some range and equation (ie: y = ax^2+bx+c)
export function createPoints(rangeX, step, equation) {
  return Array.from(
    { length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 },
    function (_, i) {
      const x = rangeX[0] + i * step;
      return [x, equation(x)];
    },
  );
}

export const drawBasicPath = (
  points,
  name,
  title,
  svg,
  pathTooltip,
  animate,
  backgroundColor,
  line,
) => {
  const path = svg
    .append("path")
    .data([points])
    .style("fill", "none")
    .attr("clip-path", "url(#clip)")
    .attr("class", name)
    .attr("d", line);
  //find total length of all points of the line chart line
  const totalLength = path.node().getTotalLength();

  //animate the line chart line drawing using path information
  if (animate) {
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
  }

  // invisible hitbox
  svg
    .append("path")
    .data([points])
    .style("fill", "none")
    .attr("clip-path", "url(#clip)")
    .attr("class", `${name}-hitbox`)
    .attr("d", line)
    .on(`mouseenter`, function () {
      if (!pathTooltip) return;
      pathTooltip
        .transition()
        .duration(200)
        .style("opacity", 0.9)
        .style("background-color", backgroundColor);
      pathTooltip
        .html(title)
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on(`mouseleave`, function () {
      if (!pathTooltip) return;
      pathTooltip.transition().duration(500).style("opacity", 0);
    });
};
