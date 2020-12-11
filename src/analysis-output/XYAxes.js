import React, { useEffect } from "react";
import * as d3 from "d3";
import { chartStyles } from "./sharedAnalysisComponents";
import "./analysis-window.css";

export default function XYAxes({ x, y, colX, colY, mainChartContainer }) {
  const { margin, height, width, svgWidth, svgHeight } = chartStyles;

  // define the line
  const xAxis = d3.axisBottom().scale(x).ticks(10, "s");
  const yAxis = d3.axisLeft().scale(y).ticks(10, "s");

  useEffect(() => {
    if (mainChartContainer.current) {
      const svg = d3
        .select(mainChartContainer.current)
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // So that lines stay within the bounds of the graph
      svg
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
      // draw axes
      svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
      svg.append("g").attr("class", "y axis").call(yAxis);

      // text label for the x axis
      svg
        .append("text")
        .attr(
          "transform",
          "translate(" + width / 2 + " ," + (height + 50) + ")",
        )
        .style("text-anchor", "middle")
        .text(colX ? colX.label : null);

      // text label for the y axis
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(colY ? colY.label : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
