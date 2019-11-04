import axios from 'axios';

export async function performLinearRegressionAnalysis(colXArr, colYArr, colXLabel, colYLabel, XYCols) {
  // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
  const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/statsmodels';
  const result = await axios.post(gcloud, {
    x: colXArr,
    y: colYArr
  }, {
    crossDomain: true,
  })
  console.log(result.data) // gcloud
  // console.log(result.data.body); // Lambda
  // function mapBand(position) {
  //   return result.data.predictions.map(point => {
  //     return [point.x, point[position]]
  //   })
  // }

  function receiveMessage(event) {
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
      // upperBand: mapBand('upper'),
      // lowerBand: mapBand('lower'),
      corrcoef: corrcoef[1][0].toFixed(4) / 1,
      covariance: cov[1][0].toFixed(4) / 1,
      colXLabel,
      colAMean: mean_x.toFixed(4) / 1,
      colAStdev: std_x.toFixed(4) / 1,
      colYLabel,
      colBMean: mean_y.toFixed(4) / 1,
      colBStdev: std_y.toFixed(4) / 1,
      pValue: pvalues[1].toFixed(4) / 1,
      tempABVals: XYCols,
      linearRegressionLinePoints: fitted_values,
      linearRegressionLineR2: rsquared.toFixed(4) / 1,
      linearRegressionLineSlope: slope.toFixed(4) / 1,
      linearRegressionLineYIntercept: intercept.toFixed(4) / 1,
      linearRegressionLineEquation: `${colYLabel} = ${slope.toFixed(4) / 1}*(${colXLabel}) + ${intercept.toFixed(4) / 1}`,
}}

export async function performDistributionAnalysis(colY, rows, numberOfBins) {
  const colYLabel = colY.label;
  function mapColumnValues(colID) { return rows.map(row => Number(row[colID])).filter(x => Number(x)) }
  const colB = mapColumnValues(colY.id);
  // TODO: Add some error here
  if (colB.length === 0) return;
  // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
  const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
  const result = await axios.post(gcloud, {
    y: colB
  }, {
    crossDomain: true,
  })
  console.log(result.data) // gcloud
  // console.log(result.data.body); // Lambda
  const { mean_y, std_y, count, quantiles, histogram, skew, kurtosis } = result.data
  return {
      count,
      colYLabel,
      colBMean: mean_y,
      colBStdev: std_y,
      colB,
      boxPlotData: quantiles,
      histogram,
      skew,
      kurtosis,
      numberOfBins,
  }
}