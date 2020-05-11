import React, { useState } from 'react';
import Popup from './PopupWindow';
import { Select } from 'antd';
import GenerateRegressionTemplate from './RegressionTemplate';
import RegressionD3Chart from './RegressionD3Chart';
import './analysis-window.css';
const { Option } = Select;

function ChartOptionsSelect({ handleChartOptions }) {
	return (
		<Select
			getPopupContainer={(triggerNode) => triggerNode.parentNode}
			mode="multiple"
			style={{ width: '100%' }}
			placeholder="Please select"
			defaultValue={[ 'Show Histogram Borders', 'Linear Fit' ]}
			onChange={handleChartOptions}
			maxTagCount={0}
			maxTagPlaceholder={(e) => {
				return 'Select Chart Options';
			}}
		>
			<Option key={'Show Histogram Borders'}>Show Histogram Borders</Option>
			<Option key={'Center Polynomials'}>Center Polynomials</Option>
			<Option key={'Linear Fit'}>Linear Fit</Option>
			<Option key={'Quadratic Fit'}>Quadratic Fit</Option>
			<Option key={'Cubic Fit'}>Cubic Fit</Option>
			<Option key={'Quartic Fit'}>Quartic Fit</Option>
			<Option key={'5th Degree Fit'}>5th Degree Fit</Option>
			<Option key={'6th Degree Fit'}>6th Degree Fit</Option>
		</Select>
	);
}

function ChartTitle({ colY, colX }) {
	return (
		<div className="analysis-title">{`Bivariate Fit of ${colY.label} ${colY.units
			? '(' + colY.units + ')'
			: ''} By ${colX.label} ${colX.units ? '(' + colX.units + ')' : ''}`}</div>
	);
}

function SummaryStatsTable({ data }) {
	const {
		corrcoef,
		reg1: { stats: { pvalues } },
		cov,
		coordinates,
		colX,
		colXMean,
		std_x,
		colY,
		colYMean,
		std_y,
	} = data;
	return (
		<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
			<summary className="analysis-summary-title">Summary Statistics</summary>
			<div style={{ display: 'flex' }}>
				<table style={{ width: '300px', marginRight: '20px' }}>
					<tbody>
						<tr>
							<td className="table-header large">Statistic</td>
							<td className="table-header right small">Value</td>
						</tr>
						<tr>
							<td className="header-background large">Pearson's Correlation</td>
							<td className="right small">{corrcoef[0][1].toFixed(4) / 1}</td>
						</tr>
						<tr>
							<td className="header-background large">p</td>
							<td className="right small">{evaluatePValue(pvalues[0])}</td>
						</tr>
						<tr>
							<td className="header-background large">Covariance</td>
							<td className="right small">{cov[0][1].toFixed(4) / 1}</td>
						</tr>
						<tr>
							<td className="header-background large">Count</td>
							<td className="right small">{coordinates.length}</td>
						</tr>
					</tbody>
				</table>
				<table style={{ width: '400px' }}>
					<tbody>
						<tr>
							<td className="table-header large">Variable</td>
							<td className="table-header small right">Mean</td>
							<td className="table-header small right">Std Dev</td>
						</tr>
						<tr>
							<td className="header-background left large">{colX.label}</td>
							<td className="right small">{colXMean.toFixed(4) / 1}</td>
							<td className="right small">{std_x.toFixed(4) / 1}</td>
						</tr>
						<tr>
							<td className="header-background left large">{colY.label}</td>
							<td className="right small">{colYMean.toFixed(4) / 1}</td>
							<td className="right small">{std_y.toFixed(4) / 1}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</details>
	);
}

const addOrSubtract = (value) => (value >= 0 ? '+' : '-');

const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue.toFixed(4) / 1);

const generateEquationTemplate = (coeffs, xLabel, yLabel, centered) => {
	let temp = `${yLabel} = ${coeffs[0].toFixed(4) / 1} ${addOrSubtract(coeffs[1])} ${Math.abs(coeffs[1]).toFixed(4) /
		1} * ${centered ? centered : xLabel}`;
	let counter = 2;
	for (let i = counter; i < coeffs.length; i++) {
		temp += ` ${addOrSubtract(coeffs[i])} ${Math.abs(coeffs[i]).toFixed(4) / 1} * ${centered
			? centered
			: xLabel}^${counter}`;
		counter++;
	}
	return temp;
};

export default function RegressionAnalysis({ data, setPopup }) {
	const {
		colY,
		colX,
		reg1,
		reg2,
		reg3,
		reg4,
		reg5,
		reg6,
		cent_reg2,
		cent_reg3,
		cent_reg4,
		cent_reg5,
		cent_reg6,
	} = data;
	const [ CI, setCI ] = useState({});
	const [ chartOptions, setChartOptions ] = useState({
		histogramBorders: true,
		linearRegressionLine: true,
		degree2Poly: false,
		degree3Poly: false,
		degree4Poly: false,
		degree5Poly: false,
		degree6Poly: false,
	});

	function handleChartOptions(value) {
		const centeredPoly = value.includes('Center Polynomials');
		const histogramBorders = value.includes('Show Histogram Borders');
		const linearRegressionLine = value.includes('Linear Fit');
		const degree2Poly = value.includes('Quadratic Fit');
		const degree3Poly = value.includes('Cubic Fit');
		const degree4Poly = value.includes('Quartic Fit');
		const degree5Poly = value.includes('5th Degree Fit');
		const degree6Poly = value.includes('6th Degree Fit');
		const options = {
			centeredPoly,
			histogramBorders,
			linearRegressionLine,
			degree2Poly,
			degree3Poly,
			degree4Poly,
			degree5Poly,
			degree6Poly,
		};
		setChartOptions(options);
	}

	const linearRegressionCoefficients = reg1.stats['polynomial'];
	const degree2PolyCoefficients = reg2.stats['polynomial'];
	const degree3PolyCoefficients = reg3.stats['polynomial'];
	const degree4PolyCoefficients = reg4.stats['polynomial'];
	const degree5PolyCoefficients = reg5.stats['polynomial'];
	const degree6PolyCoefficients = reg6.stats['polynomial'];
	const centered2PolyCoefficients = cent_reg2.stats['polynomial'];
	const centered3PolyCoefficients = cent_reg3.stats['polynomial'];
	const centered4PolyCoefficients = cent_reg4.stats['polynomial'];
	const centered5PolyCoefficients = cent_reg5.stats['polynomial'];
	const centered6PolyCoefficients = cent_reg6.stats['polynomial'];
	const linearEquationTemplate = `${colY.label} = ${linearRegressionCoefficients[0].toFixed(6) / 1} ${addOrSubtract(
		linearRegressionCoefficients[1].toFixed(6) / 1,
	)} ${Math.abs(linearRegressionCoefficients[1].toFixed(6) / 1)} * ${colX.label}`;
	const quadraticEquationTemplate = generateEquationTemplate(degree2PolyCoefficients, colX.label, colY.label);
	const cubicEquationTemplate = generateEquationTemplate(degree3PolyCoefficients, colX.label, colY.label);
	const quarticEquationTemplate = generateEquationTemplate(degree4PolyCoefficients, colX.label, colY.label);
	const degree5EquationTemplate = generateEquationTemplate(degree5PolyCoefficients, colX.label, colY.label);
	const degree6EquationTemplate = generateEquationTemplate(degree6PolyCoefficients, colX.label, colY.label);
	const centeredQuadraticEquationTemplate = generateEquationTemplate(centered2PolyCoefficients, colX.label, colY.label);
	const centeredCubicEquationTemplate = generateEquationTemplate(centered3PolyCoefficients, colX.label, colY.label);
	const centeredQuarticEquationTemplate = generateEquationTemplate(centered4PolyCoefficients, colX.label, colY.label);
	const centeredDegree5EquationTemplate = generateEquationTemplate(centered5PolyCoefficients, colX.label, colY.label);
	const centeredDegree6EquationTemplate = generateEquationTemplate(centered6PolyCoefficients, colX.label, colY.label);

	return (
		<Popup key={data.id} id={data.id} title={`Popup ${data.id}`} setPopup={setPopup}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<ChartTitle colY={colY} colX={colX} />
				<RegressionD3Chart CI={CI} data={data} chartOptions={chartOptions} />
				<ChartOptionsSelect handleChartOptions={handleChartOptions} />
				<SummaryStatsTable data={data} />
				{chartOptions.linearRegressionLine && (
					<GenerateRegressionTemplate
						key={'linearRegressionLine'}
						title={'Linear Fit'}
						id={'linearRegressionLine'}
						className={null}
						equation={linearEquationTemplate}
						polyDegree={reg1}
						coeffs={linearRegressionCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={null}
						setCI={setCI}
					/>
				)}
				{chartOptions.degree2Poly && (
					<GenerateRegressionTemplate
						key={'degree2PolyLine'}
						title={'Quadratic Fit'}
						id={'degree2PolyLine'}
						className={null}
						equation={chartOptions.centeredPoly ? centeredQuadraticEquationTemplate : quadraticEquationTemplate}
						polyDegree={chartOptions.centeredPoly ? cent_reg2 : reg2}
						coeffs={chartOptions.centeredPoly ? centered2PolyCoefficients : degree2PolyCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={chartOptions.centeredPoly}
						setCI={setCI}
					/>
				)}
				{chartOptions.degree3Poly && (
					<GenerateRegressionTemplate
						key={'degree3PolyLine'}
						title={'Cubic Fit'}
						id={'degree3PolyLine'}
						className={null}
						equation={chartOptions.centeredPoly ? centeredCubicEquationTemplate : cubicEquationTemplate}
						polyDegree={chartOptions.centeredPoly ? cent_reg3 : reg3}
						coeffs={chartOptions.centeredPoly ? centered3PolyCoefficients : degree3PolyCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={chartOptions.centeredPoly}
						setCI={setCI}
					/>
				)}
				{chartOptions.degree4Poly && (
					<GenerateRegressionTemplate
						key={'degree4PolyLine'}
						title={'Quartic Fit'}
						id={'degree4PolyLine'}
						className={null}
						equation={chartOptions.centeredPoly ? centeredQuarticEquationTemplate : quarticEquationTemplate}
						polyDegree={cent_reg4}
						coeffs={chartOptions.centeredPoly ? centered4PolyCoefficients : degree4PolyCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={chartOptions.centeredPoly}
					/>
				)}
				{chartOptions.degree5Poly && (
					<GenerateRegressionTemplate
						key={'degree5PolyLine'}
						title={'5th Degree Fit'}
						id={'degree5PolyLine'}
						className={null}
						equation={chartOptions.centeredPoly ? centeredDegree5EquationTemplate : degree5EquationTemplate}
						polyDegree={chartOptions.centeredPoly ? cent_reg5 : reg5}
						coeffs={chartOptions.centeredPoly ? centered5PolyCoefficients : degree5PolyCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={chartOptions.centeredPoly}
					/>
				)}
				{chartOptions.degree6Poly && (
					<GenerateRegressionTemplate
						key={'degree6PolyLine'}
						title={'6th Degree Fit'}
						id={'degree6PolyLine'}
						className={null}
						equation={chartOptions.centeredPoly ? centeredDegree6EquationTemplate : degree6EquationTemplate}
						polyDegree={chartOptions.centeredPoly ? cent_reg6 : reg6}
						coeffs={chartOptions.centeredPoly ? centered6PolyCoefficients : degree6PolyCoefficients}
						xMean={data.colXMean}
						xLabel={colX.label}
						yLabel={colY.label}
						centered={chartOptions.centeredPoly}
					/>
				)}
			</div>
		</Popup>
	);
}
