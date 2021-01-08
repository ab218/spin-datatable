import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  useSelectDispatch,
  useRowsState,
} from "../context/SpreadsheetProvider";
import { chartStyles } from "./sharedAnalysisComponents";
import { REMOVE_SELECTED_CELLS, SELECT_CELLS_BY_IDS } from "../constants";

function onMouseEnterSlice(
  d,
  thisSlice,
  legend,
  colLabel,
  sliceTooltip,
  rows,
  colX,
  n,
) {
  const selectedRowNumber = rows.reduce((acc, row, i) => {
    if (row[colX.id] === d.data.key) {
      acc.push(i + 1);
    }
    return acc;
  }, []);
  thisSlice.transition().duration(50).attr("fill-opacity", "0.3");
  legend
    .select("#legend_" + d.data.key)
    .transition()
    .duration(50)
    .attr("opacity", 0.6);
  sliceTooltip.transition().duration(200).style("opacity", 0.9);
  sliceTooltip
    .html(
      `Row: ${selectedRowNumber}<br>${colLabel}: ${d.data.key}<br>n: ${
        d.value
      }<br>% of Total: ${((selectedRowNumber.length / n) * 100).toFixed(2)}%`,
    )
    .style("left", d3.event.pageX + "px")
    .style("top", d3.event.pageY - 28 + "px");
}

function onMouseLeaveSlice(d, thisSlice, legend, sliceTooltip) {
  thisSlice.transition().duration(50).attr("fill-opacity", "1");
  legend
    .select("#legend_" + d.data.key)
    .transition()
    .duration(50)
    .attr("opacity", 1);
  sliceTooltip.transition().duration(500).style("opacity", 0);
}

export default function PieChartD3Chart({ colX, coordinates }) {
  const { width, height, clickedBarFill } = chartStyles;
  const mainChartContainer = useRef(null);
  // set the dimensions and margins of the graph
  const margin = { top: 40, right: 150, bottom: 70, left: 30 };
  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;
  const { rows, columns, excludedRows } = useRowsState();
  const dispatchSelectAction = useSelectDispatch();

  function targetClickEvent(thisBar, data, color) {
    const metaKeyPressed = d3.event.metaKey;
    d3.event.stopPropagation();
    if (!metaKeyPressed) {
      d3.select(mainChartContainer.current)
        .selectAll(".slice")
        .style("fill", function (d) {
          return color(d.data.key);
        });
    }
    thisBar.style("fill", clickedBarFill);
    if (!metaKeyPressed) {
      dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
    }

    const rowIDs = rows.reduce((acc, row, i) => {
      return !excludedRows.includes(row.id) && data.data.key === row[colX.id]
        ? acc.concat(row.id)
        : acc;
    }, []);
    dispatchSelectAction({
      type: SELECT_CELLS_BY_IDS,
      rowIDs,
      columnID: colX.id,
      rows,
      columns,
    });
  }

  useEffect(() => {
    function count(arr) {
      return arr.reduce((a, b) => (a[b] = a[b] + 1 || 1) && a, {});
    }
    const data = count(coordinates.map((coord) => coord.x));
    const sliceTooltip = d3
      .select(mainChartContainer.current)
      .append("div")
      .attr("class", "pieslice tooltip")
      .style("opacity", 0);

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(width, height) / 2 - margin.top;

    const color = d3
      .scaleOrdinal()
      .range([
        "#56B4E9",
        "#E69F00",
        "#009E73",
        "#F0E442",
        "#0072B2",
        "#D55E00",
        "#CC79A7",
        "#999999",
      ]);

    const svg = d3
      .select(mainChartContainer.current)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const pie = d3.pie().value(function (d) {
      return d.value;
    });
    const pieData = pie(d3.entries(data));
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    svg
      .selectAll("mySlices")
      .data(pieData)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("fill", function (d) {
        return color(d.data.key);
      })
      .attr("class", "slice")
      .attr("id", (d) => {
        return "slice_" + d.data.key;
      })
      .on(`mouseover`, function (d) {
        onMouseEnterSlice(
          d,
          d3.select(this),
          legend,
          colX.label,
          sliceTooltip,
          rows,
          colX,
          coordinates.length,
        );
      })
      .on(`mouseout`, function (d) {
        onMouseLeaveSlice(d, d3.select(this), legend, sliceTooltip);
      })
      .on("click", function (d) {
        targetClickEvent(d3.select(this), d, color);
      })
      .attr("stroke", "black")
      .style("stroke-width", "0.5px");

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width / 1.5},-${height / 2})`)
      .attr("text-anchor", "start")
      .attr("font-family", "sans-serif")
      .attr("font-size", 14)
      .selectAll("g")
      .data(pieData)
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * 30})`);

    legend
      .append("rect")
      .attr("id", (d) => {
        return "legend_" + d.data.key;
      })
      .attr("x", -50)
      .attr("y", 10)
      .attr("width", 25)
      .attr("height", 25)
      .attr("fill", function (d) {
        return color(d.data.key);
      })
      .on(`mouseover`, function (d) {
        d3.select(this).transition().duration(50).attr("opacity", 0.6);
        svg
          .select("#slice_" + d.data.key)
          .transition()
          .duration(50)
          .attr("fill-opacity", "0.3");
      })
      .on(`mouseout`, function (d) {
        d3.select(this).transition().duration(50).attr("opacity", 1);
        svg
          .select("#slice_" + d.data.key)
          .transition()
          .duration(50)
          .attr("fill-opacity", "1");
      });

    legend
      .append("text")
      .attr("x", -10)
      .attr("y", 30)
      .text((d) => {
        return d.data.key;
      });

    // legend for main graph
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("text-decoration", "underline")
      .attr("transform", `translate(${width + 90},50)`)
      .attr("font-size", 16)
      .text(colX.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mainChartContainer}></div>;
}
