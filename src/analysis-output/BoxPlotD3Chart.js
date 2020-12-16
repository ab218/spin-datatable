import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { chartStyles, DotsButton } from "./sharedAnalysisComponents";
import makeXYAxes from "./makeXYAxes";
import makeD3BoxPlot from "./makeD3BoxPlot";

export default function BoxPlotD3Chart({ colX, colY, coordinates, x, y }) {
  const mainChartContainer = useRef(null);
  const [dotsEnabled, setDotsEnabled] = useState(false);
  const {
    normalPointSize,
    clickedBarPointSize,
    highlightedPointSize,
    highlightedPointColor,
  } = chartStyles;

  useEffect(() => {
    makeXYAxes(mainChartContainer, { x, y, colX, colY });
    makeD3BoxPlot(mainChartContainer, { colX, coordinates, x, y });
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
    <>
      <SideBar dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} />
      <div ref={mainChartContainer} />;
    </>
  );
}

function SideBar({ showBox, setShowBox, dotsEnabled, setDotsEnabled }) {
  return (
    <div style={{ width: "20%" }}>
      <DotsButton dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} />
    </div>
  );
}
