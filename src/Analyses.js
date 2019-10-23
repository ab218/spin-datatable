import axios from 'axios';

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

export async function performDistributionAnalysis(colY, rows) {
  const colYLabel = colY.label;
  function mapColumnValues(colID) { return rows.map(row => Number(row[colID])).filter(x=>x) }
  const colB = mapColumnValues(colY.id);
  // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
  const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
  const result = await axios.post(gcloud, {
    y: colB
  }, {
    crossDomain: true,
  })
  console.log(result.data) // gcloud
  // console.log(result.data.body); // Lambda
  const { mean_y, std_y, count, quantiles, histogram } = result.data
  return {
      count,
      colYLabel,
      colBMean: mean_y,
      colBStdev: std_y,
      colB,
      boxPlotData: quantiles,
      histogram
  }
}