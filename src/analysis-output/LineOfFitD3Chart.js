import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Select, Checkbox } from "antd";
import { DotChartOutlined } from "@ant-design/icons";
import {
  createPoints,
  drawBasicPath,
  removeChartElement,
  updateConfCurves,
} from "./sharedAnalysisComponents";

// magic globals
const margin = { top: 50, right: 50, bottom: 100, left: 50 };
const height = 600;
const width = 700;
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

export default function D3Container({ colX, colY, coordinates, cloudData }) {
  const { reg1, reg2, reg3 } = cloudData;
  const [dotsEnabled, setDotsEnabled] = useState(false);
  const [selectDegreeOptions, setSelectDegreeOptions] = useState({
    linearRegressionLine: true,
    degree2Poly: false,
    degree3Poly: false,
  });
  const [selectShowConfidenceFit, setSelectShowConfidenceFit] = useState({
    linearRegressionLine: false,
    degree2Poly: false,
    degree3Poly: false,
  });
  const [
    selectShowConfidencePrediction,
    setSelectShowConfidencePrediction,
  ] = useState({
    linearRegressionLine: false,
    degree2Poly: false,
    degree3Poly: false,
  });
  // const [checkboxOptions, setCheckboxOptions] = useState({
  //   linearRegressionLine: true,
  //   degree2Poly: false,
  //   degree3Poly: false,
  // });
  const d3Container = useRef(null);
  const linearRegressionCoefficients = reg1.stats["polynomial"];
  const degree2PolyCoefficients = reg2.stats["polynomial"];
  const degree3PolyCoefficients = reg3.stats["polynomial"];

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
  const x = d3
    .scaleLinear()
    .range([0, width])
    .domain([xExtent[0], xExtent[1]])
    .nice();

  const xDomainMin = x.domain()[0];
  const xDomainMax = x.domain()[1];
  // lower divisor = less points = better performance
  const step = (xDomainMax - xDomainMin) / 25;

  const linearRegressionEquation = (x) =>
    linearRegressionCoefficients[0] + linearRegressionCoefficients[1] * x;

  const poly2equation = (x) =>
    degree2PolyCoefficients[0] +
    degree2PolyCoefficients[1] * x +
    degree2PolyCoefficients[2] * x * x;
  const poly3equation = (x) =>
    degree3PolyCoefficients[0] +
    degree3PolyCoefficients[1] * x +
    degree3PolyCoefficients[2] * x * x +
    degree3PolyCoefficients[3] * x * x * x;

  const linearRegressionPoints = createPoints(
    x.domain(),
    step,
    linearRegressionEquation,
  );
  const quadraticRegressionPoints = createPoints(
    x.domain(),
    step,
    poly2equation,
  );
  const cubicRegressionPoints = createPoints(x.domain(), step, poly3equation);

  // define the line
  const xAxis = d3.axisBottom().scale(x).ticks(10, "s");
  const yAxis = d3.axisLeft().scale(y).ticks(10, "s");

  const reversedLine = d3
    .line()
    .x((d) => x(d[0]))
    .y((d) => y(d[1]));

  useEffect(() => {
    if (d3Container.current) {
      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("id", "chart")
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const {
      linearRegressionLine,
      degree2Poly,
      degree3Poly,
    } = selectDegreeOptions;
    if (d3Container.current) {
      const chartContainer = d3.select(d3Container.current);
      const svg = chartContainer.select("g");
      if (linearRegressionLine) {
        drawBasicPath(
          linearRegressionPoints,
          "linearRegressionLine",
          "Linear Regression Line",
          svg,
          null,
          true,
          "#56b4e9",
          reversedLine,
        );
      } else {
        removeChartElement(".linearRegressionLine", chartContainer);
        removeChartElement(`.linearRegressionLine-hitbox`, chartContainer);
      }

      if (degree2Poly) {
        drawBasicPath(
          quadraticRegressionPoints,
          "degree2PolyLine",
          "Quadratic Regression Line",
          svg,
          null,
          true,
          "#e69f00",
          reversedLine,
        );
      } else {
        removeChartElement(".degree2PolyLine", chartContainer);
        removeChartElement(`.degree2PolyLine-hitbox`, chartContainer);
      }

      if (degree3Poly) {
        drawBasicPath(
          cubicRegressionPoints,
          "degree3PolyLine",
          "Cubic Regression Line",
          svg,
          null,
          true,
          "#009e73",
          reversedLine,
        );
      } else {
        removeChartElement(".degree3PolyLine", chartContainer);
        removeChartElement(`.degree3PolyLine-hitbox`, chartContainer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectDegreeOptions]);

  useEffect(
    () => {
      updateConfCurves(
        "linearRegressionLine",
        reg1,
        "linearRegressionLineCI",
        "Linear Regression CI",
        d3Container.current,
        coordinates.map((coord) => coord[0]),
        "95",
        selectShowConfidenceFit,
        reversedLine,
        x,
        y,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectShowConfidenceFit],
  );

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

  function handleChartOptions(value, setSelectOptions) {
    const linearRegressionLine = value.includes("Linear");
    const degree2Poly = value.includes("Quadratic");
    const degree3Poly = value.includes("Cubic");
    const options = {
      linearRegressionLine,
      degree2Poly,
      degree3Poly,
    };
    setSelectOptions(options);
  }

  return (
    <div style={{ display: "flex", margin: "1em" }}>
      <div style={{ width: "250px" }}>
        <DotsButton dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} />
        <div
          style={{
            display: "flex",
            width: "230px",
            justifyContent: "space-between",
          }}
        >
          <span style={{ width: "60px" }}>Degree</span>
          <ChartOptionsSelect
            handleChartOptions={(value) =>
              handleChartOptions(value, setSelectDegreeOptions)
            }
          />
        </div>
        <div>
          <span>Show Confidence Region (Fit)</span>
          <ChartOptionsSelect
            handleChartOptions={(value) =>
              handleChartOptions(value, setSelectShowConfidenceFit)
            }
          />
        </div>
        <div>
          <span>Show Confidence Region (Prediction)</span>
          <ChartOptionsSelect
            handleChartOptions={(value) =>
              handleChartOptions(value, setSelectShowConfidencePrediction)
            }
          />
        </div>
      </div>
      <div ref={d3Container} />
    </div>
  );
}

function ChartOptionsSelect({ handleChartOptions }) {
  const { Option } = Select;
  return (
    <Select
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      mode="multiple"
      style={{ width: "100px", textAlign: "left", marginBottom: "10px" }}
      size={"small"}
      placeholder=""
      defaultValue={["Linear"]}
      onChange={handleChartOptions}
      tagRender={() => null}
      showArrow={true}
    >
      <Option key={"Linear"}>Linear</Option>
      <Option key={"Quadratic"}>Quadratic</Option>
      <Option key={"Cubic"}>Cubic</Option>
    </Select>
  );
}

// function ChartOptionCheckbox({
//   title,
//   id,
//   checkboxOptions,
//   setCheckboxOptions,
// }) {
//   return (
//     <div style={{ display: "flex", justifyContent: "left" }}>
//       <div style={{ marginRight: "10px" }}>
//         <Checkbox
//           onChange={(e) =>
//             setCheckboxOptions((prev) => {
//               return { ...prev, [id]: e.target.checked };
//             })
//           }
//           checked={checkboxOptions[id]}
//         />
//       </div>
//       <div style={{ width: "20%" }}>{title}</div>
//     </div>
//   );
// }
