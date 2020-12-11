import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { DotChartOutlined } from "@ant-design/icons";
import { chartStyles } from "./sharedAnalysisComponents";

function DotsButton({ dotsEnabled, setDotsEnabled }) {
  return (
    <div
      onClick={(e) => {
        setDotsEnabled((prev) => !prev);
      }}
      className={"toolbar-button"}
    >
      <DotChartOutlined
        style={{
          opacity: dotsEnabled ? 1 : 0.3,
          fontSize: "3em",
        }}
        className={"graph-builder-icon"}
      />
    </div>
  );
}

export default function BoxPlotD3Chart({
  mainChartContainer,
  colX,
  colY,
  coordinates,
  x,
  y,
  dotsEnabled = false,
}) {
  const {
    normalPointSize,
    clickedBarPointSize,
    highlightedPointSize,
    highlightedPointColor,
  } = chartStyles;
  const yArr = coordinates.map((coord) => coord.y);
  // const xArr = colX ? coordinates.map((coord) => coord.x) : ["X"];
  const lists = colX
    ? coordinates.reduce((acc, curr) => {
        acc[curr.x] = acc[curr.x] || [];
        acc[curr.x].push(curr.y);
        return acc;
      }, Object.create(null))
    : { X: yArr };

  const uniqueGroups = Object.keys(lists);
  const groupValsSorted = Object.values(lists);

  groupValsSorted.forEach((gV) => gV.sort(d3.ascending));

  useEffect(() => {
    // Boxplot
    const boxPlotStrokeColor = "black";
    const boxWidth = 50;
    const svg = d3.select(mainChartContainer.current).select("g");
    // Show the main vertical line
    svg
      .selectAll("bottomline")
      .data(uniqueGroups)
      .enter()
      .append("line")
      .attr("stroke", boxPlotStrokeColor)
      .attr("x1", (d) => {
        return x(d);
      })
      .attr("x2", (d) => {
        return x(d);
      })
      .attr("y1", (d, i) => {
        const min = groupValsSorted[i][0];
        return y(min);
      })
      .attr("y2", (d, i) => {
        const q1 = d3.quantile(groupValsSorted[i], 0.25);
        return y(q1);
      })
      .attr("class", "boxPlots");

    svg
      .selectAll("topline")
      .data(uniqueGroups)
      .enter()
      .append("line")
      .attr("stroke", boxPlotStrokeColor)
      .attr("x1", (d) => {
        return x(d);
      })
      .attr("x2", (d) => {
        return x(d);
      })
      .attr("y1", (d, i) => {
        const max = groupValsSorted[i][groupValsSorted[i].length - 1];
        return y(max);
      })
      .attr("y2", (d, i) => {
        const q3 = d3.quantile(groupValsSorted[i], 0.75);
        return y(q3);
      })
      .attr("class", "boxPlots");

    svg
      .selectAll("boxplotrect")
      .data(uniqueGroups)
      .enter()
      .append("rect")
      .attr("x", (d) => {
        return x(d) - boxWidth / 2;
      })
      .attr("y", (d, i) => {
        const q3 = d3.quantile(groupValsSorted[i], 0.75);
        return y(q3);
      })
      .attr("height", (d, i) => {
        const q1 = d3.quantile(groupValsSorted[i], 0.25);
        const q3 = d3.quantile(groupValsSorted[i], 0.75);
        const interquantileRange = y(q1) - y(q3);
        return interquantileRange;
      })
      .attr("width", boxWidth)
      .attr("stroke", boxPlotStrokeColor)
      .style("fill", "transparent")
      .attr("class", "boxPlots");

    // show median, min and max horizontal lines
    svg
      .selectAll("medianLines")
      .data(uniqueGroups)
      .enter()
      .append("line")
      .attr("x1", function (d) {
        return x(d) - boxWidth / 2;
      })
      .attr("x2", function (d) {
        return x(d) + boxWidth / 2;
      })
      .attr("y1", function (d, i) {
        return y(d3.quantile(groupValsSorted[i], 0.5));
      })
      .attr("y2", function (d, i) {
        return y(d3.quantile(groupValsSorted[i], 0.5));
      })
      .attr("stroke", boxPlotStrokeColor)
      .style("width", 80)
      .attr("class", "boxPlots");

    svg
      .selectAll("minlines")
      .data(uniqueGroups)
      .enter()
      .append("line")
      .attr("x1", function (d) {
        return x(d) - boxWidth / 2;
      })
      .attr("x2", function (d) {
        return x(d) + boxWidth / 2;
      })
      .attr("y1", function (d, i) {
        return y(groupValsSorted[i][0]);
      })
      .attr("y2", function (d, i) {
        return y(groupValsSorted[i][0]);
      })
      .attr("stroke", boxPlotStrokeColor)
      .style("width", 80)
      .attr("class", "boxPlots");

    svg
      .selectAll("maxlines")
      .data(uniqueGroups)
      .enter()
      .append("line")
      .attr("x1", function (d) {
        return x(d) - boxWidth / 2;
      })
      .attr("x2", function (d) {
        return x(d) + boxWidth / 2;
      })
      .attr("y1", function (d, i) {
        return y(groupValsSorted[i][groupValsSorted[i].length - 1]);
      })
      .attr("y2", function (d, i) {
        return y(groupValsSorted[i][groupValsSorted[i].length - 1]);
      })
      .attr("stroke", boxPlotStrokeColor)
      .style("width", 80)
      .attr("class", "boxPlots");
    return () => {
      svg.selectAll(".boxPlots").remove();
    };
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

  return null;
  // <div>
  //   {/* <DotsButton dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} /> */}
  // </div>
}
