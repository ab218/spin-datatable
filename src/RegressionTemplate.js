import React, { useEffect, useState } from 'react';
import { Menu, Select } from 'antd';
import './analysis-window.css';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
const { Option } = Select;

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
	yLabel,
	xMean,
	centered,
	setCI,
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
		residuals,
		predicted,
	} = polyDegree.stats;
	// can't destructure because sometimes CI is undefined. Only linear/quadratic/cubic supported currently.
	const conf90 = polyDegree.ci ? polyDegree.ci.conf90 : null;
	const conf95 = polyDegree.ci ? polyDegree.ci.conf95 : null;
	const conf99 = polyDegree.ci ? polyDegree.ci.conf99 : null;
	const [ alpha, setAlpha ] = useState(conf95);

	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	useEffect(
		() => {
			if (polyDegree.ci) {
				setAlpha(conf95);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);
	return (
		<details className={`analysis-details ${className}`} open id={id}>
			<summary className="analysis-summary-title">
				{title} {centered && '(centered)'}
			</summary>
			<div className="left xxlarge">{equation}</div>
			{alpha && (
				<div style={{ display: 'flex' }}>
					<Select
						getPopupContainer={(triggerNode) => triggerNode.parentNode}
						mode="multiple"
						style={{ width: '100%' }}
						placeholder="Please select"
						maxTagCount={0}
						maxTagPlaceholder={(e) => {
							return 'Select Chart Options';
						}}
						onChange={(selected) => {
							return setCI((prev) => {
								if (selected.includes('displayCIFit') && selected.includes('displayCIObs')) {
									return {
										...prev,
										[`${id}CIFitLower`]: alpha.mean_ci_lower,
										[`${id}CIFitUpper`]: alpha.mean_ci_upper,
										[`${id}CIObsLower`]: alpha.obs_ci_lower,
										[`${id}CIObsUpper`]: alpha.obs_ci_upper,
									};
								}
								if (selected.includes('displayCIFit')) {
									return {
										...prev,
										[`${id}CIFitLower`]: alpha.mean_ci_lower,
										[`${id}CIFitUpper`]: alpha.mean_ci_upper,
										[`${id}CIObsLower`]: [],
										[`${id}CIObsUpper`]: [],
									};
								}
								if (selected.includes('displayCIObs')) {
									return {
										...prev,
										[`${id}CIObsLower`]: alpha.obs_ci_lower,
										[`${id}CIObsUpper`]: alpha.obs_ci_upper,
										[`${id}CIFitLower`]: [],
										[`${id}CIFitUpper`]: [],
									};
								}
								return { ...prev, [`${id}CIFitLower`]: [], [`${id}CIFitUpper`]: [] };
							});
						}}
					>
						<Option key="displayCIFit">Confidence Curves (fit)</Option>
						<Option key="displayCIObs">Confidence Curves (obs)</Option>
					</Select>
					<Menu
						selectable={false}
						style={{ width: 200 }}
						getPopupContainer={(triggerNode) => triggerNode.parentNode}
						mode="horizontal"
					>
						<Menu.SubMenu title="Select α">
							<Menu.ItemGroup>
								<Menu.Item onClick={() => setAlpha(conf90)} key="90">
									0.10
								</Menu.Item>
								<Menu.Item onClick={() => setAlpha(conf95)} key="95">
									0.05
								</Menu.Item>
								<Menu.Item onClick={() => setAlpha(conf99)} key="99">
									0.01
								</Menu.Item>
							</Menu.ItemGroup>
						</Menu.SubMenu>
					</Menu>
					<Menu
						selectable={false}
						style={{ width: 200 }}
						getPopupContainer={(triggerNode) => triggerNode.parentNode}
						mode="horizontal"
					>
						<Menu.SubMenu title="Save">
							<Menu.ItemGroup>
								<Menu.Item
									onClick={() => {
										dispatchSpreadsheetAction({
											type: 'SAVE_VALUES_TO_COLUMN',
											values: alpha.mean_ci_lower,
											xLabel,
											yLabel,
										});
										dispatchSpreadsheetAction({
											type: 'SAVE_VALUES_TO_COLUMN',
											values: alpha.mean_ci_upper,
											xLabel,
											yLabel,
										});
									}}
									key="saveCIFit"
								>
									Confidence Curves (fit)
								</Menu.Item>
								<Menu.Item
									onClick={() => {
										dispatchSpreadsheetAction({
											type: 'SAVE_VALUES_TO_COLUMN',
											values: alpha.obs_ci_lower,
											xLabel,
											yLabel,
										});
										dispatchSpreadsheetAction({
											type: 'SAVE_VALUES_TO_COLUMN',
											values: alpha.obs_ci_upper,
											xLabel,
											yLabel,
										});
									}}
									key="saveCIObs"
								>
									Confidence Curves (obs)
								</Menu.Item>
								<Menu.Item
									onClick={() =>
										dispatchSpreadsheetAction({ type: 'SAVE_VALUES_TO_COLUMN', values: residuals, xLabel, yLabel })}
									key="saveResiduals"
								>
									Residuals
								</Menu.Item>
								<Menu.Item
									onClick={() =>
										dispatchSpreadsheetAction({ type: 'SAVE_VALUES_TO_COLUMN', values: predicted, xLabel, yLabel })}
									key="savePredicteds"
								>
									Predicteds
								</Menu.Item>
							</Menu.ItemGroup>
						</Menu.SubMenu>
					</Menu>
				</div>
			)}
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
