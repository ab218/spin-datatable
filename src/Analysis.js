import React, { useEffect, useState } from 'react';
import Popup from './PopupWindow';
import './analysis-window.css';

export default function Analysis({ popup, setPopup }) {
	if (!popup.length === 0) {
		return null;
	}
	console.log('in analysis', popup);
	return popup.map((data) => (
		<Popup key={data.id} id={data.id} title={`Popup ${data.id}`} setPopup={setPopup}>
			<div>ID: {data.id}</div>
			<SummaryStatsTable
				corrcoef={data.corrcoef}
				reg1={data.reg1}
				cov={data.cov}
				coordinates={data.coordinates}
				colX={data.colX}
				colXMean={data.colXMean}
				std_x={data.std_x}
				colY={data.colY}
				colYMean={data.colYMean}
				std_y={data.std_y}
			/>
		</Popup>
	));
}

const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue.toFixed(4) / 1);

function SummaryStatsTable({ corrcoef, reg1, cov, coordinates, colX, colXMean, std_x, colY, colYMean, std_y }) {
	return (
		<details open style={{ padding: '10px 30px 30px', textAlign: 'center' }}>
			<summary className="analysis-summary-title">Summary Statistics</summary>
			<div style={{ display: 'flex' }}>
				<table style={{ width: '300px', marginRight: '20px' }}>
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
						<td className="right small">{evaluatePValue(reg1.stats.pvalues[0])}</td>
					</tr>
					<tr>
						<td className="header-background large">Covariance</td>
						<td className="right small">{cov[0][1].toFixed(4) / 1}</td>
					</tr>
					<tr>
						<td className="header-background large">Count</td>
						<td className="right small">{coordinates.length}</td>
					</tr>
				</table>
				<table style={{ width: '400px' }}>
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
				</table>
			</div>
		</details>
	);
}
