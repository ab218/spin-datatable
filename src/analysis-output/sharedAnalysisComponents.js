import * as d3 from "d3";

export function mapPoints(arr1, arr2) {
  const output = [];
  for (let i = 0; i < arr1.length; i++) {
    output.push([arr1[i], arr2[i]]);
  }
  const sortedOutput = output.sort((a, b) => b[0] - a[0]);
  return sortedOutput;
}

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

export function updateConfCurves(
  degree,
  data,
  curveClass,
  title,
  container,
  xVals,
  alpha,
  CI,
  line,
  x,
  y,
) {
  const chartContainer = d3.select(container);
  const svg = chartContainer.select("g");
  const curveClassFit = `${curveClass}Fit`;
  const curveClassObs = `${curveClass}Obs`;
  const dotCurveClassFit = `.${curveClass}Fit`;
  const dotCurveClassObs = `.${curveClass}Obs`;
  const hitboxClassFit = `.${curveClass}Fit-hitbox`;
  const hitboxClassObs = `.${curveClass}Obs-hitbox`;
  const removeChartElement = (className) =>
    chartContainer.selectAll(className).remove();
  // const coordinatesX = coordinates.map((coord) => coord[0]);
  if (CI && CI[degree].fit) {
    removeChartElement(dotCurveClassFit);
    removeChartElement(hitboxClassFit);
    drawBasicPath(
      mapPoints(xVals, data.ci[alpha[degree]].mean_ci_upper),
      curveClassFit,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
    drawBasicPath(
      mapPoints(xVals, data.ci[alpha[degree]].mean_ci_lower),
      curveClassFit,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
    drawAreaBetweenCurves(
      x,
      y,
      mapPoints(xVals, data.ci[alpha[degree]].mean_ci_lower),
      mapPoints(xVals, data.ci[alpha[degree]].mean_ci_upper),
      curveClassFit,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
  } else {
    removeChartElement(dotCurveClassFit);
    removeChartElement(hitboxClassFit);
  }
  if (CI && CI[degree].obs) {
    removeChartElement(dotCurveClassObs);
    removeChartElement(hitboxClassObs);
    drawBasicPath(
      mapPoints(xVals, data.ci[alpha[degree]].obs_ci_upper),
      curveClassObs,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
    drawBasicPath(
      mapPoints(xVals, data.ci[alpha[degree]].obs_ci_lower),
      curveClassObs,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
    drawAreaBetweenCurves(
      x,
      y,
      mapPoints(xVals, data.ci[alpha[degree]].obs_ci_lower),
      mapPoints(xVals, data.ci[alpha[degree]].obs_ci_upper),
      curveClassFit,
      title,
      svg,
      null,
      null,
      null,
      line,
    );
  } else {
    removeChartElement(dotCurveClassObs);
    removeChartElement(hitboxClassObs);
  }
}

export const removeChartElement = (className, container) =>
  container.selectAll(className).remove();
