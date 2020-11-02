import React, { useState } from "react";
import * as d3 from "d3";
import "./analysis-window.css";
import DistributionD3Chart from "./DistributionD3Chart";
import Popup from "./PopupWindow";
import { InputNumber } from "antd";
import { CONTINUOUS } from "../constants";

export default function DistributionAnalysis({ data, setPopup }) {
  const { numberOfBins, colData } = data;
  return (
    <Popup
      key={data.id}
      id={data.id}
      title={`Descriptive Analysis`}
      windowWidth={Math.min(500 * data.colData.length, 1500)}
      setPopup={setPopup}
    >
      <div id="popupcontainer" style={{ textAlign: "center", display: "flex" }}>
        {colData.map((col, i) => (
          <div key={i}>
            <TitleText
              title={`Descriptive Analysis of ${col.yColData.label} ${
                col.yColData.units ? "(" + col.yColData.units + ")" : ""
              }`}
            />
            {col.yColData.modelingType === CONTINUOUS ? (
              <ContinuousDescriptives numberOfBins={numberOfBins} data={col} />
            ) : (
              <NominalDescriptives
                vals={col.colVals}
                colObj={col.yColData}
                missingValues={col.missingValues}
                colValsWithRowData={col.colValsWithRowData}
              />
            )}
          </div>
        ))}
      </div>
    </Popup>
  );
}

const TitleText = ({ title }) => <div className="analysis-title">{title}</div>;

const SummaryStatistics = ({
  sem,
  ci,
  boxDataSorted,
  vals,
  skew,
  kurtosis,
}) => (
  <div style={{ width: "50%", margin: "10px auto" }}>
    <h4 className="table-subtitle">Summary Statistics</h4>
    <table>
      <tbody>
        <tr>
          <td className="table-header large">Count</td>
          <td className="medium right">{boxDataSorted.length}</td>
        </tr>
        <tr>
          <td className="table-header large">Mean</td>
          <td className="medium right">
            {d3.mean(boxDataSorted).toFixed(4) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header large">Std Dev</td>
          <td className="medium right">{d3.deviation(vals).toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td className="table-header large">SEM</td>
          <td className="medium right">{sem.toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td className="table-header large">Lower 95% Mean</td>
          <td className="medium right">{ci[0].toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td className="table-header large">Upper 95% Mean</td>
          <td className="medium right">{ci[1].toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td className="table-header large">Skewness</td>
          <td className="medium right">{skew.toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td className="table-header large">Kurtosis</td>
          <td className="medium right">{kurtosis.toFixed(4) / 1}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const Frequencies = ({ frequencies, n, missingValues = 0 }) => {
  const freqKeys = Object.keys(frequencies);
  return (
    <div style={{ width: "50%", margin: "10px auto" }}>
      <h4 className="table-subtitle">Frequencies</h4>
      <table>
        <tbody>
          <tr>
            <td className="table-header small">Level</td>
            <td className="table-header small right">Count</td>
            <td className="table-header small right">Prob</td>
          </tr>
          {freqKeys.map((key, i) => (
            <tr key={key + "-" + i}>
              <td className="small">{key}</td>
              <td className="small right">{frequencies[key]}</td>
              <td className="small right">
                {(frequencies[key] / n).toFixed(4)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="small">Total</td>
            <td className="small right">{n}</td>
            <td className="small right">1.0000</td>
          </tr>
          <tr>
            <td className="small">N Missing</td>
            <td className="small">{missingValues}</td>
            <td className="small right"></td>
          </tr>
          <tr>
            <td></td>
            <td className="small">{freqKeys.length} Levels</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const Quantiles = ({ max, boxDataSorted, q1, q3, median, min }) => (
  <div style={{ width: "50%", margin: "0 auto" }}>
    <h4 className="table-subtitle">Quantiles</h4>
    <table>
      <tbody>
        <tr>
          <td className="table-header small">100.0%</td>
          <td className="small">Maximum</td>
          <td className="small right">{max}</td>
        </tr>
        <tr>
          <td className="table-header small">99.5%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.995).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">97.5%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.975).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">90.0%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.9).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">75.0%</td>
          <td className="small">Quartile 3</td>
          <td className="small right">{q3.toFixed(6) / 1}</td>
        </tr>
        <tr>
          <td className="table-header small">50.0%</td>
          <td className="small">Median</td>
          <td className="small right">{median}</td>
        </tr>
        <tr>
          <td className="table-header small">25.0%</td>
          <td className="small">Quartile 1</td>
          <td className="small right">{q1.toFixed(6) / 1}</td>
        </tr>
        <tr>
          <td className="table-header small">10.0%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.1).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">2.5%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.025).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">0.5%</td>
          <td className="small" />
          <td className="small right">
            {d3.quantile(boxDataSorted, 0.005).toFixed(6) / 1}
          </td>
        </tr>
        <tr>
          <td className="table-header small">0.0%</td>
          <td className="small">Minimum</td>
          <td className="small right">{min}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

function ContinuousSummaryStatistics({
  sem,
  ci,
  boxDataSorted,
  vals,
  skew,
  kurtosis,
  min,
  max,
  q1,
  q3,
  median,
}) {
  return (
    <React.Fragment>
      <SummaryStatistics
        sem={sem}
        ci={ci}
        boxDataSorted={boxDataSorted}
        vals={vals}
        skew={skew}
        kurtosis={kurtosis}
      />
      <Quantiles
        boxDataSorted={boxDataSorted}
        max={max}
        q1={q1}
        q3={q3}
        median={median}
        min={min}
      />
    </React.Fragment>
  );
}

function NominalDescriptives({
  vals,
  colObj,
  missingValues,
  colValsWithRowData,
}) {
  function getFrequencies(vals) {
    let counts = {};
    for (var i = 0; i < vals.length; i++) {
      const element = vals[i];
      counts[element] = counts[element] ? counts[element] + 1 : 1;
    }
    return counts;
  }

  const frequencies = getFrequencies(vals);

  return (
    <React.Fragment>
      <DistributionD3Chart
        frequencies={frequencies}
        colObj={colObj}
        vals={vals}
        colValsWithRowData={colValsWithRowData}
      />
      <div
        style={{
          border: "1px solid rgb(192, 192, 192)",
          borderLeft: "none",
          borderTop: "none",
        }}
      >
        <div style={{ height: "60px" }}></div>
        <Frequencies
          missingValues={missingValues}
          frequencies={frequencies}
          n={vals.length}
        />
      </div>
    </React.Fragment>
  );
}

function ContinuousDescriptives({ data, numberOfBins }) {
  const [bins, setBins] = useState(numberOfBins);
  const {
    yColData,
    colVals,
    skew,
    kurtosis,
    sem,
    ci,
    colValsWithRowData,
  } = data;
  const boxDataSorted = colVals.sort(d3.ascending);
  // Compute summary statistics used for the box:
  const q1 = d3.quantile(boxDataSorted, 0.25);
  const median = d3.quantile(boxDataSorted, 0.5);
  const q3 = d3.quantile(boxDataSorted, 0.75);
  // interQuantileRange = q3 - q1;
  const min = boxDataSorted[0];
  const max = boxDataSorted[boxDataSorted.length - 1];
  return (
    <React.Fragment>
      <DistributionD3Chart
        colObj={yColData}
        colValsWithRowData={colValsWithRowData}
        min={min}
        max={max}
        q1={q1}
        q3={q3}
        median={median}
        vals={colVals}
        numberOfBins={bins}
      />
      <div
        style={{
          border: "1px solid rgb(192, 192, 192)",
          borderLeft: "none",
          borderTop: "none",
        }}
      >
        <div style={{ height: "60px" }}>
          <div>Bins</div>
          <InputNumber
            min={1}
            max={50}
            defaultValue={bins}
            onChange={(val) => setBins(val)}
          />
        </div>
        <ContinuousSummaryStatistics
          boxDataSorted={boxDataSorted}
          max={max}
          q1={q1}
          q3={q3}
          median={median}
          min={min}
          sem={sem}
          ci={ci}
          vals={colVals}
          skew={skew}
          kurtosis={kurtosis}
        />
      </div>
    </React.Fragment>
  );
}
