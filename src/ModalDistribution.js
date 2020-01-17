// TODO: Combine this component with Analysis Modal
import React, { useState } from 'react';
import { Modal, Input } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_DISTRIBUTION_MODAL, SELECT_CELLS, REMOVE_SELECTED_CELLS } from './constants';
import { performDistributionAnalysis } from './Analyses';
import { SelectColumn, styles } from './ModalShared';

export default function DistributionModal() {
	const { distributionModalOpen, columns, rows } = useSpreadsheetState();
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
			setError('Please add a valid column');
			return;
		}

		// TODO: Better error handling here
		const colVals = rows.map((row) => row[yColData.id]).filter((x) => Number(x));
		if (colVals.length < 3) {
			setError('Column must have at least 3 valid values');
			return;
		}
		setPerformingAnalysis(true);
		const results = await performDistributionAnalysis(yColData, rows, numberOfBins);
		const popup = window.open(window.location.href + 'distribution.html', '', 'left=9999,top=100,width=500,height=850');
		function receiveMessage(event) {
			if (event.data === 'ready') {
				popup.postMessage(results, '*');
				window.removeEventListener('message', receiveMessage);
			}
		}

		function removeTargetClickEvent(event) {
			if (event.data === 'closed') {
				console.log('target closed');
				window.removeEventListener('message', targetClickEvent);
				window.removeEventListener('message', removeTargetClickEvent);
			}
		}

		function targetClickEvent(event) {
			if (event.data.message === 'clicked') {
				const selectedColumn = yColData;
				const columnIndex = columns.findIndex((col) => col.id === selectedColumn.id);
				if (!event.data.metaKeyPressed) {
					dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
				}

				const rowIndices = rows.reduce((acc, row, rowIndex) => {
					// TODO Shouldn't be using Number here?
					return event.data.vals.includes(Number(row[selectedColumn.id])) ? acc.concat(rowIndex) : acc;
				}, []);
				dispatchSpreadsheetAction({ type: SELECT_CELLS, rows: rowIndices, column: columnIndex });
			}
		}
		// set event listener and wait for target to be ready
		window.addEventListener('message', receiveMessage, false);
		window.addEventListener('message', targetClickEvent);
		window.addEventListener('message', removeTargetClickEvent);
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
				okButtonProps={{ disabled: performingAnalysis }}
				cancelButtonProps={{ disabled: performingAnalysis }}
				okText={performingAnalysis ? 'Loading...' : 'Ok'}
				onOk={performAnalysis}
				title="Distribution"
				visible={distributionModalOpen}
				width={450}
				bodyStyle={{ background: '#ECECEC' }}
			>
				<div style={{ ...styles.flexSpaced }}>
					<div>
						Select Column
						<SelectColumn columns={filteredColumns} setSelectedColumn={setYColData} />
					</div>
					<div style={{ display: 'flex' }}>
						<div style={{ width: 100 }}>Number of Bins</div>
						<Input
							onChange={(e) => onChangeBinInput(e)}
							value={numberOfBins}
							style={{ marginLeft: 10, width: '40%' }}
						/>
					</div>
				</div>
				<h5 style={{ display: error ? 'flex' : 'none', position: 'absolute', color: 'red' }}>{error}</h5>
			</Modal>
		</div>
	);
}
