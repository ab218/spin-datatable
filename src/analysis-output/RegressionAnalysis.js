import React, { useState, useEffect } from 'react';
import Popup from './PopupWindow';
import { Select, Menu, Dropdown, Icon } from 'antd';
import GenerateRegressionTemplate from './RegressionTemplate';
import RegressionD3Chart from './RegressionD3Chart';
import './analysis-window.css';
const { Option } = Select;
// const { SubMenu } = Menu;

function SetAlphaLevel({ setAlpha }) {
	return (
		<Select
			getPopupContainer={(triggerNode) => triggerNode.parentNode}
			defaultValue="conf95"
			style={{ width: 120 }}
			onChange={(val) => {
				return setAlpha(val);
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

// function ChartOptionsSelect({ handleChartOptions }) {
// 	function FitOptions(fitName, fitTitle) {
// 		return (
// 			<SubMenu title={fitTitle} key={`${fitName}Fit`}>
// 				<Menu.Item key={`${fitName}Line`}>Display {fitTitle}</Menu.Item>
// 				<SubMenu key={`${fitName}CI`} title={`Confidence Curves`}>
// 					<Menu.Item key={`${fitName}CIFit`}>Fit</Menu.Item>
// 					<Menu.Item key={`${fitName}CIObs`}>Obs</Menu.Item>
// 				</SubMenu>
// 			</SubMenu>
// 		);
// 	}
// 	return (
// 		<Menu
// 			multiple
// 			inlineIndent={50}
// 			onClick={handleClick}
// 			style={{ position: 'absolute', width: 400, textAlign: 'left' }}
// 			mode="inline"
// 		>
// 			<SubMenu title="Linear Fit" key="linearFit">
// 				<Menu.Item key="linearLine">Display Linear Fit</Menu.Item>
// 				<SubMenu key="linearCI" title="Confidence Curves">
// 					<Menu.Item key="linearCIFit">Fit</Menu.Item>
// 					<Menu.Item key="linearCIObs">Obs</Menu.Item>
// 				</SubMenu>
// 				<SubMenu key="linearSave" title="Save Values To Table">
// 					<Menu.Item key="saveLinearPredicted">Save Predicted Values</Menu.Item>
// 					<Menu.Item key="saveLinearResiduals">Save Residual Values</Menu.Item>
// 					<Menu.Item key="saveLinearCIFit">Save CI Fit Values</Menu.Item>
// 					<Menu.Item key="saveLinearCIObs">Save CI Obs Values</Menu.Item>
// 				</SubMenu>
// 			</SubMenu>
// 		</Menu>
// 	);
// }

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
	const [ CI, setCI ] = useState({
		degree1: { fit: false, obs: false },
		degree2: { fit: false, obs: false },
		degree3: { fit: false, obs: false },
		degree4: { fit: false, obs: false },
		degree5: { fit: false, obs: false },
		degree6: { fit: false, obs: false },
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
	const [ alpha, setAlpha ] = useState('conf95');

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
	return (
		<Popup key={data.id} id={data.id} title={`Popup ${data.id}`} setPopup={setPopup}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<ChartTitle colY={colY} colX={colX} />
				<div style={{ display: 'flex' }}>
					<div style={{ textAlign: 'left' }}>
						<ChartOptionsSelect handleChartOptions={handleChartOptions} />
						<RegressionD3Chart CI={CI} data={data} chartOptions={chartOptions} alpha={alpha} />
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<ChartOptionsLegend chartOptions={chartOptions} setCI={setCI} CI={CI} />
							<div>
								<div>Set Alpha Level</div>
								<SetAlphaLevel setAlpha={setAlpha} />
							</div>
						</div>
					</div>
					<div style={{ overflowY: 'scroll', height: '800px' }}>
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
								alpha={alpha}
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
								alpha={alpha}
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
								alpha={alpha}
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
				</div>
			</div>
		</Popup>
	);
}

const menu = (title, id, conf, setCI, CI) => (
	<Menu multiple>
		{conf && (
			<Menu.ItemGroup title={title}>
				<Menu.Item
					onClick={() =>
						setCI((prev) => {
							return { ...prev, [id]: { ...prev[id], fit: !prev[id].fit } };
						})}
				>
					<div style={{ display: 'flex' }}>
						<span style={{ width: '20px', fontWeight: 'bold' }}>{CI[id].fit ? '✓' : ' '}</span>
						<span>Show Confidence Curves (fit)</span>
					</div>
				</Menu.Item>
				<Menu.Item
					onClick={() =>
						setCI((prev) => {
							return { ...prev, [id]: { ...prev[id], obs: !prev[id].obs } };
						})}
				>
					<div style={{ display: 'flex' }}>
						<span style={{ width: '20px', fontWeight: 'bold' }}>{CI[id].obs ? '✓' : ' '}</span>
						<span>Show Confidence Curves (obs)</span>
					</div>
				</Menu.Item>
			</Menu.ItemGroup>
		)}
	</Menu>
);

function ChartOptionsLegend({ chartOptions, setCI, CI }) {
	function ChartOption({ title, color, id, conf }) {
		return (
			<Dropdown
				placement={'topRight'}
				getPopupContainer={(triggerNode) => triggerNode.parentNode}
				overlay={menu(title, id, conf, setCI, CI)}
			>
				<div>
					<Icon type="minus" style={{ cursor: 'pointer', fontSize: '20px', color }} /> {title}
				</div>
			</Dropdown>
		);
	}
	return (
		<div style={{ paddingLeft: '30px' }}>
			{chartOptions.linearRegressionLine && <ChartOption conf id="degree1" title={'Linear Fit'} color={'steelblue'} />}
			{chartOptions.degree2Poly && <ChartOption conf id="degree2" title={'Quadratic Fit'} color={'green'} />}
			{chartOptions.degree3Poly && <ChartOption conf id="degree3" title={'Cubic Fit'} color={'darkmagenta'} />}
			{chartOptions.degree4Poly && <ChartOption id="degree4" title={'Quartic Fit'} color={'saddlebrown'} />}
			{chartOptions.degree5Poly && <ChartOption id="degree5" title={'5th Degree Fit'} color={'goldenrod'} />}
			{chartOptions.degree6Poly && <ChartOption id="degree6" title={'6th Degree Fit'} color={'thistle'} />}
		</div>
	);
}
