import React from 'react';
import Popup from './PopupWindow';
import BarChartD3Chart from './BarChartD3Chart';
import './analysis-window.css';

export default function BarChartAnalysis({ data, setPopup }) {
	const { colX, colY, colZ, coordinates, colXId, colYId, colZId, colXScale } = data;
	return (
		<Popup
			key={data.id}
			id={data.id}
			title={`Bar Chart - ${colY.label} vs ${colX.label}`}
			windowWidth={1000}
			setPopup={setPopup}
		>
			<TitleText colY={colY} colX={colX} />
			<BarChartD3Chart
				colX={colX}
				colY={colY}
				colZ={colZ}
				coordinates={coordinates}
				colXId={colXId}
				colYId={colYId}
				colZId={colZId}
				colXScale={colXScale}
			/>
		</Popup>
	);
}

const TitleText = ({ colY, colX }) => (
	<h1 style={{ textAlign: 'center' }}>
		{colY.label} vs {colX.label}
	</h1>
);
