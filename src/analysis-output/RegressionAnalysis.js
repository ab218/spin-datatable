import React, { useState, useEffect } from 'react';
import Popup from './PopupWindow';
import { Checkbox, Select, Icon } from 'antd';
import GenerateRegressionTemplate from './RegressionTemplate';
import RegressionD3Chart from './RegressionD3Chart';
import './analysis-window.css';
const { Option } = Select;

function SetAlphaLevel({ alpha, setAlpha, id }) {
	function translateConf(conf) {
		switch (conf) {
			case 'conf90':
				return 0.1;
			case 'conf95':
				return 0.05;
			case 'conf99':
				return 0.01;
			default:
				return 0.05;
		}
	}
	return (
		<Select
			getPopupContainer={(triggerNode) => triggerNode.parentNode}
			value={translateConf(alpha[id])}
			style={{ width: 80 }}
			onChange={(val) => {
				return setAlpha((prev) => {
					return { ...prev, [id]: val };
				});
			}}
		>
			<Option value="conf90">0.1</Option>
			<Option value="conf95">0.05</Option>
			<Option value="conf99">0.01</Option>
		</Select>
	);
}

function ChartOptionsSelect({ handleChartOptions }) {
	return (
		<Select
			getPopupContainer={(triggerNode) => triggerNode.parentNode}
			mode="multiple"
			style={{ width: '100%' }}
			size={'small'}
			placeholder="Please select"
			defaultValue={[ 'Show Histogram Borders' ]}
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

function ChartTitle({ title }) {
	return <div className="analysis-title">{title}</div>;
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
			<div>
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
				<div style={{ height: '30px' }} />
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

export const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue.toFixed(4) / 1);

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
	const [ CI, setCI ] = useState({
		linearRegressionLine: { fit: false, obs: false },
		degree2Poly: { fit: false, obs: false },
		degree3Poly: { fit: false, obs: false },
		degree4Poly: { fit: false, obs: false },
		degree5Poly: { fit: false, obs: false },
		degree6Poly: { fit: false, obs: false },
	});
	const [ chartOptions, setChartOptions ] = useState({
		histogramBorders: true,
		linearRegressionLine: false,
		degree2Poly: false,
		degree3Poly: false,
		degree4Poly: false,
		degree5Poly: false,
		degree6Poly: false,
	});
	const [ equationTemplates, setEquationTemplates ] = useState({});
	const [ alpha, setAlpha ] = useState({
		linearRegressionLine: 'conf95',
		degree2Poly: 'conf95',
		degree3Poly: 'conf95',
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
	useEffect(
		() => {
			setEquationTemplates({
				linearEquationTemplate: `${colY.label} = ${linearRegressionCoefficients[0].toFixed(6) / 1} ${addOrSubtract(
					linearRegressionCoefficients[1].toFixed(6) / 1,
				)} ${Math.abs(linearRegressionCoefficients[1].toFixed(6) / 1)} * ${colX.label}`,
				quadraticEquationTemplate: generateEquationTemplate(degree2PolyCoefficients, colX.label, colY.label),
				cubicEquationTemplate: generateEquationTemplate(degree3PolyCoefficients, colX.label, colY.label),
				quarticEquationTemplate: generateEquationTemplate(degree4PolyCoefficients, colX.label, colY.label),
				degree5EquationTemplate: generateEquationTemplate(degree5PolyCoefficients, colX.label, colY.label),
				degree6EquationTemplate: generateEquationTemplate(degree6PolyCoefficients, colX.label, colY.label),
				centeredQuadraticEquationTemplate: generateEquationTemplate(centered2PolyCoefficients, colX.label, colY.label),
				centeredCubicEquationTemplate: generateEquationTemplate(centered3PolyCoefficients, colX.label, colY.label),
				centeredQuarticEquationTemplate: generateEquationTemplate(centered4PolyCoefficients, colX.label, colY.label),
				centeredDegree5EquationTemplate: generateEquationTemplate(centered5PolyCoefficients, colX.label, colY.label),
				centeredDegree6EquationTemplate: generateEquationTemplate(centered6PolyCoefficients, colX.label, colY.label),
			});
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const {
		linearEquationTemplate,
		centeredCubicEquationTemplate,
		centeredQuadraticEquationTemplate,
		centeredQuarticEquationTemplate,
		centeredDegree5EquationTemplate,
		centeredDegree6EquationTemplate,
		quadraticEquationTemplate,
		cubicEquationTemplate,
		quarticEquationTemplate,
		degree5EquationTemplate,
		degree6EquationTemplate,
	} = equationTemplates;

	const {
		centeredPoly,
		linearRegressionLine,
		degree2Poly,
		degree3Poly,
		degree4Poly,
		degree5Poly,
		degree6Poly,
	} = chartOptions;

	const title = `Bivariate Fit of ${colY.label} ${colY.units
		? '(' + colY.units + ')'
		: ''} By ${colX.label} ${colX.units ? '(' + colX.units + ')' : ''}`;

	return (
		<Popup key={data.id} id={data.id} title={title} setPopup={setPopup} windowWidth={1000}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<ChartTitle title={title} />
				<div style={{ display: 'flex' }}>
					<div style={{ textAlign: 'left' }}>
						<ChartOptionsSelect handleChartOptions={handleChartOptions} />
						<RegressionD3Chart CI={CI} data={data} chartOptions={chartOptions} alpha={alpha} />
						{(linearRegressionLine || degree2Poly || degree3Poly || degree4Poly || degree5Poly || degree6Poly) && (
							<ChartOptionsLegend chartOptions={chartOptions} setCI={setCI} CI={CI} setAlpha={setAlpha} alpha={alpha} />
						)}
					</div>
					<div style={{ overflowY: 'scroll', height: '800px' }}>
						<SummaryStatsTable data={data} />
						{linearRegressionLine && (
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
								alpha={alpha}
							/>
						)}
						{degree2Poly && (
							<GenerateRegressionTemplate
								key={'degree2PolyLine'}
								title={'Quadratic Fit'}
								id={'degree2PolyLine'}
								className={null}
								equation={centeredPoly ? centeredQuadraticEquationTemplate : quadraticEquationTemplate}
								polyDegree={centeredPoly ? cent_reg2 : reg2}
								coeffs={centeredPoly ? centered2PolyCoefficients : degree2PolyCoefficients}
								xMean={data.colXMean}
								xLabel={colX.label}
								yLabel={colY.label}
								centered={centeredPoly}
								setCI={setCI}
								alpha={alpha}
							/>
						)}
						{degree3Poly && (
							<GenerateRegressionTemplate
								key={'degree3PolyLine'}
								title={'Cubic Fit'}
								id={'degree3PolyLine'}
								className={null}
								equation={centeredPoly ? centeredCubicEquationTemplate : cubicEquationTemplate}
								polyDegree={centeredPoly ? cent_reg3 : reg3}
								coeffs={centeredPoly ? centered3PolyCoefficients : degree3PolyCoefficients}
								xMean={data.colXMean}
								xLabel={colX.label}
								yLabel={colY.label}
								centered={centeredPoly}
								setCI={setCI}
								alpha={alpha}
							/>
						)}
						{degree4Poly && (
							<GenerateRegressionTemplate
								key={'degree4PolyLine'}
								title={'Quartic Fit'}
								id={'degree4PolyLine'}
								className={null}
								equation={centeredPoly ? centeredQuarticEquationTemplate : quarticEquationTemplate}
								polyDegree={cent_reg4}
								coeffs={centeredPoly ? centered4PolyCoefficients : degree4PolyCoefficients}
								xMean={data.colXMean}
								xLabel={colX.label}
								yLabel={colY.label}
								centered={centeredPoly}
							/>
						)}
						{degree5Poly && (
							<GenerateRegressionTemplate
								key={'degree5PolyLine'}
								title={'5th Degree Fit'}
								id={'degree5PolyLine'}
								className={null}
								equation={centeredPoly ? centeredDegree5EquationTemplate : degree5EquationTemplate}
								polyDegree={centeredPoly ? cent_reg5 : reg5}
								coeffs={centeredPoly ? centered5PolyCoefficients : degree5PolyCoefficients}
								xMean={data.colXMean}
								xLabel={colX.label}
								yLabel={colY.label}
								centered={centeredPoly}
							/>
						)}
						{degree6Poly && (
							<GenerateRegressionTemplate
								key={'degree6PolyLine'}
								title={'6th Degree Fit'}
								id={'degree6PolyLine'}
								className={null}
								equation={centeredPoly ? centeredDegree6EquationTemplate : degree6EquationTemplate}
								polyDegree={centeredPoly ? cent_reg6 : reg6}
								coeffs={centeredPoly ? centered6PolyCoefficients : degree6PolyCoefficients}
								xMean={data.colXMean}
								xLabel={colX.label}
								yLabel={colY.label}
								centered={centeredPoly}
							/>
						)}
					</div>
				</div>
			</div>
		</Popup>
	);
}

// const menu = (title, id, conf, setCI, CI) => (
// 	<Menu multiple>
// 		{conf && (
// 			<Menu.ItemGroup title={title}>
// 				<Menu.Item
// 					onClick={() =>
// 						setCI((prev) => {
// 							return { ...prev, [id]: { ...prev[id], fit: !prev[id].fit } };
// 						})}
// 				>
// 					<div style={{ display: 'flex' }}>
// 						<span style={{ width: '20px', fontWeight: 'bold' }}>{CI[id].fit ? '✓' : ' '}</span>
// 						<span>Show Confidence Curves (fit)</span>
// 					</div>
// 				</Menu.Item>
// 				<Menu.Item
// 					onClick={() =>
// 						setCI((prev) => {
// 							return { ...prev, [id]: { ...prev[id], obs: !prev[id].obs } };
// 						})}
// 				>
// 					<div style={{ display: 'flex' }}>
// 						<span style={{ width: '20px', fontWeight: 'bold' }}>{CI[id].obs ? '✓' : ' '}</span>
// 						<span>Show Confidence Curves (obs)</span>
// 					</div>
// 				</Menu.Item>
// 			</Menu.ItemGroup>
// 		)}
// 	</Menu>
// );

function ChartOptionsLegend({ chartOptions, setCI, CI, alpha, setAlpha }) {
	function ChartOption({ title, color, id, showCIOptions }) {
		return (
			<tr>
				<td>
					<Icon type="minus" style={{ cursor: 'pointer', fontSize: '20px', color }} />
					{title}
				</td>
				{showCIOptions && (
					<React.Fragment>
						<td>
							<Checkbox
								onChange={(e) =>
									setCI((prev) => {
										return { ...prev, [id]: { ...prev[id], fit: e.target.checked } };
									})}
								checked={CI[id]['fit']}
							/>
						</td>
						<td>
							<Checkbox
								onChange={(e) =>
									setCI((prev) => {
										return { ...prev, [id]: { ...prev[id], obs: e.target.checked } };
									})}
								checked={CI[id]['obs']}
							/>
						</td>
						<td>
							<SetAlphaLevel id={id} alpha={alpha} setAlpha={setAlpha} />
						</td>
					</React.Fragment>
				)}
			</tr>
		);
	}
	return (
		<div style={{ paddingLeft: '30px' }}>
			<table style={{ width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ width: '150px' }} />
						<td colSpan={2} style={{ width: '100px', textDecoration: 'underline' }}>
							Confid Regions
						</td>
						<td style={{ width: '100px' }} />
					</tr>
					<tr>
						<td>Line of Fit</td>
						<td>Fit</td>
						<td>Indiv</td>
						<td>Alpha</td>
					</tr>
					{chartOptions.linearRegressionLine && (
						<ChartOption showCIOptions={true} conf id="linearRegressionLine" title={'Linear'} color={'steelblue'} />
					)}
					{chartOptions.degree2Poly && (
						<ChartOption showCIOptions={true} conf id="degree2Poly" title={'Quadratic'} color={'green'} />
					)}
					{chartOptions.degree3Poly && (
						<ChartOption showCIOptions={true} conf id="degree3Poly" title={'Cubic'} color={'darkmagenta'} />
					)}
					{chartOptions.degree4Poly && (
						<ChartOption showCIOptions={false} id="degree4Poly" title={'Quartic'} color={'saddlebrown'} />
					)}
					{chartOptions.degree5Poly && (
						<ChartOption showCIOptions={false} id="degree5Poly" title={'5th Degree'} color={'goldenrod'} />
					)}
					{chartOptions.degree6Poly && (
						<ChartOption showCIOptions={false} id="degree6Poly" title={'6th Degree'} color={'thistle'} />
					)}
				</tbody>
			</table>
		</div>
	);
}
