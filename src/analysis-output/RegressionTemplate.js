import React from 'react';
import './analysis-window.css';

const paramEstimates = (coeffs, xLabel, centered, xMean) => {
	let temp = [];
	let counter = 2;
	for (let i = 2; i < coeffs.length; i++) {
		temp.push(
			<tr key={i}>
				<td className="header-background">
					{centered ? `(${xLabel} - ${xMean})` : xLabel}^{counter}
				</td>
				<td className="small right">{coeffs[i].toFixed(4) / 1}</td>
			</tr>,
		);
		counter++;
	}
	return temp;
};

const paramEstimateTable = (coeffs, xLabel, centered, xMean) => (
	<table>
		<tbody>
			<tr>
				<td colSpan={2} className="table-subtitle">
					Parameter Estimates
				</td>
			</tr>
			<tr>
				<td className="table-header large">Term</td>
				<td className="table-header small right">Estimate</td>
			</tr>
			<tr>
				<td className="header-background large">Intercept</td>
				<td className="small right">{coeffs[0].toFixed(4) / 1}</td>
			</tr>
			<tr>
				<td className="header-background">{xLabel}</td>
				<td className="small right">{coeffs[1].toFixed(4) / 1}</td>
			</tr>
			{paramEstimates(coeffs, xLabel, centered, xMean)}
		</tbody>
	</table>
);

export default function GenerateRegressionTemplate({
	title,
	id,
	className,
	equation,
	polyDegree,
	coeffs,
	xLabel,
	xMean,
	centered,
}) {
	const { rsquared, rsquared_adj, mse_error, df_model, mse_model, ssr, df_total, df_resid } = polyDegree.stats;
	return (
		<details className={`analysis-details ${className}`} open id={id}>
			<summary className="analysis-summary-title">
				{title} {centered && '(centered)'}
			</summary>
			<div className="left xxlarge">{equation}</div>
			<div style={{ height: '10px' }} />
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
			<div style={{ height: '20px' }} />
			<table>
				<tbody>
					<tr>
						<td colSpan={5} className="table-subtitle">
							Analysis of Variance
						</td>
					</tr>
					<tr>
						<td className="table-header small">Source</td>
						<td className="table-header xsmall right">DF</td>
						<td className="table-header medium right">Sum Of Squares</td>
						<td className="table-header medium right">Mean Square</td>
						<td className="table-header small right">F Ratio</td>
					</tr>
					<tr>
						<td className="header-background small">Model</td>
						<td className="xsmall right">{df_model}</td>
						<td className="medium right">{mse_model.toFixed(4) / 1}</td>
						<td className="medium right">{mse_model.toFixed(4) / 1}</td>
						<td className="small right">{(mse_model / mse_error).toFixed(4) / 1}</td>
					</tr>
					<tr>
						<td className="header-background small">Error</td>
						<td className="xsmall right">{df_resid}</td>
						<td className="medium right">{ssr.toFixed(4) / 1}</td>
						<td className="medium right">{mse_error.toFixed(4) / 1}</td>
						<td className="small right" />
					</tr>
					<tr>
						<td className="header-background small">C. Total</td>
						<td className="xsmall right">{df_total}</td>
						<td className="medium right">{(mse_model + ssr).toFixed(4) / 1}</td>
						<td className="medium right" />
						<td className="small right" />
					</tr>
				</tbody>
			</table>
			<div style={{ height: '10px' }} />
			{paramEstimateTable(coeffs, xLabel, centered, xMean)}
		</details>
	);
}
