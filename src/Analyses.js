import axios from 'axios';
import jStat from 'jstat';

export async function performLinearRegressionAnalysis(colX, colY, rows) {
  const colXLabel = colX.label;
  const colYLabel = colY.label;
  function mapColumnValues(colID) { return rows.map(row => Number(row[colID])).filter(x=>x) }
  const colA = mapColumnValues(colX.id);
  const colB = mapColumnValues(colY.id);
  const tempABVals = colA.map((_, i) => {
    return [(colA[i]), (colB[i])]
  }).sort();
  // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
  const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/statsmodels';
  const result = await axios.post(gcloud, {
    x: colA,
    y: colB
  }, {
    crossDomain: true,
  })
  console.log(result.data) // gcloud
  // console.log(result.data.body); // Lambda
  function mapBand(position) {
    return result.data.predictions.map(point => {
      return [point.x, point[position]]
    })
  }

  function receiveMessage(event) {
    // console.log('ORIGIN', event);
    // target window is ready, time to send data.
    if (event.data === 'ready') {
      popup.postMessage(outputData, '*');
      window.removeEventListener("message", receiveMessage);
    }
  }
  const popup = window.open(window.location.href + "linear_regression.html", "", "left=9999,top=100,width=450,height=850");
  // set event listener and wait for target to be ready
  window.addEventListener("message", receiveMessage, false);

  const { mean_x, mean_y, std_x, std_y, pvalues, fitted_values, rsquared, corrcoef, cov, slope, intercept } = result.data
  const outputData = {
      upperBand: mapBand('upper'),
      lowerBand: mapBand('lower'),
      corrcoef: corrcoef[1][0],
      covariance: cov[1][0],
      colXLabel,
      colAMean: mean_x,
      colAStdev: std_x,
      colYLabel,
      colBMean: mean_y,
      colBStdev: std_y,
      pValue: pvalues[1],
      tempABVals,
      linearRegressionLinePoints: fitted_values,
      linearRegressionLineR2: rsquared,
      linearRegressionLineSlope: slope,
      linearRegressionLineYIntercept: intercept,
      linearRegressionLineEquation: `${colYLabel} = ${slope.toFixed(4)}*(${colXLabel}) + ${intercept}`,
}}

export async function performDistributionAnalysis(colX, colY, rows) {
  const colYLabel = colY.label;
  function mapColumnValues(colID) { return rows.map(row => Number(row[colID])).filter(x=>x) }
  const colA = mapColumnValues(colX.id);
  const colB = mapColumnValues(colY.id);
  // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
  const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
  const result = await axios.post(gcloud, {
    x: colA,
    y: colB
  }, {
    crossDomain: true,
  })
  console.log(result.data) // gcloud
  // console.log(result.data.body); // Lambda

  function receiveMessage(event) {
    if (event.data === 'ready') {
      popup.postMessage(outputData, '*');
      window.removeEventListener("message", receiveMessage);
    }
  }
  const popup = window.open(window.location.href + "distribution.html", "", "left=9999,top=100,width=450,height=850");
  // set event listener and wait for target to be ready
  window.addEventListener("message", receiveMessage, false);

  const { mean_y, std_y, count, quantiles, histogram } = result.data
  const outputData = {
      count,
      colYLabel,
      colBMean: mean_y,
      colBStdev: std_y,
      colA,
      colB,
      boxPlotData: quantiles,
      histogram
}}

  // const outliers = [];
  // function getBoxValues(data, x) {
  //   x = typeof x === 'undefined' ? 0 : x;
  //   const quantiles = jStat.quantiles(data, [.005, .025, .1, .25, .5, .75, .9, .975, .995])
  //   const boxData = {},
  //     min = Math.min.apply(Math, data),
  //     max = Math.max.apply(Math, data),
  //     q1 = quantiles[3],
  //     median = quantiles[4],
  //     q3 = quantiles[5],
  //     iqr = q3 - q1,
  //     lowerFence = q1 - (iqr * 1.5),
  //     upperFence = q3 + (iqr * 1.5);

  //     for (var i = 0; i < data.length; i++) {
  //       if (data[i] < lowerFence || data[i] > upperFence) {
  //         outliers.push(data[i]);
  //       }
  //     }
  //       boxData.values = {};
  //       boxData.values.x = x;
  //       boxData.values.low = min;
  //       boxData.values.q1 = q1;
  //       boxData.values.median = median;
  //       boxData.values.q3 = q3;
  //       boxData.values.high = max;
  //       boxData.outliers = outliers;
  //       boxData.quantiles = quantiles;
  //       return boxData;
  //    }