import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { drawBasicPath, chartStyles } from "./sharedAnalysisComponents";
import { CONTINUOUS } from "../constants";
import XYAxes from "./XYAxes";
import BoxPlotD3Chart from "./BoxPlotD3Chart";

export default function LineD3Chart({
  mainChartContainer,
  colX,
  colY,
  coordinates,
  x,
  y,
  dotsEnabled,
}) {
  const {
    normalPointSize,
    clickedBarPointSize,
    highlightedPointSize,
    highlightedPointColor,
  } = chartStyles;
  const [showBox, setShowBox] = useState(false);
  const sortedCoordinates = [...coordinates].sort((a, b) => a.x - b.x);

  useEffect(() => {
    if (mainChartContainer.current) {
      const reversedLine = d3
        .line()
        .x((d) => x(d[0]))
        .y((d) => y(d[1]));

      const points = sortedCoordinates.map((coord) => [coord.x, coord.y]);
      const groupedVals = sortedCoordinates.reduce((acc, curr) => {
        acc[curr.x] = acc[curr.x] || [];
        acc[curr.x].push(curr.y);
        return acc;
      }, Object.create(null));

      const groupedMeans = Object.entries(groupedVals).map((group) => [
        group[0],
        d3.mean(group[1]),
      ]);
      const svg = d3.select(mainChartContainer.current).select("g");
      drawBasicPath(
        colX.modelingType === CONTINUOUS ? points : groupedMeans,
        "linearRegressionLine",
        "Line",
        svg,
        null,
        true,
        "#56b4e9",
        reversedLine,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onMouseEnterPoint(d, thisPoint, pointTooltip) {
      d3.select(thisPoint)
        .transition()
        .duration(50)
        .attr("r", highlightedPointSize);
      pointTooltip.transition().duration(200).style("opacity", 0.9);
      pointTooltip
        .html(
          `row: ${d.row.rowNumber}<br>${colY.label}: ${d.y}${
            colX ? `<br>${colX.label}: ${d.x}` : ""
          }`,
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    }

    function onMouseLeavePoint(d, thisPoint, pointTooltip) {
      if (d3.select(thisPoint).style("fill") === highlightedPointColor) {
        d3.select(thisPoint)
          .transition()
          .duration(50)
          .attr("r", clickedBarPointSize);
      } else {
        d3.select(thisPoint)
          .transition()
          .duration(50)
          .attr("r", normalPointSize);
      }
      pointTooltip.transition().duration(500).style("opacity", 0);
    }
    const svg = d3.select(mainChartContainer.current).select("g");
    const pointTooltip = d3
      .select(mainChartContainer.current)
      .append("div")
      .attr("class", "point tooltip")
      .style("opacity", 0);

    if (dotsEnabled) {
      svg
        .selectAll(".point")
        .data(coordinates)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", normalPointSize)
        .attr("cy", (d) => y(d.y))
        .attr("cx", (d) => (d.x ? x(d.x) : x("X")))
        .on(`mouseenter`, function (d) {
          onMouseEnterPoint(d, this, pointTooltip);
        })
        .on(`mouseleave`, function (d) {
          onMouseLeavePoint(d, this, pointTooltip);
        });
    } else {
      svg.selectAll(".point").remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotsEnabled]);

  return (
    <div>
      <XYAxes
        mainChartContainer={mainChartContainer}
        colX={colX}
        colY={colY}
        x={x}
        y={y}
      />
      <button onClick={() => setShowBox((prev) => !prev)}>Show Box</button>
      {showBox && (
        <BoxPlotD3Chart
          x={x}
          y={y}
          colX={colX}
          colY={colY}
          coordinates={coordinates}
          mainChartContainer={mainChartContainer}
        />
      )}
    </div>
  );
}
