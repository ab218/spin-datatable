import React from "react";
import * as d3 from "d3";
import Popup from "./PopupWindow";
import BarChartD3Chart from "./BarChartD3Chart";
import PieChartD3Chart from "./PieChartD3Chart";
import BoxPlotD3Chart from "./BoxPlotD3Chart";
import LineD3Chart from "./LineD3Chart";
import LineOfFitD3Chart from "./LineOfFitD3Chart";
import { chartStyles } from "./sharedAnalysisComponents";
import { CONTINUOUS } from "../constants";
import "./analysis-window.css";

const graphBuilderTitle = (analysisType, colX, colY) => {
  const colYvsColX = (colX, colY) => {
    if (colY && colX) {
      return ` of ${colY.label} vs ${colX.label}`;
    } else if (colY) {
      return ` of ${colY.label}`;
    } else if (colX) {
      return ` of ${colX.label}`;
    }
    return "";
  };
  const titleVars = colYvsColX(colX, colY);
  switch (analysisType) {
    case `bar`:
      return `Bar Chart${titleVars}`;
    case `pie`:
      return `Pie Chart${titleVars}`;
    case `box`:
      return `Box and Whisker Chart${titleVars}`;
    case `line`:
      return `Line Chart${titleVars}`;
    case `fit`:
      return `Line of Fit Chart${titleVars}`;
    default:
      return ``;
  }
};

export default function GraphBuilder({ data, setPopup }) {
  const { analysisType, colX, colY, colZ, coordinates, cloudData } = data;
  const title = graphBuilderTitle(analysisType, colX, colY);
  const { margin, height, width } = chartStyles;
  const yExtent = d3.extent(coordinates, (d) => d.y);
  const xExtent = d3.extent(coordinates, (d) => d.x);
  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([yExtent[0], yExtent[1]])
    .nice();

  const xArr = colX ? coordinates.map((coord) => coord.x) : ["X"];

  const x =
    colX && colX.modelingType === CONTINUOUS
      ? d3
          .scaleLinear()
          .range([0, width])
          .domain([xExtent[0], xExtent[1]])
          .nice()
      : d3
          .scaleBand()
          .domain(xArr)
          .rangeRound([0, width - margin.right])
          .paddingInner(1)
          .paddingOuter(0.5);

  return (
    <Popup
      key={data.id}
      id={data.id}
      title={title}
      windowWidth={1100}
      setPopup={setPopup}
    >
      {title && <TitleText title={title} />}
      {analysisType === "bar" && (
        <BarChartD3Chart
          x={x}
          y={y}
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
        />
      )}
      {analysisType === "pie" && (
        <PieChartD3Chart colX={colX} coordinates={coordinates} />
      )}
      {analysisType === "box" && (
        <BoxPlotD3Chart
          x={x}
          y={y}
          colX={colX}
          colY={colY}
          coordinates={coordinates}
        />
      )}
      {analysisType === "line" && (
        <LineD3Chart
          x={x}
          y={y}
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
        />
      )}
      {analysisType === "fit" && (
        <LineOfFitD3Chart
          x={x}
          y={y}
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
          cloudData={cloudData}
        />
      )}
    </Popup>
  );
}

const TitleText = ({ title }) => (
  <h1 style={{ textAlign: "center" }}>{title}</h1>
);
