import React from 'react';
import RegressionAnalysis from './RegressionAnalysis';

export default function AnalysisContainer({ popup, setPopup }) {
	if (!popup.length === 0) {
		return null;
	}
	return popup.map((data, i) => {
		return data.reg1 ? <RegressionAnalysis key={i} data={data} setPopup={setPopup} /> : null;
	});
}
