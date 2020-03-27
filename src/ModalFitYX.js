import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { performLinearRegressionAnalysis, performOnewayAnalysis } from './Analyses';
import ErrorMessage from './ErrorMessage';
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
	SAVE_RESIDUALS_TO_COLUMN,
} from './constants';
import VariableLegend from './FitYXLegend';

export default function AnalysisModal() {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);
	const [ analysisType, setAnalysisType ] = useState(null);
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
		// TODO: combine this with makeRows
		function mapColumnValues(column) {
			return rows.map((row) => {
				if (!excludedRows.includes(row.id)) {
					if (column.type === 'Number' || column.type === 'Formula') {
						return Number(row[column.id]);
					} else {
						return row[column.id];
					}
				}
				return null;
			});
		}
		const colA = mapColumnValues(colX);
		const colB = mapColumnValues(colY);
		const maxColLength = Math.max(colA.length, colB.length);
		function makeRows(colA, colB) {
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
		const XYCols = makeRows(colA, colB);
		const colXArr = XYCols.map((a) => a[0]);
		const colYArr = XYCols.map((a) => a[1]);

		function receiveMessage(event, popup, results) {
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

		async function linearRegression() {
			if (colXArr.length >= 3 && colYArr.length >= 3) {
				try {
					function removeTargetClickEvent(event) {
						if (event.data === 'closed') {
							window.removeEventListener('message', targetClickEvent);
							window.removeEventListener('message', removeTargetClickEvent);
						}
					}

					function saveResiduals(event) {
						if (event.data.message !== 'save-residuals') return;
						const { residuals } = event.data;
						dispatchSpreadsheetAction({ type: SAVE_RESIDUALS_TO_COLUMN, residuals, colX, colY });
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

					setPerformingAnalysis(true);
					const results = await performLinearRegressionAnalysis(colXArr, colYArr, colX, colY, XYCols);
					const popup = window.open(
						window.location.href + 'linear_regression.html',
						'',
						'left=9999,top=100,width=800,height=850',
					);

					setPerformingAnalysis(false);
					handleModalClose();

					// set event listener and wait for target to be ready
					window.addEventListener('message', (event) => receiveMessage(event, popup, results), false);
					window.addEventListener('message', targetClickEvent);
					window.addEventListener('message', saveResiduals);
					window.addEventListener('message', removeTargetClickEvent);
				} catch (e) {
					console.log(e);
					setPerformingAnalysis(false);
					setError('Something went wrong while performing analysis');
				}
			} else {
				setError('Columns must each contain at least 3 values to perform this analysis');
				return;
			}
		}
		async function oneway() {
			try {
				setPerformingAnalysis(true);
				const results = await performOnewayAnalysis(colXArr, colYArr, colX, colY, XYCols);
				const popup = window.open(window.location.href + 'oneway.html', '', 'left=9999,top=100,width=800,height=850');
				console.log(results);
				window.addEventListener('message', (event) => receiveMessage(event, popup, results), false);
			} catch (e) {
				console.log(e);
				setPerformingAnalysis(false);
				setError('Something went wrong while performing analysis');
			}
		}
		if (analysisType === BIVARIATE) {
			linearRegression();
		} else if (analysisType === ONEWAY) {
			oneway();
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
		} else if ((yData === ORDINAL || yData === NOMINAL) && (xData === ORDINAL || xData === NOMINAL)) {
			return CONTINGENCY;
		} else {
			return null;
		}
	}

	useEffect(
		() => {
			if (!yColData.length || !xColData.length) {
				return setAnalysisType(null);
			}
			setAnalysisType(determineAnalysisType(yColData[0].modelingType, xColData[0].modelingType));
		},
		[ xColData, yColData ],
	);

	useEffect(
		() => {
			if (analysisType && (analysisType === LOGISTIC || analysisType === CONTINGENCY)) {
				setError(`${analysisType} Analysis currently unsupported`);
				return;
			}
			setError(null);
		},
		[ analysisType ],
	);

	return (
		<div>
			<Modal
				className="ant-modal"
				onCancel={handleModalClose}
				title="Fit Y by X"
				visible={analysisModalOpen}
				width={750}
				bodyStyle={{ background: '#ECECEC' }}
				footer={[
					<div key="footer-div" style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						<ErrorMessage error={error} setError={setError} />
						<span style={{ alignSelf: 'end' }}>
							<Button disabled={performingAnalysis} key="back" onClick={handleModalClose}>
								Cancel
							</Button>
							<Button
								disabled={
									xColData.length === 0 ||
									yColData.length === 0 ||
									performingAnalysis ||
									(analysisType === LOGISTIC || analysisType === CONTINGENCY)
								}
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
				<div style={styles.flexSpaced}>
					<div>
						<SelectColumn
							// selectedColumn={selectedColumn}
							title={'Select Column'}
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
					{xColData.length !== 0 &&
					yColData.length !== 0 && (
						<h4 style={{ textAlign: 'right' }}>
							Perform {analysisType} Analysis{' '}
							{(analysisType === LOGISTIC || analysisType === CONTINGENCY) && '(Currently unsupported)'}
						</h4>
					)}
				</div>
			</Modal>
		</div>
	);
}
