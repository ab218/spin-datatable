import React from 'react';
import * as d3 from 'd3';
import './analysis-window.css';
import DistributionD3Chart from './DistributionD3Chart';
import Popup from './PopupWindow';

export default function DistributionAnalysis({ data, setPopup }) {
	const { colObj, vals, skew, kurtosis, numberOfBins } = data;
	const boxDataSorted = vals.sort(d3.ascending);
	// Compute summary statistics used for the box:
	const q1 = d3.quantile(boxDataSorted, 0.25);
	const median = d3.quantile(boxDataSorted, 0.5);
	const q3 = d3.quantile(boxDataSorted, 0.75);
	// interQuantileRange = q3 - q1;
	const min = boxDataSorted[0];
	const max = boxDataSorted[boxDataSorted.length - 1];

	return (
		<Popup key={data.id} id={data.id} title={`Popup ${data.id}`} windowWidth={500} setPopup={setPopup}>
			<div id="popupcontainer" style={{ textAlign: 'center' }}>
				<TitleText colObj={colObj} />
				<DistributionD3Chart
					min={min}
					max={max}
					q1={q1}
					q3={q3}
					median={median}
					boxDataSorted={boxDataSorted}
					vals={vals}
					numberOfBins={numberOfBins}
				/>
				<SummaryStatistics boxDataSorted={boxDataSorted} vals={vals} skew={skew} kurtosis={kurtosis} />
				<Quantiles boxDataSorted={boxDataSorted} max={max} q1={q1} q3={q3} median={median} min={min} />
			</div>
		</Popup>
	);
}

const TitleText = ({ colObj }) => (
	<div className="analysis-title">
		Distribution of {colObj.label} {colObj.units ? '(' + colObj.units + ')' : ''}
	</div>
);

const SummaryStatistics = ({ boxDataSorted, vals, skew, kurtosis }) => (
	<div style={{ width: '50%', margin: '10px auto' }}>
		<h4 className="table-subtitle">Summary Statistics</h4>
		<table>
			<tr>
				<td className="table-header small">Mean:</td>
				<td className="medium right">{d3.mean(boxDataSorted).toFixed(4) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">Std Dev:</td>
				<td className="medium right">{d3.deviation(vals).toFixed(4) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">Count:</td>
				<td className="medium right">{boxDataSorted.length}</td>
			</tr>
			<tr>
				<td className="table-header small">Skewness:</td>
				<td className="medium right">{skew.toFixed(4) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">Kurtosis:</td>
				<td className="medium right">{kurtosis.toFixed(4) / 1}</td>
			</tr>
		</table>
	</div>
);

const Quantiles = ({ max, boxDataSorted, q1, q3, median, min }) => (
	<div style={{ width: '50%', margin: '0 auto' }}>
		<h4 className="table-subtitle">Quantiles</h4>
		<table>
			<tr>
				<td className="table-header small">100.0%:</td>
				<td className="small">Maximum</td>
				<td className="small right">{max}</td>
			</tr>
			<tr>
				<td className="table-header small">99.5%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.995).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">97.5%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.975).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">90.0%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.9).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">75.0%:</td>
				<td className="small">Quartile 3</td>
				<td className="small right">{q3.toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">50.0%:</td>
				<td className="small">Median</td>
				<td className="small right">{median}</td>
			</tr>
			<tr>
				<td className="table-header small">25.0%:</td>
				<td className="small">Quartile 1</td>
				<td className="small right">{q1.toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">10.0%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.1).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">2.5%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.025).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">0.5%:</td>
				<td className="small" />
				<td className="small right">{d3.quantile(boxDataSorted, 0.005).toFixed(6) / 1}</td>
			</tr>
			<tr>
				<td className="table-header small">0.0%:</td>
				<td className="small">Minimum</td>
				<td className="small right">{min}</td>
			</tr>
		</table>
	</div>
);
