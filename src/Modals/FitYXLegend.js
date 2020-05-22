import React from 'react';
import { styles, OrdinalIcon, ContinuousIcon, NominalIcon } from './ModalShared';
import { ORDINAL, CONTINUOUS, NOMINAL, BIVARIATE, LOGISTIC, ONEWAY, CONTINGENCY } from '../constants';

function lightUpQuadrants(yData, xData) {
	let yDataArr = [];
	let xDataArr = [];

	if (yData === CONTINUOUS) {
		yDataArr = [ BIVARIATE, ONEWAY ];
	}
	if (yData === ORDINAL || yData === NOMINAL) {
		yDataArr = [ LOGISTIC, CONTINGENCY ];
	}
	if (xData === CONTINUOUS) {
		xDataArr = [ BIVARIATE, LOGISTIC ];
	}
	if (xData === ORDINAL || xData === NOMINAL) {
		xDataArr = [ ONEWAY, CONTINGENCY ];
	}
	if (yDataArr.length !== 0 && xDataArr.length !== 0) {
		return yDataArr.filter((y) => xDataArr.includes(y));
	} else if (yDataArr.length !== 0) {
		return yDataArr;
	} else if (xDataArr.length !== 0) {
		return xDataArr;
	} else {
		return [ BIVARIATE, ONEWAY, LOGISTIC, CONTINGENCY ];
	}
}

function VariableLegendQuadrant({ analysisTypes, label }) {
	return (
		<td
			style={{
				opacity: analysisTypes.includes(label) ? 1 : 0.3,
				...styles.variableLegend,
			}}
		>
			{label}
		</td>
	);
}

export default function VariableLegend({ yColData, xColData }) {
	const yData = yColData.length !== 0 && yColData[0].modelingType;
	const xData = xColData.length !== 0 && xColData[0].modelingType;
	const analysisTypes = lightUpQuadrants(yData, xData);
	return (
		<table style={{ marginTop: 30, textAlign: 'center', width: 200, height: 200 }}>
			<tbody>
				<tr>
					<td style={{ width: '10%', height: '40%' }}>
						<ContinuousIcon styleProps={{ opacity: yData === NOMINAL || yData === ORDINAL ? 0.3 : 1 }} />
					</td>
					<VariableLegendQuadrant analysisTypes={analysisTypes} label={BIVARIATE} />
					<VariableLegendQuadrant analysisTypes={analysisTypes} label={ONEWAY} />
				</tr>
				<tr>
					<td
						style={{
							width: '10%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
						}}
					>
						<OrdinalIcon styleProps={{ opacity: yData === NOMINAL || yData === CONTINUOUS ? 0.3 : 1 }} />
						<NominalIcon styleProps={{ opacity: yData === ORDINAL || yData === CONTINUOUS ? 0.3 : 1 }} />
					</td>
					<VariableLegendQuadrant analysisTypes={analysisTypes} label={LOGISTIC} />
					<VariableLegendQuadrant analysisTypes={analysisTypes} label={CONTINGENCY} />
				</tr>
				<tr style={{ opacity: 1 }}>
					<td style={{ width: '10%', height: '10%' }} />
					<td style={{ width: '40%', height: '10%' }}>
						<ContinuousIcon styleProps={{ opacity: xData === NOMINAL || xData === ORDINAL ? 0.3 : 1 }} />
					</td>
					<td style={{ width: '40%', height: '10%' }}>
						<OrdinalIcon styleProps={{ opacity: xData === NOMINAL || xData === CONTINUOUS ? 0.3 : 1 }} />
						<NominalIcon styleProps={{ opacity: xData === CONTINUOUS || xData === ORDINAL ? 0.3 : 1 }} />
					</td>
				</tr>
			</tbody>
		</table>
	);
}
