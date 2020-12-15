import React from "react";
import * as d3 from "d3";
import { chartStyles } from "./sharedAnalysisComponents";
import useD3 from "./useD3";
import "./analysis-window.css";

export default function XYAxes({ x, y, colX, colY }) {
  const { margin, height, width, svgWidth, svgHeight } = chartStyles;

  const ref = useD3((svg) => {
    // define the line
    const xAxis = (g) =>
      g
        .attr("transform", `translate(${margin.left},${height})`)
        .call(d3.axisBottom(x).ticks(10, "s"))
        // text label for the x axis
        .call((g) =>
          g
            .append("text")
            .attr(
              "transform",
              "translate(" + width / 2 + " ," + (height + 50) + ")",
            )
            .style("text-anchor", "middle")
            .text(colX ? colX.label : null),
        );
    const yAxis = (g) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(10, "s"))
        // text label for the y axis
        .call((g) =>
          g
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(colY ? colY.label : null),
        );

    // draw axes
    svg.select(".x-axis").call(xAxis);
    svg.select(".y-axis").call(yAxis);
  });

  return (
    <svg
      ref={ref}
      style={{
        height: svgHeight,
        width: svgWidth,
        marginRight: "0px",
        marginLeft: "0px",
      }}
    >
      <g className="plot-area" />
      <g className="x-axis" />
      <g className="y-axis" />
    </svg>
  );
}
