/*global chrome*/

const relayRequestMessageType = 'relay-request';

export async function pingCloudFunctions() {
	chrome.runtime.sendMessage({
		type: relayRequestMessageType,
		payload: {ping: 'ping'},
		routeKeyPath: 'analysis.statsmodels'
	});
	chrome.runtime.sendMessage({
		type: relayRequestMessageType,
		payload: {ping: 'ping'},
		routeKeyPath: 'analysis.distribution'
	});
}

export async function performLinearRegressionAnalysis(colXArr, colYArr, colXLabel, colYLabel, XYCols) {
	const result = await new Promise(function (resolve, reject) {
		const callback = function ({error, ...rest}) {
			if (error) {
				reject(error);
			} else {
				resolve(rest);
			}
		};
		chrome.runtime.sendMessage({
			type: relayRequestMessageType,
			payload: {x: colXArr, y: colYArr},
			routeKeyPath: 'analysis.regression'
		}, callback);
	});
	console.log('result of performLinearRegressionAnalysis:', result);

	// console.log(result.data) // gcloud
	// console.log(result.data.body); // Lambda
	const {
		conf_low,
		conf_upp,
		mean_x,
		mean_y,
		std_x,
		std_y,
		pvalues,
		rsquared,
		corrcoef,
		cov,
		degree_2_poly,
		degree_3_poly,
		degree_4_poly,
		degree_5_poly,
		degree_6_poly,
		slope,
		intercept,
		mean_ci_low,
		mean_ci_upp,
		centered_2_poly,
		centered_3_poly,
		centered_4_poly,
		centered_5_poly,
		centered_6_poly,
	} = result.data;

	console.log(result.data);

	return {
		confLow: conf_low,
		confUpp: conf_upp,
		meanCiLow: mean_ci_low,
		meanCiUpp: mean_ci_upp,
		corrcoef: corrcoef[1][0].toFixed(4) / 1,
		covariance: cov[1][0].toFixed(4) / 1,
		colXLabel,
		colAMean: mean_x.toFixed(4) / 1,
		colAStdev: std_x.toFixed(4) / 1,
		colYLabel,
		colBMean: mean_y.toFixed(4) / 1,
		colBStdev: std_y.toFixed(4) / 1,
		pValue: pvalues[1].toFixed(4) / 1,
		degree2Poly: degree_2_poly,
		degree3Poly: degree_3_poly,
		degree4Poly: degree_4_poly,
		degree5Poly: degree_5_poly,
		degree6Poly: degree_6_poly,
		centeredDegree2Poly: centered_2_poly,
		centeredDegree3Poly: centered_3_poly,
		centeredDegree4Poly: centered_4_poly,
		centeredDegree5Poly: centered_5_poly,
		centeredDegree6Poly: centered_6_poly,
		coordinates: XYCols,
		linearRegression: {
			coefficients: [ slope.toFixed(4) / 1, intercept.toFixed(4) / 1 ],
			determination: rsquared.toFixed(4) / 1,
		},
	};
}

export async function performDistributionAnalysis(colY, vals, numberOfBins) {
	const colYLabel = colY.label;
	// TODO: Add some error here
	if (vals.length === 0) return;

	const result = await new Promise(function (resolve, reject) {
		const callback = function ({error, ...rest}) {
			if (error) {
				reject(error);
			} else {
				resolve(rest);
			}
		};
		chrome.runtime.sendMessage({
			type: relayRequestMessageType,
			payload: {y: vals},
			routeKeyPath: 'analysis.distribution'
		}, callback);
	});
	console.log('result of performDistributionAnalysis:', result);
	console.log(result.data); // gcloud
	// console.log(result.data.body); // Lambda
	const { mean_y, std_y, count, quantiles, histogram, skew, kurtosis } = result.data;
	return {
		count,
		colYLabel,
		colBMean: mean_y,
		colBStdev: std_y,
		colB: vals,
		boxPlotData: quantiles,
		histogram,
		skew,
		kurtosis,
		numberOfBins,
	};
}

export async function createBarChart(colXArr, colYArr, colZArr, colX, colY, colZ, XYZCols) {
	return {
		colXArr,
		colYArr,
		colZArr,
		colX,
		colY,
		colZ,
		coordinates: XYZCols,
	};
}
