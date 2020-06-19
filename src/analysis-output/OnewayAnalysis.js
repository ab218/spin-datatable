import React, { useState } from 'react';
import * as d3 from 'd3';
import './analysis-window.css';
import OnewayD3Chart from './OnewayD3Chart';
import Popup from './PopupWindow';
import { Select } from 'antd';
const { Option } = Select;

export default function OnewayAnalysis({ data, setPopup }) {
	const {
		summary_table,
		coordinates,
		colX,
		colY,
		anova,
		means_std,
		x_groups_lists,
		ordered_differences_report,
		levene,
		bartlett,
	} = data;

	const [ chartOptions, setChartOptions ] = useState({ pooledMean: false, boxPlots: false });

	function handleChartOptions(value) {
		const pooledMean = value.includes('pooledMean');
		const boxPlots = value.includes('boxPlots');
		const options = {
			pooledMean,
			boxPlots,
		};
		setChartOptions(options);
	}

	return (
		<Popup key={data.id} id={data.id} title={`Popup ${data.id}`} windowWidth={1000} setPopup={setPopup}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<TitleText colY={colY} colX={colX} />
				<div style={{ display: 'flex' }}>
					<div>
						<OnewayD3Chart
							chartOptions={chartOptions}
							summary_table={summary_table}
							colX={colX}
							colY={colY}
							x_groups_lists={x_groups_lists}
							coordinates={coordinates}
						/>
						<ChartOptionsSelect handleChartOptions={handleChartOptions} />
					</div>
					<div style={{ overflowY: 'scroll', height: '800px' }}>
						<SummaryOfFit summary_table={summary_table} colX={colX} anova={anova} means_std={means_std} />
						<MeansAndStd means_std={means_std} />
						<Quantiles x_groups_lists={x_groups_lists} />
						<EqualVarianceReport levene={levene} bartlett={bartlett} means_std={means_std} />
						<OrderedDifferencesReport ordered_differences_report={ordered_differences_report} />
					</div>
				</div>
			</div>
		</Popup>
	);
}

// TODO: DRY
const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue.toFixed(4) / 1);

function ChartOptionsSelect({ handleChartOptions }) {
	return (
		<Select
			getPopupContainer={(triggerNode) => triggerNode.parentNode}
			mode="multiple"
			style={{ width: '100%' }}
			size={'small'}
			placeholder="Please select"
			onChange={handleChartOptions}
			maxTagCount={0}
			maxTagPlaceholder={(e) => {
				return 'Select Chart Options';
			}}
		>
			<Option key={'pooledMean'}>Show Pooled Mean</Option>
			<Option key={'boxPlots'}>Show Boxplots</Option>
		</Select>
	);
}

const TitleText = ({ colY, colX }) => (
	<h1>
		Oneway Analysis of {colY.label} {colY.units ? '(' + colY.units + ')' : ''} By {colX.label}{' '}
		{colX.units ? '(' + colX.units + ')' : ''}
	</h1>
);

const SummaryOfFit = ({ summary_table, colX, anova, means_std }) => {
	return (
		<details open style={{ padding: '10px 30px', textAlign: 'center' }}>
			<summary className="analysis-summary-title">Oneway Anova</summary>
			<table>
				<tbody>
					<tr>
						<td colSpan={2} className="table-subtitle">
							Summary of Fit
						</td>
					</tr>
					<tr>
						<td className="table-header large">R-squared</td>
						<td className="right small">{summary_table.rsquared.toFixed(4) / 1}</td>
					</tr>
					<tr>
						<td className="table-header large">Adj R-squared</td>
						<td className="right small">{summary_table.rsquared_adj.toFixed(4) / 1}</td>
					</tr>
					<tr>
						<td className="table-header large">Root Mean Square Error</td>
						<td className="right small">{summary_table.root_mean_squared_error.toFixed(4) / 1 / 1}</td>
					</tr>
					<tr>
						<td className="table-header large">Mean of Response</td>
						<td className="right small">{summary_table.y_mean.toFixed(4) / 1}</td>
					</tr>
					<tr>
						<td className="table-header large">Observations</td>
						<td className="right small">{summary_table.nobs}</td>
					</tr>
				</tbody>
			</table>
			<div style={{ height: '30px' }} />
			<table>
				<tbody>
					<tr>
						<td colSpan={6} className="table-subtitle">
							Analysis of Variance
						</td>
					</tr>
					<tr>
						<td className="table-header large">Source</td>
						<td className="table-header right xsmall">DF</td>
						<td className="table-header right">Sum of Squares</td>
						<td className="table-header right">Mean Square</td>
						<td className="table-header right">F Ratio</td>
						<td className="table-header right">Prob > F</td>
					</tr>
					<tr>
						<td className="header-background">{colX.label}</td>
						<td className="right xsmall">{anova.df.x.toFixed(4) / 1}</td>
						<td className="right small">{anova.sum_sq.x.toFixed(4) / 1}</td>
						<td className="right small">{anova.mean_sq.x.toFixed(4) / 1}</td>
						<td className="right small">{anova.F.x.toFixed(4) / 1}</td>
						<td className="right small">{evaluatePValue(anova['PR(>F)'].x)}</td>
					</tr>
					<tr>
						<td className="header-background">Error</td>
						<td className="right xsmall">{anova.df.Residual}</td>
						<td className="right small">{anova.sum_sq.Residual.toFixed(4) / 1}</td>
						<td className="right small">{anova.mean_sq.Residual.toFixed(4) / 1}</td>
						<td className="right small" />
						<td className="right small" />
					</tr>
					<tr>
						<td className="header-background">C. Total</td>
						<td className="right xsmall">{anova.df.x + anova.df.Residual}</td>
						<td className="right small">{(anova.sum_sq.x + anova.sum_sq.Residual).toFixed(4) / 1}</td>
						<td className="right small" />
						<td className="right small" />
						<td className="right small" />
					</tr>
				</tbody>
			</table>
			<div style={{ height: '30px' }} />
			<table>
				<tbody>
					<tr>
						<td colSpan={6} className="table-subtitle">
							Means for Oneway Analysis
						</td>
					</tr>
					<tr>
						<td className="table-header left">Level</td>
						<td className="table-header right">Number</td>
						<td className="table-header right">Mean</td>
						<td className="table-header right">Std Error</td>
					</tr>
					{renderMeansTable(means_std)}
				</tbody>
			</table>
		</details>
	);
};

function renderMeansTable(means_std) {
	const { x, count, mean, sterr } = means_std;
	const numberOfRows = Object.keys(x).length;
	let output = [];
	for (let i = 0; i < numberOfRows; i++) {
		output.push(
			<tr key={i}>
				<td className="header-background">{x[i]}</td>
				<td className="right small">{count[i]}</td>
				<td className="right small">{mean[i].toFixed(4) / 1 / 1}</td>
				<td className="right small">{sterr[i].toFixed(4) / 1}</td>
			</tr>,
		);
	}
	return output;
}

function renderMeansStdTable(means_std) {
	const { x, count, mean, std, sem } = means_std;
	const numberOfRows = Object.keys(x).length;
	let output = [];
	for (let i = 0; i < numberOfRows; i++) {
		output.push(
			<tr key={i}>
				<td className="header-background">{x[i]}</td>
				<td className="right">{count[i]}</td>
				<td className="right">{mean[i].toFixed(4) / 1}</td>
				<td className="right">{std[i].toFixed(4) / 1}</td>
				<td className="right">{sem[i].toFixed(4) / 1}</td>
			</tr>,
		);
	}
	return output;
}

const MeansAndStd = ({ means_std }) => (
	<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
		<summary className="analysis-summary-title">Means And Std Deviations</summary>
		<table>
			<tbody>
				<tr>
					<td className="table-header">Level</td>
					<td className="table-header right">Number</td>
					<td className="table-header right">Mean</td>
					<td className="table-header right medium">Std Dev</td>
					<td className="table-header right medium">Std Err Mean</td>
				</tr>
				{renderMeansStdTable(means_std)}
			</tbody>
		</table>
	</details>
);

function renderQuantilesTable(x_groups_lists) {
	const { x, y } = x_groups_lists;
	const numberOfRows = Object.keys(x).length;
	let output = [];
	for (let i = 0; i < numberOfRows; i++) {
		output.push(
			<tr key={i}>
				<td className="header-background">{x[i]}</td>
				<td className="right">{y[i][0]}</td>
				<td className="right">{d3.quantile(y[i], 0.1).toFixed(4) / 1}</td>
				<td className="right">{d3.quantile(y[i], 0.25).toFixed(4) / 1}</td>
				<td className="right">{d3.quantile(y[i], 0.5).toFixed(4) / 1}</td>
				<td className="right">{d3.quantile(y[i], 0.75).toFixed(4) / 1}</td>
				<td className="right">{d3.quantile(y[i], 0.9).toFixed(4) / 1}</td>
				<td className="right">{y[i][y[i].length - 1]}</td>
			</tr>,
		);
	}
	return output;
}

const Quantiles = ({ x_groups_lists }) => (
	<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
		<summary className="analysis-summary-title">Quantiles</summary>
		<table>
			<tbody>
				<tr>
					<td className="table-header small">Level</td>
					<td className="table-header right small">Minimum</td>
					<td className="table-header right small">10%</td>
					<td className="table-header right small">25%</td>
					<td className="table-header right small">Median</td>
					<td className="table-header right small">75%</td>
					<td className="table-header right small">90%</td>
					<td className="table-header right small">Maximum</td>
				</tr>
				{renderQuantilesTable(x_groups_lists)}
			</tbody>
		</table>
	</details>
);

function renderOrderedDifferencesReportTable(ordered_differences_report) {
	const {
		index,
		coef,
		'std err': std_err,
		t,
		// 'P>|t|': p_t,
		// 'Conf. Int. Low': ci_low,
		// 'Conf. Int. Upp.': ci_upp,
		'pvalue-hs': p,
	} = ordered_differences_report;
	const numberOfRows = Object.keys(index).length;
	let output = [];
	for (let i = 0; i < numberOfRows; i++) {
		output.push(
			<tr key={i}>
				<td className="header-background">{index[i]}</td>
				<td className="right small">{coef[i].toFixed(4) / 1}</td>
				<td className="right small">{std_err[i].toFixed(4) / 1}</td>
				<td className="right small">{t[i].toFixed(4) / 1}</td>
				<td className="right small">{evaluatePValue(p[i])}</td>
			</tr>,
		);
	}
	return output;
}

const OrderedDifferencesReport = ({ ordered_differences_report }) => (
	<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
		<summary className="analysis-summary-title">Comparisons for each pair using Student's t</summary>
		<table>
			<tbody>
				<tr>
					<td colSpan={6} className="table-subtitle">
						Ordered Differences Report
					</td>
				</tr>
				<tr>
					<td className="table-header">Level - Level</td>
					<td className="table-header right">Difference</td>
					<td className="table-header right">Std Err Diff</td>
					<td className="table-header right">t</td>
					<td className="table-header right">p-Value</td>
				</tr>
				{renderOrderedDifferencesReportTable(ordered_differences_report)}
			</tbody>
		</table>
	</details>
);

const EqualVarianceReport = ({ levene, bartlett, means_std }) => (
	<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
		<summary className="analysis-summary-title">Tests that the Variances are Equal</summary>
		<table>
			<tbody>
				<tr>
					<td className="table-header">Level</td>
					<td className="table-header right">Count</td>
					<td className="table-header right">Std Dev</td>
					<td className="table-header right">MeanAbsDif to Mean</td>
					<td className="table-header right">MeanAbsDif to Median</td>
				</tr>
				{renderEqualVariancesReportTable(means_std)}
				<tr style={{ height: '30px' }} />
				<tr>
					<td style={{ backgroundColor: 'E2D7D7', textAlign: 'left', width: '100px', fontWeight: 'bold' }}>Test</td>
					<td className="table-header right">F Ratio</td>
					<td className="table-header right">Prob > F</td>
				</tr>
				<tr>
					<td className="header-background">Levene</td>
					<td className="right small">{levene[0].toFixed(4) / 1}</td>
					<td className="right small">{evaluatePValue(levene[1])}</td>
				</tr>
				<tr>
					<td className="header-background">Bartlett</td>
					<td className="right small">{bartlett[0].toFixed(4) / 1}</td>
					<td className="right small">{evaluatePValue(bartlett[1])}</td>
				</tr>
			</tbody>
		</table>
	</details>
);

function renderEqualVariancesReportTable(means_std) {
	const { x, count, std, madmean, madmed } = means_std;
	const numberOfRows = Object.keys(x).length;
	let output = [];
	for (let i = 0; i < numberOfRows; i++) {
		output.push(
			<tr key={i}>
				<td className="header-background">{x[i]}</td>
				<td className="right small">{count[i].toFixed(4) / 1}</td>
				<td className="right small">{std[i].toFixed(4) / 1}</td>
				<td className="right small">{madmean[i].toFixed(4) / 1}</td>
				<td className="right small">{madmed[i].toFixed(4) / 1}</td>
			</tr>,
		);
	}
	return output;
}
