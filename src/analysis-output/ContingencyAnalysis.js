import React from 'react';
import Popup from './PopupWindow';
import ContingencyD3Chart from './ContingencyD3Chart';
import './MosaicPlot.js';

export default function ContingencyAnalysis({ data, setPopup }) {
	const { contingency, colX, colY, chi2, p, dof, log_chi2, log_p, coordinates } = data;
	const parsedContingency = JSON.parse(contingency);
	const contingencyKeys = Object.keys(parsedContingency);
	const groupKeys = Object.keys(parsedContingency[contingencyKeys[0]]);
	const columnValues = groupKeys.map((key) => {
		return contingencyKeys
			.map((row, i) => {
				return parsedContingency[row][key];
			})
			.reduce((acc, curr) => {
				return acc + curr;
			});
	});
	const totals = groupKeys.map((key, i) => {
		return { [key]: columnValues[i] };
	});
	const mosaicData = contingencyKeys.flatMap((key) => {
		return groupKeys.map((group) => {
			return { x: key, y: group, value: parsedContingency[key][group] };
		});
	});
	const title = `Contingency Analysis of ${colY.label} ${colY.units ? '(' + colY.units + ')' : ''} By ${colX.label}
  ${colX.units ? '(' + colX.units + ')' : ''}`;
	return (
		<Popup key={data.id} id={data.id} title={title} windowWidth={1000} setPopup={setPopup}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<TitleText title={title} />
				<div style={{ display: 'flex' }}>
					<ContingencyD3Chart
						groups={contingencyKeys}
						data={mosaicData}
						totals={totals}
						colX={colX}
						colY={colY}
						coordinates={coordinates}
					/>
					<div style={{ overflowY: 'scroll', height: '800px' }}>
						<Tests
							contingency={parsedContingency}
							n={coordinates.length}
							colX={colX}
							colY={colY}
							chi2={chi2}
							p={p}
							dof={dof}
							log_chi2={log_chi2}
							log_p={log_p}
						/>
					</div>
				</div>
			</div>
		</Popup>
	);
}

// TODO: DRY
const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue.toFixed(4) / 1);

const TitleText = ({ title }) => <h1>{title}</h1>;

const ContingencyTable = ({ contingency }) => {
	// TODO: If text is too long, use elipsis
	const contingencyKeys = Object.keys(contingency);
	const keysOfFirstRow = Object.keys(contingency[contingencyKeys[0]]);
	const columnValues = keysOfFirstRow.map((key) => {
		return contingencyKeys
			.map((row, i) => {
				return contingency[row][key];
			})
			.reduce((acc, curr) => {
				return acc + curr;
			});
	});
	return (
		<table className="centered-text" style={{ width: '100%', marginBottom: '30px' }}>
			<thead>
				<tr>
					<td className="bordered" />
					{keysOfFirstRow.map((category, i) => (
						<td
							key={category + i}
							style={{
								width: '70px',
								maxWidth: '70px',
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								backgroundColor: 'rgb(238, 238, 238)',
							}}
							className="bordered"
						>
							{category}
						</td>
					))}
					<td style={{ backgroundColor: 'rgb(238, 238, 238)' }} className="bordered">
						Total
					</td>
				</tr>
			</thead>
			<tbody>
				{contingencyKeys.map((key, i) => {
					const rowOfValues = Object.values(contingency[key]);
					return (
						<tr key={key + i}>
							<td
								className="bordered left"
								style={{
									width: '70px',
									maxWidth: '70px',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									paddingLeft: '5px',
									backgroundColor: 'rgb(238, 238, 238)',
								}}
							>
								{key}
							</td>
							{rowOfValues.map((val) => (
								<td key={val} className="bordered">
									{val}
								</td>
							))}
							<td className="bordered">{rowOfValues.reduce((acc, curr) => curr + acc, 0)}</td>
						</tr>
					);
				})}
				<tr>
					<td
						className="bordered left"
						style={{ width: '70px', paddingLeft: '5px', backgroundColor: 'rgb(238, 238, 238)' }}
					>
						Total
					</td>
					{columnValues.map((total) => (
						<td key={total} className="bordered">
							{total}
						</td>
					))}
					<td className="bordered">{columnValues.reduce((a, b) => a + b, 0)}</td>
				</tr>
			</tbody>
		</table>
	);
};

const Tests = ({ contingency, chi2, p, log_chi2, log_p, n, dof }) => {
	return (
		<details open style={{ padding: '10px 30px', textAlign: 'center' }}>
			<summary className="analysis-summary-title">Contingency Table</summary>
			<ContingencyTable contingency={contingency} />
			<table>
				<tbody>
					<tr>
						<td colSpan={2} className="table-subtitle">
							Summary
						</td>
					</tr>
					<tr>
						<td className="table-header small">N</td>
						<td className="right small">{n}</td>
					</tr>
					<tr>
						<td className="table-header small">dof</td>
						<td className="right small">{dof}</td>
					</tr>
				</tbody>
			</table>
			<div style={{ height: '30px' }} />
			<table>
				<tbody>
					<tr>
						<td className="table-header medium">Test</td>
						<td className="table-header small right">ChiSquare</td>
						<td className="table-header small right">Prob>ChiSq</td>
					</tr>
					<tr>
						<td className="header-background medium">Likelihood Ratio</td>
						<td className="right small">{log_chi2.toFixed(4) / 1}</td>
						<td className="right small">{evaluatePValue(log_p)}</td>
					</tr>
					<tr>
						<td className="header-background medium">Pearson</td>
						<td className="right small">{chi2.toFixed(4) / 1}</td>
						<td className="right small">{evaluatePValue(p)}</td>
					</tr>
				</tbody>
			</table>
		</details>
	);
};
