import React, { useRef } from "react";
import * as d3 from "d3";

export default function BarChartD3Chart({
  // colX,
  colY,
  colZ,
  coordinates,
  // colXScale,
}) {
  const mainChartContainer = useRef(null);
  // const uniqueGroups = [...new Set(coordinates.map((row) => row.group))];

  const chart = (data, height, width, subGraph, title) => {
    console.log(data);
    // set the dimensions and margins of the graph
    const margin = { top: 40, right: 30, bottom: 70, left: 30 };
    const svgWidth = width + margin.left + margin.right + 200;
    const svgHeight = height + margin.top + margin.bottom;

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

    // append the svg object to the div called 'my_dataviz'
    const svg = d3
      .select(mainChartContainer.current)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Compute the position of each group on the pie:
    const pie = d3.pie().value(function (d) {
      return d.value.x;
    });
    const data_ready = pie(d3.entries(data));
    // Now I know that group A goes from 0 degrees to x degrees and so on.

    // shape helper to build arcs:
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll("mySlices")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("fill", function (d) {
        return color(d.data.key);
      })
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7);

    const legend = (svg) => {
      const g = svg
        .attr("transform", `translate(${svgWidth / 2},-${height / 2})`)
        .attr("text-anchor", "start")
        .attr("font-family", "sans-serif")
        .attr("font-size", 14)
        .selectAll("g")
        .data(color.domain().slice().reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 30})`);

      g.append("rect")
        .attr("x", -50)
        .attr("y", 10)
        .attr("width", 25)
        .attr("height", 25)
        .attr("fill", color)
        // .on('click', function(groupLabel) {
        // 	onClickSelectGroupBarChart(groupLabel, colZ);
        // })
        .on(`mouseover`, function (d) {
          d3.select(this).transition().duration(50).attr("opacity", 0.6);
        })
        .on(`mouseout`, function (d) {
          d3.select(this).transition().duration(50).attr("opacity", 1);
        });

      g.append("text")
        .attr("x", -10)
        .attr("y", 30)
        .text((d) => {
          return d;
        });
    };

    // function renameDuplicates(arr) {
    //   const count = {};
    //   const xArr = arr.map((d) => d.x);
    //   xArr.forEach(function (x, i) {
    //     if (xArr.indexOf(x) !== i) {
    //       const duplicateCounter =
    //         x in count ? (count[x] = count[x] + 1) : (count[x] = 1);
    //       const nextCount = duplicateCounter + 1;
    //       let newXValue = x + "(" + nextCount + ")";
    //       while (xArr.indexOf(newXValue) !== -1)
    //         newXValue = x + "(" + (nextCount + 1) + ")";
    //       xArr[i] = newXValue;
    //     }
    //   });
    //   return xArr;
    // }
    // const renamedDuplicatesArr = renameDuplicates(data);

    // const duplicatesChanged = data.reduce((acc, curr, i) => {
    //   return [...acc, { ...curr, x: renamedDuplicatesArr[i] }];
    // }, []);

    // legend for main graph
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("text-decoration", "underline")
      .attr("transform", `translate(${width + 90},50)`)
      .attr("font-size", 16)
      .text(colZ ? colZ.label : colY.label);
    svg.append("g").call(legend);
    return svg.node();
  };

  // data, height, width, subGraph, title
  chart(coordinates, 650, 650, false, false);

  return (
    <div>
      <div ref={mainChartContainer} />
    </div>
  );
}
