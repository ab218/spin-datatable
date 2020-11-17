import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
// import { useRowsState } from "../context/SpreadsheetProvider";

// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
const width = 300 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;
const center = 1;
const boxWidth = 40;
// const normalPointSize = 4;
// const highlightedPointColor = "red";
// const highlightedPointSize = normalPointSize * 1.5;
// const clickedBarPointSize = normalPointSize * 1.5;

function makeSvg(container, className, customWidth, manyGroups = 0) {
  return d3
    .select(container)
    .append("svg")
    .attr("class", className)
    .attr("width", (customWidth || width) + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + manyGroups)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

export default function D3Container({
  coordinates,
  // frequencies,
  colObj,
  // vals,
  // min,
  // max,
  // q1,
  // q3,
  // median,
  colValsWithRowData,
}) {
  function getFrequencies(vals) {
    let counts = {};
    for (var i = 0; i < vals.length; i++) {
      const element = vals[i];
      counts[element] = counts[element] ? counts[element] + 1 : 1;
    }
    return counts;
  }
  // Compute summary statistics used for the box:
  const vals = coordinates.map((coord) => coord.x);
  const boxDataSorted = vals.sort(d3.ascending);
  const q1 = d3.quantile(boxDataSorted, 0.25);
  const median = d3.quantile(boxDataSorted, 0.5);
  const q3 = d3.quantile(boxDataSorted, 0.75);
  // interQuantileRange = q3 - q1;
  const min = boxDataSorted[0];
  const max = boxDataSorted[boxDataSorted.length - 1];
  const frequencies = getFrequencies(vals);
  const boxContainer = useRef(null);
  // const { rows } = useRowsState();
  const freqKeys = frequencies ? Object.keys(frequencies) : null;

  // function onMouseEnterPoint(d, thisPoint, colLabel, pointTooltip, rows) {
  //   const selectedRowNumber = rows.findIndex((row) => row.id === d.rowID) + 1;
  //   d3.select(thisPoint)
  //     .transition()
  //     .duration(50)
  //     .attr("r", highlightedPointSize);
  //   pointTooltip.transition().duration(200).style("opacity", 0.9);
  //   pointTooltip
  //     .html(`Row: ${selectedRowNumber}<br>${colLabel}: ${d.value}`)
  //     .style("left", d3.event.pageX + "px")
  //     .style("top", d3.event.pageY - 28 + "px");
  // }

  // function onMouseLeavePoint(d, thisPoint, pointTooltip) {
  //   if (d3.select(thisPoint).style("fill") === highlightedPointColor) {
  //     d3.select(thisPoint)
  //       .transition()
  //       .duration(50)
  //       .attr("r", clickedBarPointSize);
  //   } else {
  //     d3.select(thisPoint).transition().duration(50).attr("r", normalPointSize);
  //   }
  //   pointTooltip.transition().duration(500).style("opacity", 0);
  // }

  const manyGroups =
    freqKeys && freqKeys.length > 10 ? freqKeys.length * 14 : 0;

  const heightWithGroups = height + manyGroups;
  // Add axes
  // const x = d3.scaleLinear().range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([min || 0, max || freqKeys.length])
    .range([heightWithGroups, 0])
    .nice();

  useEffect(
    () => {
      if (min && vals && boxContainer.current) {
        // append the histogram svg object to the body of the page
        makeSvg(boxContainer.current, "boxplotSVG", 100);
        const boxSvg = d3.select(boxContainer.current).select("g");
        // const pointTooltip = d3
        //   .select(boxContainer.current)
        //   .append("div")
        //   .attr("class", "point tooltip")
        //   .style("opacity", 0);

        // Boxplot
        // Show the main vertical line
        boxSvg
          .append("line")
          .attr("x1", center)
          .attr("x2", center)
          .attr("y1", y(min))
          .attr("y2", y(max))
          .attr("stroke", "black");
        boxSvg
          .append("line")
          .attr("x1", center)
          .attr("x2", center)
          .attr("y1", y(min))
          .attr("y2", y(max))
          .attr("stroke", "black");
        boxSvg
          .append("rect")
          .attr("x", center - boxWidth / 2)
          .attr("y", y(q3))
          .attr("height", y(q1) - y(q3))
          .attr("width", boxWidth)
          .attr("stroke", "black")
          .style("fill", "#69b3a2");
        // show median, min and max horizontal lines
        boxSvg
          .selectAll("toto")
          .data([min, median, max])
          .enter()
          .append("line")
          .attr("x1", center - boxWidth / 2)
          .attr("x2", center + boxWidth / 2)
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d))
          .attr("stroke", "black");

        // boxSvg
        //   .selectAll("indPoints")
        //   .data(colValsWithRowData)
        //   .enter()
        //   .append("circle")
        //   .on(`mouseenter`, function (d) {
        //     onMouseEnterPoint(d, this, colObj.label, pointTooltip, rows);
        //   })
        //   .on(`mouseleave`, function (d) {
        //     onMouseLeavePoint(d, this, pointTooltip);
        //   })
        //   .attr("cx", () => center - boxWidth / 10)
        //   .attr("cy", (d) => y(d.value))
        //   .attr("r", normalPointSize)
        //   .style("fill", "white")
        //   .attr("stroke", "black");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      style={{
        display: "flex",
        border: "1px solid rgb(192, 192, 192)",
        borderLeft: "none",
      }}
    >
      <div ref={boxContainer} />
    </div>
  );
}
