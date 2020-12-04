import React from "react";
import Popup from "./PopupWindow";
import BarChartD3Chart from "./BarChartD3Chart";
import PieChartD3Chart from "./PieChartD3Chart";
import BoxPlotD3Chart from "./BoxPlotD3Chart";
import LineChartD3Chart from "./LineChartD3Chart";
import LineOfFitD3Chart from "./LineOfFitD3Chart";
import "./analysis-window.css";

const graphBuilderTitle = (analysisType, colX, colY) => {
  const yVsx = (colX, colY) => {
    if (colY && colX) {
      return ` of ${colY.label} vs ${colX.label}`;
    } else if (colY) {
      return ` of ${colY.label}`;
    } else if (colX) {
      return ` of ${colX.label}`;
    }
    return "";
  };
  const titleVars = yVsx(colX, colY);
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
        <BoxPlotD3Chart colX={colX} colY={colY} coordinates={coordinates} />
      )}
      {analysisType === "line" && (
        <LineChartD3Chart
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
        />
      )}
      {analysisType === "fit" && (
        <LineOfFitD3Chart
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
