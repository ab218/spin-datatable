import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { DotChartOutlined } from "@ant-design/icons";
import { drawBasicPath } from "./sharedAnalysisComponents";
import { CONTINUOUS } from "../constants";

// magic globals
const margin = { top: 50, right: 50, bottom: 100, left: 50 };
const height = 600;
const width = 800;
const svgWidth = width + margin.left + margin.right;
const svgHeight = height + margin.top + margin.bottom;
const normalPointSize = 3;
const clickedBarPointSize = normalPointSize * 2;
const highlightedPointColor = "red";
const highlightedPointSize = normalPointSize * 2.5;

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

export default function D3Container({ colX, colY, colZ, coordinates }) {
  const [dotsEnabled, setDotsEnabled] = useState(false);
  const d3Container = useRef(null);

  const yExtent = d3.extent(coordinates, function (d) {
    return d.y;
  });
  const xExtent = d3.extent(coordinates, function (d) {
    return d.x;
  });

  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([yExtent[0], yExtent[1]])
    .nice();
  const x =
    colX.modelingType === CONTINUOUS
      ? d3
          .scaleLinear()
          .range([0, width])
          .domain([xExtent[0], xExtent[1]])
          .nice()
      : d3
          .scaleBand()
          .domain(coordinates.map((coord) => coord.x))
          .rangeRound([0, width - margin.right])
          .paddingInner(1)
          .paddingOuter(0.5);

  // define the line
  const xAxis = d3.axisBottom().scale(x).ticks(10, "s");
  const yAxis = d3.axisLeft().scale(y).ticks(10, "s");

  const reversedLine = d3
    .line()
    .x((d) => x(d[0]))
    .y((d) => y(d[1]));

  const points =
    colX.modelingType === CONTINUOUS
      ? coordinates.sort((a, b) => a.x - b.x).map((coord) => [coord.x, coord.y])
      : coordinates
          .sort((a, b) => a.x - b.x)
          .map((coord) => [coord.x, coord.y]);

  const groupedVals = coordinates.reduce((acc, curr) => {
    acc[curr.x] = acc[curr.x] || [];
    acc[curr.x].push(curr.y);
    return acc;
  }, Object.create(null));

  const groupedMeans = Object.entries(groupedVals).map((group) => [
    group[0],
    d3.mean(group[1]),
  ]);

  useEffect(() => {
    if (d3Container.current) {
      const svg = d3
        .select(d3Container.current)
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
        .text(colY.label);

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
    const svg = d3.select(d3Container.current).select("g");
    const pointTooltip = d3
      .select(d3Container.current)
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
      <DotsButton dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} />
      <div ref={d3Container} />;
    </div>
  );
}
