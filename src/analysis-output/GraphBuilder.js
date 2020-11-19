import React from "react";
import Popup from "./PopupWindow";
import BarChartD3Chart from "./BarChartD3Chart";
import PieChartD3Chart from "./PieChartD3Chart";
import BoxPlotD3Chart from "./BoxPlotD3Chart";
import LineChartD3Chart from "./LineChartD3Chart";

import "./analysis-window.css";

export default function GraphBuilder({ data, setPopup }) {
  const { analysisType, colX, colY, colZ, coordinates } = data;
  return (
    <Popup
      key={data.id}
      id={data.id}
      title={`Graph Builder`}
      windowWidth={1000}
      setPopup={setPopup}
    >
      <TitleText colY={colY} colX={colX} />
      {analysisType === "bar" && (
        <BarChartD3Chart
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
        />
      )}
      {analysisType === "pie" && (
        <PieChartD3Chart colX={colX} colZ={colZ} coordinates={coordinates} />
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
    </Popup>
  );
}

const TitleText = ({ colY, colX }) => (
  <h1 style={{ textAlign: "center" }}>Graph Builder</h1>
);
