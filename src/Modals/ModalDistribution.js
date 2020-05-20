// TODO: Combine this component with Analysis Modal
import React, { useState } from 'react';
import { Modal, Button, Input } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from '../SpreadsheetProvider';
import { TOGGLE_DISTRIBUTION_MODAL, SELECT_CELLS, REMOVE_SELECTED_CELLS } from '../constants';
import { performDistributionAnalysis } from '../Analyses';
import { SelectColumn, styles } from './ModalShared';
import ErrorMessage from './ErrorMessage';
import { createRandomID } from '../SpreadsheetProvider';

export default function DistributionModal({ setPopup }) {
	const { distributionModalOpen, columns, excludedRows, rows } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const [ error, setError ] = useState('');
	const [ numberOfBins, setNumberOfBins ] = useState(10);
	const [ yColData, setYColData ] = useState([]);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);

	function handleModalClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: false });
	}

	async function performAnalysis() {
		if (yColData.length === 0) {
			return;
		}
		// TODO: Better error handling here
		const colVals = rows
			.map((row) => !excludedRows.includes(row.id) && Number(row[yColData.id]))
			.filter((x) => Number(x));
		if (colVals.length < 3) {
			setError('Column must have at least 3 valid values');
			return;
		}
		setPerformingAnalysis(true);
		const results = await performDistributionAnalysis(yColData, colVals, numberOfBins);
		console.log('dist results:', results);
		setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
		// const popup = window.open(window.location.href + 'distribution.html', '', 'left=9999,top=100,width=500,height=850');
		// function receiveMessage(event) {
		// 	if (event.data === 'ready') {
		// 		popup.postMessage(results, '*');
		// 		window.removeEventListener('message', receiveMessage);
		// 	}
		// }

		// function removeTargetClickEvent(event) {
		// 	if (event.data === 'closed') {
		// 		console.log('target closed');
		// 		window.removeEventListener('message', targetClickEvent);
		// 		window.removeEventListener('message', removeTargetClickEvent);
		// 	}
		// }

		// function targetClickEvent(event) {
		// 	if (event.data.message === 'clicked') {
		// 		const selectedColumn = yColData;
		// 		const columnIndex = columns.findIndex((col) => col.id === selectedColumn.id);
		// 		if (!event.data.metaKeyPressed) {
		// 			dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
		// 		}

		// 		const rowIndices = rows.reduce((acc, row, rowIndex) => {
		// 			// TODO Shouldn't be using Number here?
		// 			return !excludedRows.includes(row.id) && event.data.vals.includes(Number(row[selectedColumn.id]))
		// 				? acc.concat(rowIndex)
		// 				: acc;
		// 		}, []);
		// 		dispatchSpreadsheetAction({ type: SELECT_CELLS, rows: rowIndices, column: columnIndex });
		// 	}
		// }
		// set event listener and wait for target to be ready
		// window.addEventListener('message', receiveMessage, false);
		// window.addEventListener('message', targetClickEvent);
		// window.addEventListener('message', removeTargetClickEvent);
		setPerformingAnalysis(false);
		dispatchSpreadsheetAction({ type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: false });
	}

	function onChangeBinInput(e) {
		e.preventDefault();
		if (isNaN(e.target.value)) {
			return setNumberOfBins(0);
		}
		return setNumberOfBins(e.target.value);
	}

	const filteredColumns = columns.filter((column) =>
		rows.some((row) => row[column.id] || typeof row[column.id] === 'number'),
	);

	return (
		<div>
			<Modal
				className="ant-modal"
				onCancel={handleModalClose}
				title="Distribution"
				visible={distributionModalOpen}
				width={550}
				bodyStyle={{ background: '#ECECEC' }}
				footer={[
					<div key="footer-div" style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						<ErrorMessage error={error} setError={setError} />
						<span style={{ alignSelf: 'end' }}>
							<Button disabled={performingAnalysis} key="back" onClick={handleModalClose}>
								Cancel
							</Button>
							<Button
								disabled={yColData.length === 0 || performingAnalysis}
								key="submit"
								type="primary"
								onClick={performAnalysis}
							>
								{performingAnalysis ? 'Loading...' : 'Submit'}
							</Button>
						</span>
					</div>,
				]}
			>
				<div style={{ ...styles.flexSpaced }}>
					<SelectColumn title={'Select Column'} columns={filteredColumns} setSelectedColumn={setYColData} />
					<div style={{ display: 'flex' }}>
						<div style={{ width: 100 }}>Number of Bins</div>
						<Input
							onChange={(e) => onChangeBinInput(e)}
							value={numberOfBins}
							style={{ marginLeft: 10, width: '40%' }}
						/>
					</div>
				</div>
			</Modal>
		</div>
	);
}
