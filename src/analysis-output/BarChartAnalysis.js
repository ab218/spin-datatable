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
    colXScale,
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
          colXScale={colXScale}
        />
      )}
      {analysisType === "pie" && (
        <PieChartD3Chart
          colX={colX}
          colZ={colZ}
          coordinates={coordinates}
          colXId={colXId}
          colZId={colZId}
          colXScale={colXScale}
        />
      )}
      {analysisType === "box" && (
        <BoxPlotAnalysis
          colX={colX}
          colZ={colZ}
          coordinates={coordinates}
          colXId={colXId}
          colZId={colZId}
          colXScale={colXScale}
        />
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
          colXScale={colXScale}
        />
      )}
    </Popup>
  );
}

const TitleText = ({ colY, colX }) => (
  <h1 style={{ textAlign: "center" }}>Graph Builder</h1>
);
