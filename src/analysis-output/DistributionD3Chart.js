import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import {
  useSelectDispatch,
  useRowsState,
} from "../context/SpreadsheetProvider";
import { REMOVE_SELECTED_CELLS, SELECT_CELLS_BY_IDS } from "../constants";

// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
const width = 300 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;
const center = 1;
const boxWidth = 40;
const normalBarFill = "#69b3a2";
const clickedBarFill = "red";

function makeSvg(container, className, customWidth) {
  return d3
    .select(container)
    .append("svg")
    .attr("class", className)
    .attr("width", (customWidth || width) + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

function maxBinLength(arr) {
  let highest = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].length > highest) {
      highest = arr[i].length;
    }
  }
  return highest;
}

export default function D3Container({
  frequencies,
  colObj,
  vals,
  numberOfBins,
  min,
  max,
  q1,
  q3,
  median,
}) {
  const histogramContainer = useRef(null);
  const boxContainer = useRef(null);
  const { columns, rows, excludedRows } = useRowsState();
  const dispatchSelectAction = useSelectDispatch();
  const freqKeys = frequencies ? Object.keys(frequencies) : null;

  const removeClickedHistogramBars = (e) => {
    if (e.metaKey) return;
    const histSvg = d3.select(histogramContainer.current).select("g");
    histSvg.selectAll("rect").style("fill", normalBarFill);
  };

  function targetClickEvent(thisBar, values, col) {
    const metaKeyPressed = d3.event.metaKey;
    d3.event.stopPropagation();
    if (!metaKeyPressed) {
      d3.select(histogramContainer.current)
        .selectAll(".histBars")
        .style("fill", normalBarFill);
    }
    thisBar.style("fill", clickedBarFill);
    if (!metaKeyPressed) {
      dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
    }

    const rowIDs = rows.reduce((acc, row) => {
      // TODO:Don't use Number. Won't work for strings.
      return !excludedRows.includes(row.id) &&
        values.includes(Number(row[colObj.id]))
        ? acc.concat(row.id)
        : acc;
    }, []);
    dispatchSelectAction({
      type: SELECT_CELLS_BY_IDS,
      rowIDs,
      columnID: colObj.id,
      rows,
      columns,
    });
  }

  // Add axes
  const x = d3.scaleLinear().range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([min || 0, max || freqKeys.length])
    .range([height, 0])
    .nice();

  useEffect(
    () => {
      // useEffect for frequencies (Categorical Data)
      if (!frequencies) return;
      makeSvg(histogramContainer.current, "histogramSVG", 400);
      const histSvg = d3.select(histogramContainer.current).select("g");
      histSvg
        .append("g")
        .attr("class", "yAxis")
        .attr("transform", "translate(100,0)")
        .call(
          d3.axisLeft().scale(y).ticks(freqKeys.length, "s").tickValues([]),
        );

      function getLargestBin() {
        let counter = 0;
        freqKeys.forEach((key) => {
          if (frequencies[key] > counter) {
            counter = frequencies[key];
          }
        });
        return counter;
      }

      const largestBin = getLargestBin();
      x.domain([0, largestBin]);

      histSvg
        .append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(100," + height + ")")
        .call(d3.axisBottom().scale(x).ticks(5, "s"));

      // Histogram Bars
      histSvg
        .selectAll("histBars")
        .data(freqKeys)
        .enter()
        .append("rect")
        .attr("fill", "#69b3a2")
        .attr("class", "histBars")
        .on(`mouseenter`, function () {
          d3.select(this).transition().duration(50).attr("opacity", 0.6);
        })
        .on(`mouseleave`, function () {
          d3.select(this).transition().duration(50).attr("opacity", 1);
        })
        .on("click", function (d) {
          targetClickEvent(d3.select(this), d, "y");
        })
        .attr("x", 100)
        .attr("y", (_, i) => {
          return y(i + 1);
        })
        // The -1 adds a little bit of padding between bars
        .attr("height", () => Math.max(height / freqKeys.length - 1), 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 100)
        .attr("width", (d) => x(frequencies[d]));

      histSvg
        .selectAll("histBars")
        .data(freqKeys)
        .enter()
        .append("text")
        .text((d) => d)
        .attr("y", (d, i) => {
          return y(i + 1);
        })
        .attr("x", 90)
        .attr("text-anchor", "end")
        .style("fill", "black")
        .attr("transform", `translate(0,${margin.top})`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!frequencies && numberOfBins) {
      makeSvg(histogramContainer.current, "histogramSVG");
    }
  }, [frequencies, numberOfBins]);

  useEffect(
    () => {
      // useEffect for continuous data
      if (numberOfBins === undefined) return;
      const histSvg = d3.select(histogramContainer.current).select("g");
      histSvg
        .append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft().scale(y).ticks(numberOfBins, "s"));
      // set the parameters for the histogram
      const histogram = d3
        .histogram()
        .domain(y.domain()) // then the domain of the graphic
        .thresholds(y.ticks(numberOfBins)); // then the numbers of bins

      // And apply this function to data to get the bins
      const bins = histogram(vals);
      x.domain([0, maxBinLength(bins)]);

      histSvg
        .append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom().scale(x).ticks(5, "s"));

      // Histogram Bars
      histSvg
        .selectAll("histBars")
        .data(bins)
        .enter()
        .append("rect")
        .attr("fill", "#69b3a2")
        .attr("class", "histBars")
        .on(`mouseenter`, function () {
          d3.select(this).transition().duration(50).attr("opacity", 0.6);
        })
        .on(`mouseleave`, function () {
          d3.select(this).transition().duration(50).attr("opacity", 1);
        })
        .on("click", function (d) {
          targetClickEvent(d3.select(this), d, "y");
        })
        .attr("x", 1)
        .attr("y", (d) => y(d.x1))
        // The -1 adds a little bit of padding between bars
        .attr("height", (d) => Math.max(y(d.x0) - y(d.x1) - 1, 0))
        .transition()
        .duration(500)
        .delay((_, i) => i * 100)
        .attr("width", (d) => x(d.length));

      return () => {
        histSvg.selectAll("*").remove();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [numberOfBins],
  );

  useEffect(
    () => {
      if (min && vals && boxContainer.current) {
        // append the histogram svg object to the body of the page
        makeSvg(boxContainer.current, "boxplotSVG", 100);
        const boxSvg = d3.select(boxContainer.current).select("g");

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

        boxSvg
          .selectAll("indPoints")
          .data(vals)
          .enter()
          .append("circle")
          .attr("cx", () => center - boxWidth / 10)
          .attr("cy", (d) => y(d))
          .attr("r", 4)
          .style("fill", "white")
          .attr("stroke", "black");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      style={{ display: "flex", border: "1px solid rgb(192, 192, 192)" }}
      onClick={removeClickedHistogramBars}
    >
      <span ref={histogramContainer} />
      <span ref={boxContainer} />
    </div>
  );
}
