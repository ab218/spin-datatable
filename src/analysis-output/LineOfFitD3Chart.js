import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Select, Checkbox } from "antd";
import { MinusOutlined } from "@ant-design/icons";
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

// function DotsButton({ dotsEnabled, setDotsEnabled }) {
//   return (
//     <div
//       onClick={(e) => {
//         setDotsEnabled((prev) => !prev);
//       }}
//       className={"toolbar-button"}
//     >
//       <DotChartOutlined
//         style={{
//           opacity: dotsEnabled ? 1 : 0.3,
//           fontSize: "3em",
//         }}
//         className={"graph-builder-icon"}
//       />
//     </div>
//   );
// }

export default function D3Container({ colX, colY, coordinates, cloudData }) {
  const { reg1, reg2, reg3 } = cloudData;
  const [dotsEnabled, setDotsEnabled] = useState(false);
  const [selectDegreeOptions, setSelectDegreeOptions] = useState({
    linearRegressionLine: true,
    degree2Poly: false,
    degree3Poly: false,
  });
  const [alpha, setAlpha] = useState({
    linearRegressionLine: "conf95",
    degree2Poly: "conf95",
    degree3Poly: "conf95",
  });
  const [CI, setCI] = useState({
    linearRegressionLine: { fit: false, obs: false },
    degree2Poly: { fit: false, obs: false },
    degree3Poly: { fit: false, obs: false },
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
        coordinates.map((coord) => coord.x),
        alpha,
        CI,
        reversedLine,
        x,
        y,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [CI["linearRegressionLine"], alpha["linearRegressionLine"]],
  );

  useEffect(
    () => {
      updateConfCurves(
        "degree2Poly",
        reg2,
        "degree2PolyLineCI",
        "Quadratic Regression CI",
        d3Container.current,
        coordinates.map((coord) => coord.x),
        alpha,
        CI,
        reversedLine,
        x,
        y,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [CI["degree2Poly"], alpha["degree2Poly"]],
  );

  useEffect(
    () => {
      updateConfCurves(
        "degree3Poly",
        reg3,
        "degree3PolyLineCI",
        "Cubic Regression CI",
        d3Container.current,
        coordinates.map((coord) => coord.x),
        alpha,
        CI,
        reversedLine,
        x,
        y,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [CI["degree3Poly"], alpha["degree3Poly"]],
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

  const {
    linearRegressionLine,
    degree2Poly,
    degree3Poly,
  } = selectDegreeOptions;

  return (
    <div style={{ display: "flex", margin: "1em" }}>
      <div style={{ width: "250px" }}>
        {/* <DotsButton dotsEnabled={dotsEnabled} setDotsEnabled={setDotsEnabled} /> */}
        <div
          style={{
            display: "flex",
            width: "230px",
            justifyContent: "space-between",
          }}
        >
          <span>Show Points</span>
          <span style={{ alignSelf: "left" }}>
            <Checkbox
              onChange={(e) => setDotsEnabled((prev) => !prev)}
              checked={dotsEnabled}
            />
          </span>
        </div>
        <div
          style={{
            display: "flex",
            width: "230px",
            justifyContent: "space-between",
          }}
        >
          <span style={{ width: "60px" }}>Degree</span>
          <ChartOptionsSelect
            defaultValue={["Linear"]}
            handleChartOptions={(value) =>
              handleChartOptions(value, setSelectDegreeOptions)
            }
          />
        </div>
        {(linearRegressionLine || degree2Poly || degree3Poly) && (
          <ChartOptionsLegend
            chartOptions={selectDegreeOptions}
            setCI={setCI}
            CI={CI}
            setAlpha={setAlpha}
            alpha={alpha}
          />
        )}
      </div>
      <div ref={d3Container} />
    </div>
  );
}

function SetAlphaLevel({ alpha, setAlpha, id }) {
  const { Option } = Select;
  function translateConf(conf) {
    switch (conf) {
      case "conf90":
        return 0.1;
      case "conf95":
        return 0.05;
      case "conf99":
        return 0.01;
      default:
        return 0.05;
    }
  }
  return (
    <Select
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      value={translateConf(alpha[id])}
      style={{ width: 80 }}
      onChange={(val) => {
        return setAlpha((prev) => {
          return { ...prev, [id]: val };
        });
      }}
    >
      <Option value="conf90">0.1</Option>
      <Option value="conf95">0.05</Option>
      <Option value="conf99">0.01</Option>
    </Select>
  );
}

function ChartOptionsSelect({ defaultValue, handleChartOptions }) {
  const { Option } = Select;
  return (
    <Select
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      mode="multiple"
      style={{ width: "100px", textAlign: "left", marginBottom: "10px" }}
      size={"small"}
      placeholder=""
      defaultValue={defaultValue}
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

function ChartOptionsLegend({ chartOptions, setCI, CI, alpha, setAlpha }) {
  function ChartOption({ title, color, id, showCIOptions }) {
    return (
      <tr>
        <td>
          <MinusOutlined
            style={{ cursor: "pointer", fontSize: "20px", color }}
          />
          {title}
        </td>
        {showCIOptions && (
          <React.Fragment>
            <td>
              <Checkbox
                onChange={(e) =>
                  setCI((prev) => {
                    return {
                      ...prev,
                      [id]: { ...prev[id], fit: e.target.checked },
                    };
                  })
                }
                checked={CI[id]["fit"]}
              />
            </td>
            <td>
              <Checkbox
                onChange={(e) =>
                  setCI((prev) => {
                    return {
                      ...prev,
                      [id]: { ...prev[id], obs: e.target.checked },
                    };
                  })
                }
                checked={CI[id]["obs"]}
              />
            </td>
            <td>
              <SetAlphaLevel id={id} alpha={alpha} setAlpha={setAlpha} />
            </td>
          </React.Fragment>
        )}
      </tr>
    );
  }
  return (
    <div style={{ paddingLeft: "5px" }}>
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={{ width: "175px" }} />
            <td
              colSpan={2}
              style={{ width: "100px", textDecoration: "underline" }}
            >
              Confid Regions
            </td>
            <td style={{ width: "100px" }} />
          </tr>
          <tr style={{ height: "10px" }}></tr>
          <tr style={{ textAlign: "center" }}>
            <td>Line of Fit</td>
            <td>Fit</td>
            <td>Indiv</td>
            <td>p</td>
          </tr>
          <tr style={{ height: "10px" }}></tr>
          {chartOptions.linearRegressionLine && (
            <ChartOption
              showCIOptions={true}
              conf
              id="linearRegressionLine"
              title={"Linear"}
              color={"steelblue"}
            />
          )}
          {chartOptions.degree2Poly && (
            <ChartOption
              showCIOptions={true}
              conf
              id="degree2Poly"
              title={"Quadratic"}
              color={"green"}
            />
          )}
          {chartOptions.degree3Poly && (
            <ChartOption
              showCIOptions={true}
              conf
              id="degree3Poly"
              title={"Cubic"}
              color={"darkmagenta"}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}
