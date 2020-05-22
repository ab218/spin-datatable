import React from 'react';
import axios from 'axios';
import RegressionAnalysis from './RegressionAnalysis';
import DistributionAnalysis from './DistributionAnalysis';
import OnewayAnalysis from './OnewayAnalysis';
import BarChartAnalysis from './BarChartAnalysis';

export default function AnalysisContainer({ popup, setPopup }) {
	if (!popup.length === 0) {
		return null;
	}
	return popup.map((data, i) => {
		if (data.analysisType === 'regression') {
			return <RegressionAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.analysisType === 'distribution') {
			return <DistributionAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.analysisType === 'oneway') {
			return <OnewayAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.analysisType === 'barChart') {
			return <BarChartAnalysis key={i} data={data} setPopup={setPopup} />;
		}
		return null;
	});
}

export async function pingCloudFunctions() {
	const linearRegression = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/regression';
	const distribution = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
	const oneway = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/oneway';
	axios.post(linearRegression, { ping: 'ping' }, { crossDomain: true });
	axios.post(oneway, { ping: 'ping' }, { crossDomain: true });
	axios.post(distribution, { ping: 'ping' }, { crossDomain: true });
}

// bug: if the group only has one data point in it, the cloud function fails.
export async function performOnewayAnalysis(colXArr, colYArr, colX, colY, XYCols) {
	const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/oneway';
	const result = await axios.post(
		gcloud,
		{
			x: colXArr,
			y: colYArr,
		},
		{
			crossDomain: true,
		},
	);
	const { ordered_differences_report, bartlett, levene, x_groups_lists, means_std, anova, summary_table } = result.data;

	return {
		analysisType: 'oneway',
		ordered_differences_report: JSON.parse(ordered_differences_report),
		x_groups_lists: JSON.parse(x_groups_lists),
		anova: JSON.parse(anova),
		coordinates: XYCols,
		bartlett,
		levene,
		colX,
		colY,
		colXArr,
		colYArr,
		means_std: JSON.parse(means_std),
		summary_table,
	};
}

export async function performLinearRegressionAnalysis(colXArr, colYArr, colX, colY, XYCols) {
	// const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
	const result = await axios.post(
		'https://us-central1-optimum-essence-210921.cloudfunctions.net/regression',
		{ x: colXArr, y: colYArr },
		{
			crossDomain: true,
		},
	);
	// console.log(result.data) // gcloud
	// console.log(result.data.body); // Lambda

	console.log(result.data);

	const mean = (numbers) => numbers.reduce((acc, val) => acc + Number(val), 0) / numbers.length;
	return {
		analysisType: 'regression',
		...result.data,
		colX,
		colY,
		colXMean: mean([ ...colXArr ]),
		colYMean: mean([ ...colYArr ]),
		coordinates: XYCols,
	};
}

export async function performDistributionAnalysis(colY, vals, numberOfBins) {
	// TODO: Add some error here
	if (vals.length === 0) return;
	// const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
	const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
	const result = await axios.post(
		gcloud,
		{
			y: vals,
		},
		{
			crossDomain: true,
		},
	);
	console.log(result.data); // gcloud
	// console.log(result.data.body); // Lambda
	const { mean_y, std_y, count, quantiles, histogram, skew, kurtosis } = result.data;
	return {
		analysisType: 'distribution',
		count,
		colObj: colY,
		mean: mean_y,
		stdev: std_y,
		vals,
		boxPlotData: quantiles,
		histogram,
		skew,
		kurtosis,
		numberOfBins,
	};
}

export async function createBarChart(colXArr, colYArr, colZArr, colX, colY, colZ, XYZCols, colXScale) {
	return {
		analysisType: 'barChart',
		colXArr,
		colYArr,
		colZArr,
		colX,
		colY,
		colZ,
		coordinates: XYZCols,
		colXScale,
	};
}
