import React from 'react';
import RegressionAnalysis from './RegressionAnalysis';
import DistributionAnalysis from './DistributionAnalysis';

export default function AnalysisContainer({ popup, setPopup }) {
	if (!popup.length === 0) {
		return null;
	}
	return popup.map((data, i) => {
		console.log('data in popup', data);
		if (data.reg1) {
			return <RegressionAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.numberOfBins) {
			return <DistributionAnalysis key={i} data={data} setPopup={setPopup} />;
		}
		return null;
	});
}
