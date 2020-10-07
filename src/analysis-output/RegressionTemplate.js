import React from 'react';
import { Dropdown, Menu } from 'antd';
import { SAVE_VALUES_TO_COLUMN } from '../constants';
import { useRowsDispatch } from '../context/SpreadsheetProvider';
import { evaluatePValue } from './RegressionAnalysis';

const paramEstimates = (coeffs, xLabel, centered, xMean, standard_errors, tvalues, pvalues) => {
	let temp = [];
	let counter = 2;
	for (let i = 2; i < coeffs.length; i++) {
		temp.push(
			<tr key={i}>
				<td className="header-background">
					{centered ? `(${xLabel} - ${xMean})` : xLabel}^{counter}
				</td>
				<td className="small right">{coeffs[i].toFixed(4) / 1}</td>
				<td className="small right">{standard_errors[i].toFixed(4) / 1}</td>
				<td className="small right">{tvalues[i].toFixed(4) / 1}</td>
				<td className="small right">{evaluatePValue(pvalues[i])}</td>
			</tr>,
		);
		counter++;
	}
	return temp;
};

const paramEstimateTable = (coeffs, xLabel, centered, xMean, standard_errors, tvalues, pvalues) => (
	<table>
		<tbody>
			<tr>
				<td colSpan={5} className="table-subtitle">
					Parameter Estimates
				</td>
			</tr>
			<tr>
				<td className="table-header large">Term</td>
				<td className="table-header small right">Estimate</td>
				<td className="table-header small right">Std Error</td>
				<td className="table-header small right">t Value</td>
				<td className="table-header small right">p Value</td>
			</tr>
			<tr>
				<td className="header-background large">Intercept</td>
				<td className="small right">{coeffs[0].toFixed(4) / 1}</td>
				<td className="small right">{standard_errors[0].toFixed(4) / 1}</td>
				<td className="small right">{tvalues[0].toFixed(4) / 1}</td>
				<td className="small right">{evaluatePValue(pvalues[0])}</td>
			</tr>
			<tr>
				<td className="header-background">{xLabel}</td>
				<td className="small right">{coeffs[1].toFixed(4) / 1}</td>
				<td className="small right">{standard_errors[1].toFixed(4) / 1}</td>
				<td className="small right">{tvalues[1].toFixed(4) / 1}</td>
				<td className="small right">{evaluatePValue(pvalues[1])}</td>
			</tr>
			{paramEstimates(coeffs, xLabel, centered, xMean, standard_errors, tvalues, pvalues)}
		</tbody>
	</table>
);

export default function GenerateRegressionTemplate({
	coordinates,
	title,
	id,
	className,
	equation,
	polyDegree,
	coeffs,
	xLabel,
	yLabel,
	xMean,
	centered,
	alpha,
}) {
	const {
		rsquared,
		rsquared_adj,
		mse_error,
		df_model,
		mse_model,
		ssr,
		df_total,
		df_resid,
		standard_errors,
		tvalues,
		pvalues,
		f_pvalue,
	} = polyDegree.stats;
	return (
		<details className={`analysis-details ${className}`} open id={id}>
			<summary className="analysis-summary-title">
				{title} {centered && '(centered)'}
			</summary>
			<div className="left xxlarge">{equation}</div>
			<div style={{ height: '10px' }} />
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<table>
					<tbody>
						<tr>
							<td colSpan={2} className="table-subtitle">
								Summary of fit
							</td>
						</tr>
						<tr>
							<td className="header-background large">R-squared</td>
							<td className="small right">{rsquared.toFixed(4) / 1}</td>
						</tr>
						<tr>
							<td className="header-background large">R-squared Adj</td>
							<td className="small right">{rsquared_adj.toFixed(4) / 1}</td>
						</tr>
						<tr>
							<td className="header-background large">Root Mean Square Error</td>
							<td className="small right">{mse_error.toFixed(4) / 1}</td>
						</tr>
					</tbody>
				</table>
				{alpha &&
				alpha[id] && (
					<SaveDropdown
						coordinates={coordinates}
						id={id}
						alpha={alpha}
						title={title}
						polyDegree={polyDegree}
						xLabel={xLabel}
						yLabel={yLabel}
					/>
				)}
			</div>
			<div style={{ height: '20px' }} />
			<table>
				<tbody>
					<tr>
						<td colSpan={6} className="table-subtitle">
							Analysis of Variance
						</td>
					</tr>
					<tr>
						<td className="table-header small">Source</td>
						<td className="table-header xsmall right">DF</td>
						<td className="table-header small right">Sum Of Squares</td>
						<td className="table-header small right">Mean Square</td>
						<td className="table-header small right">F Ratio</td>
						<td className="table-header small right">F p Value</td>
					</tr>
					<tr>
						<td className="header-background small">Model</td>
						<td className="xsmall right">{df_model}</td>
						<td className="small right">{mse_model.toFixed(2) / 1}</td>
						<td className="small right">{mse_model.toFixed(2) / 1}</td>
						<td className="small right">{(mse_model / mse_error).toFixed(2) / 1}</td>
						<td className="small right">{evaluatePValue(f_pvalue)}</td>
					</tr>
					<tr>
						<td className="header-background small">Error</td>
						<td className="xsmall right">{df_resid}</td>
						<td className="small right">{ssr.toFixed(2) / 1}</td>
						<td className="small right">{mse_error.toFixed(2) / 1}</td>
						<td className="small right" />
						<td className="small right" />
					</tr>
					<tr>
						<td className="header-background small">C. Total</td>
						<td className="xsmall right">{df_total}</td>
						<td className="small right">{(mse_model + ssr).toFixed(2) / 1}</td>
						<td className="small right" />
						<td className="small right" />
						<td className="small right" />
					</tr>
				</tbody>
			</table>
			<div style={{ height: '10px' }} />
			{paramEstimateTable(coeffs, xLabel, centered, xMean, standard_errors, tvalues, pvalues)}
		</details>
	);
}

function SaveDropdown({
	coordinates,
	title,
	polyDegree: { stats: { predicted, residuals }, ci },
	xLabel,
	yLabel,
	alpha,
	id,
}) {
	const dispatchRowsAction = useRowsDispatch();
	const predictedValues = coordinates.map((coord, i) => {
		return { value: predicted[i], rowID: coord[2] };
	});
	const residualValues = coordinates.map((coord, i) => {
		return { value: residuals[i], rowID: coord[2] };
	});
	const lowerCIMeanValues = coordinates.map((coord, i) => {
		return { value: ci[alpha[id]].mean_ci_lower[i], rowID: coord[2] };
	});
	const upperCIMeanValues = coordinates.map((coord, i) => {
		return { value: ci[alpha[id]].mean_ci_upper[i], rowID: coord[2] };
	});
	const lowerCIObsValues = coordinates.map((coord, i) => {
		return { value: ci[alpha[id]].obs_ci_lower[i], rowID: coord[2] };
	});
	const upperCIObsValues = coordinates.map((coord, i) => {
		return { value: ci[alpha[id]].obs_ci_upper[i], rowID: coord[2] };
	});
	const menu = () => (
		<Menu>
			<Menu.ItemGroup title={title}>
				<Menu.Item
					onClick={() =>
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: predictedValues,
							xLabel,
							yLabel,
						})}
				>
					Save Predicteds
				</Menu.Item>
				<Menu.Item
					onClick={() =>
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: residualValues,
							xLabel,
							yLabel,
						})}
				>
					Save Residuals
				</Menu.Item>
				<Menu.Item
					onClick={() => {
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: lowerCIMeanValues,
							xLabel,
							yLabel,
						});
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: upperCIMeanValues,
							xLabel,
							yLabel,
						});
					}}
				>
					{/* eg: conf95, regex to remove letters */}
					Save {alpha[id].replace(/\D/g, '')}% Confidence Intervals (fit)
				</Menu.Item>
				<Menu.Item
					onClick={() => {
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: lowerCIObsValues,
							xLabel,
							yLabel,
						});
						dispatchRowsAction({
							type: SAVE_VALUES_TO_COLUMN,
							values: upperCIObsValues,
							xLabel,
							yLabel,
						});
					}}
				>
					Save {alpha[id].replace(/\D/g, '')}% Confidence Intervals (obs)
				</Menu.Item>
			</Menu.ItemGroup>
		</Menu>
	);
	return (
		<Dropdown.Button getPopupContainer={(triggerNode) => triggerNode.parentNode} overlay={menu()}>
			Save Values to Table
		</Dropdown.Button>
	);
}
