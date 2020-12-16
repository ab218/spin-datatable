import * as d3 from "d3";

function makeD3BoxPlot(chartContainer, dependencies) {
  const { colX, coordinates, x, y } = dependencies;
  const yArr = coordinates.map((coord) => coord.y);
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
  const boxPlotStrokeColor = "black";
  const boxWidth = 50;
  const svg = d3.select(chartContainer.current).select("g");
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
}

export default makeD3BoxPlot;
