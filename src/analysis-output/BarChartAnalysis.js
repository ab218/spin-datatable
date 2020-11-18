import React from "react";
import Popup from "./PopupWindow";
import BarChartD3Chart from "./BarChartD3Chart";
import PieChartD3Chart from "./PieChartAnalysis";
import BoxPlotAnalysis from "./BoxPlotAnalysis";
import LineChartAnalysis from "./LineChartAnalysis";

import "./analysis-window.css";

export default function BarChartAnalysis({ data, setPopup }) {
  const {
    analysisType,
    colX,
    colY,
    colZ,
    coordinates,
    colXId,
    colYId,
    colZId,
  } = data;
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
          colXId={colXId}
          colYId={colYId}
          colZId={colZId}
        />
      )}
      {analysisType === "pie" && (
        <PieChartD3Chart
          colX={colX}
          colZ={colZ}
          coordinates={coordinates}
          colXId={colXId}
          colZId={colZId}
        />
      )}
      {analysisType === "box" && (
        <BoxPlotAnalysis colX={colX} colY={colY} coordinates={coordinates} />
      )}
      {analysisType === "line" && (
        <LineChartAnalysis
          colX={colX}
          colY={colY}
          colZ={colZ}
          coordinates={coordinates}
          colXId={colXId}
          colYId={colYId}
          colZId={colZId}
        />
      )}
    </Popup>
  );
}

const TitleText = ({ colY, colX }) => (
  <h1 style={{ textAlign: "center" }}>Graph Builder</h1>
);
