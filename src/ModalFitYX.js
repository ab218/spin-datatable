import React, { useState } from 'react';
import { Modal } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { performLinearRegressionAnalysis } from './Analyses';
import { TOGGLE_ANALYSIS_MODAL } from './constants';
import { SelectColumn, styles, VariableSelector } from './ModalShared';
import {
	REMOVE_SELECTED_CELLS,
	SELECT_CELLS,
	ORDINAL,
	CONTINUOUS,
	NOMINAL,
	BIVARIATE,
	LOGISTIC,
	ONEWAY,
	CONTINGENCY,
} from './constants';
import VariableLegend from './FitYXLegend';

export default function AnalysisModal() {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);
	const { excludedRows, analysisModalOpen, columns, rows } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	function handleModalClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
	}

	async function performAnalysis() {
		if (!yColData[0] || !xColData[0]) {
			setError('Please add all required columns and try again');
			return;
		}
		const colX = xColData[0] || columns[0];
		const colY = yColData[0] || columns[2];
		// TODO: combine this with makeXYCols
		function mapColumnValues(colID) {
			return rows.map((row) => !excludedRows.includes(row.id) && Number(row[colID]));
		}
		const colA = mapColumnValues(colX.id);
		const colB = mapColumnValues(colY.id);
		const maxColLength = Math.max(colA.length, colB.length);
		function makeXYCols(colA, colB) {
			const arr = [];
			for (let i = 0; i < maxColLength; i++) {
				const row = i + 1;
				// Filter out NaN, undefined, null values
				if ((colA[i] || colA[i] === 0) && (colB[i] || colB[i] === 0)) {
					arr.push([ colA[i], colB[i], row ]);
				}
			}
			return arr.sort();
		}
		const XYCols = makeXYCols(colA, colB);
		const colXArr = XYCols.map((a) => a[0]);
		const colYArr = XYCols.map((a) => a[1]);

		if (colXArr.length >= 3 && colYArr.length >= 3) {
			setPerformingAnalysis(true);
			const results = await performLinearRegressionAnalysis(colXArr, colYArr, colX.label, colY.label, XYCols);
			const popup = window.open(
				window.location.href + 'linear_regression.html',
				'',
				'left=9999,top=100,width=800,height=850',
			);
			function receiveMessage(event) {
				// target window is ready, time to send data.
				if (event.data === 'ready') {
					// (I think) if the cloud function tries to serialize an incompatible type (NaN), it sends a string instead of an object.
					if (typeof results === 'string') {
						return alert('Something went wrong. Check your data and try again.');
					}
					popup.postMessage(results, '*');
					window.removeEventListener('message', receiveMessage);
				}
			}

			function removeTargetClickEvent(event) {
				if (event.data === 'closed') {
					window.removeEventListener('message', targetClickEvent);
					window.removeEventListener('message', removeTargetClickEvent);
				}
			}

			function targetClickEvent(event) {
				if (event.data.message === 'clicked') {
					const selectedColumn = event.data.col === 'x' ? xColData[0] : yColData[0];
					const columnIndex = columns.findIndex((col) => col.id === selectedColumn.id);
					if (!event.data.metaKeyPressed) {
						dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
					}

					const rowIndices = rows.reduce((acc, row, rowIndex) => {
						// TODO Shouldn't be using Number here?
						return !excludedRows.includes(row.id) && event.data.vals.includes(Number(row[selectedColumn.id]))
							? acc.concat(rowIndex)
							: acc;
					}, []);
					dispatchSpreadsheetAction({ type: SELECT_CELLS, rows: rowIndices, column: columnIndex });
				}
			}
			setPerformingAnalysis(false);
			dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });

			// set event listener and wait for target to be ready
			window.addEventListener('message', receiveMessage, false);
			window.addEventListener('message', targetClickEvent);
			window.addEventListener('message', removeTargetClickEvent);
		} else {
			setError('Columns must each contain at least 3 values to perform this analysis');
			return;
		}
	}

	const filteredColumns = columns.filter((column) =>
		rows.some((row) => row[column.id] || typeof row[column.id] === 'number'),
	);

	function determineAnalysisType(yData, xData) {
		if (yData === CONTINUOUS && xData === CONTINUOUS) {
			return BIVARIATE;
		} else if (yData === CONTINUOUS && (xData === ORDINAL || xData === NOMINAL)) {
			return ONEWAY;
		} else if ((yData === ORDINAL || yData === NOMINAL) && xData === CONTINUOUS) {
			return LOGISTIC;
		} else {
			return CONTINGENCY;
		}
	}

	return (
		<div>
			<Modal
				className="ant-modal"
				// destroyOnClose
				onCancel={handleModalClose}
				okButtonProps={{ disabled: xColData.length === 0 || yColData.length === 0 || performingAnalysis }}
				cancelButtonProps={{ disabled: performingAnalysis }}
				okText={performingAnalysis ? 'Loading...' : 'Ok'}
				onOk={performAnalysis}
				title="Fit Y by X"
				visible={analysisModalOpen}
				width={750}
				bodyStyle={{ background: '#ECECEC' }}
			>
				<div style={styles.flexSpaced}>
					<div>
						<SelectColumn
							selectedColumn={selectedColumn}
							columns={filteredColumns}
							setSelectedColumn={setSelectedColumn}
						/>
						<VariableLegend yColData={yColData} xColData={xColData} />
					</div>
					<div style={{ width: 400 }}>
						Cast Selected Columns into Roles
						<VariableSelector
							data={yColData}
							setData={setYColData}
							label="Y"
							selectedColumn={selectedColumn}
							styleProps={{ marginBottom: 20, marginTop: 20 }}
						/>
						<VariableSelector data={xColData} setData={setXColData} label="X" selectedColumn={selectedColumn} />
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', height: 30 }}>
					<h5 style={{ display: error ? 'flex' : 'none', position: 'absolute', color: 'red' }}>{error}</h5>
					{xColData.length !== 0 &&
					yColData.length !== 0 && (
						<h4 style={{ textAlign: 'right' }}>
							Perform {determineAnalysisType(yColData[0].modelingType, xColData[0].modelingType)} Analysis
						</h4>
					)}
				</div>
			</Modal>
		</div>
	);
}
