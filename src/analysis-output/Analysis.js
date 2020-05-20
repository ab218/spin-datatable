import React from 'react';
import RegressionAnalysis from './RegressionAnalysis';
import DistributionAnalysis from './DistributionAnalysis';
import OnewayAnalysis from './OnewayAnalysis';

export default function AnalysisContainer({ popup, setPopup }) {
	if (!popup.length === 0) {
		return null;
	}
	return popup.map((data, i) => {
		if (data.analysisType === 'regression') {
			return <RegressionAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.analysisType === 'distribution') {
			return <DistributionAnalysis key={i} data={data} setPopup={setPopup} />;
		} else if (data.analysisType === 'oneway') {
			return <OnewayAnalysis key={i} data={data} setPopup={setPopup} />;
		}
		return null;
	});
}
