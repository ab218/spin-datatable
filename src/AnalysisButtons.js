import React from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_ANALYSIS_MODAL, TOGGLE_DISTRIBUTION_MODAL, TOGGLE_FILTER_MODAL } from './constants';
import { Button, Icon, Tooltip } from 'antd';

export default function AnalysisButtons() {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	return (
		<div
			style={{ position: 'fixed', bottom: 20, justifyContent: 'center', width: '100%', display: 'flex', height: 45 }}
		>
			<div style={{ marginTop: 3 }}>
				<Tooltip title="Distribution">
					<Button
						onClick={() => dispatchSpreadsheetAction({ type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: true })}
						style={{ height: 40, fontSize: 26, padding: '0 8px' }}
					>
						<Icon rotate={90} type="box-plot" />
					</Button>
				</Tooltip>
			</div>
			<div style={{ marginLeft: 1, marginTop: 3 }}>
				<Tooltip title="Fit Y by X">
					<Button
						onClick={() => dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: true })}
						style={{ height: 40, fontSize: 26 }}
						icon="line-chart"
					/>
				</Tooltip>
			</div>
			<div style={{ marginLeft: 1, marginTop: 3 }}>
				<Tooltip title="Filter">
					<Button
						onClick={() => dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: true })}
						style={{ height: 40, fontSize: 26 }}
						icon="filter"
					/>
				</Tooltip>
			</div>
		</div>
	);
}
