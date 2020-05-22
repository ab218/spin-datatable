import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from '../SpreadsheetProvider';
import { createBarChart } from '../analysis-output/Analysis';
import { TOGGLE_BAR_CHART_MODAL } from '../constants';
import { SelectColumn, styles, VariableSelector } from './ModalShared';
import ErrorMessage from './ErrorMessage';
import { createRandomID } from '../SpreadsheetProvider';

export default function AnalysisModal({ setPopup }) {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ groupingColData, setGroupingColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);
	const { excludedRows, barChartModalOpen, columns, rows } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	function handleModalClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_BAR_CHART_MODAL, barChartModalOpen: false });
	}

	async function performAnalysis() {
		if (!yColData[0] || !xColData[0] || !groupingColData[0]) {
			// user should never see this
			setError('Please add all required columns and try again');
			return;
		}
		setPerformingAnalysis(true);
		const colX = xColData[0];
		const colY = yColData[0];
		const colZ = groupingColData[0];
		// TODO: combine this with makeXYCols
		const mapNumberColumnValues = (colID) => rows.map((row) => !excludedRows.includes(row.id) && Number(row[colID]));
		const mapCharacterColumnValues = (colID) => rows.map((row) => !excludedRows.includes(row.id) && row[colID]);
		const colA = mapNumberColumnValues(colX.id);
		const colB = mapNumberColumnValues(colY.id);
		const colC = mapCharacterColumnValues(colZ.id);
		const maxColLength = Math.max(colA.length, colB.length, colC.length);
		function makeXYZCols(colA, colB, colC) {
			const arr = [];
			for (let i = 0; i < maxColLength; i++) {
				const rowNumber = i + 1;
				// Filter out NaN, undefined, null values
				if ((colA[i] || colA[i] === 0) && (colB[i] || colB[i] === 0)) {
					arr.push({
						x: colA[i],
						y: colB[i],
						group: colC[i],
						row: {
							rowID: rows[i]['id'],
							rowNumber,
						},
					});
				}
			}
			return arr.sort();
		}
		const XYZCols = makeXYZCols(colA, colB, colC);
		const colXArr = XYZCols.map((a) => a.x);
		const colYArr = XYZCols.map((a) => a.y);
		const colZArr = XYZCols.map((a) => a.group);

		if (colXArr.length >= 1 && colYArr.length >= 1 && colZArr.length >= 1) {
			const results = await createBarChart(colXArr, colYArr, colZArr, colX, colY, colZ, XYZCols, colX.modelingType);
			setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
			// const popup = window.open(window.location.href + 'bar_chart.html', '', 'left=9999,top=100,width=1000,height=800');
			// function receiveMessage(event) {
			// 	// target window is ready, time to send data.
			// 	if (event.data === 'ready') {
			// 		// (I think) if the cloud function tries to serialize an incompatible type (NaN), it sends a string instead of an object.
			// 		if (typeof results === 'string') {
			// 			return alert('Something went wrong. Check your data and try again.');
			// 		}
			// 		popup.postMessage(results, '*');
			// 		window.removeEventListener('message', receiveMessage);
			// 	}
			// }

			// function removeTargetClickEvent(event) {
			// 	if (event.data === 'closed') {
			// 		window.removeEventListener('message', targetClickEvent);
			// 		window.removeEventListener('message', removeTargetClickEvent);
			// 	}
			// }

			// function targetClickEvent(event) {
			// 	if (event.data.message === 'clicked') {
			// 		if (!event.data.metaKeyPressed) {
			// 			dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
			// 		}
			// 		if (event.data.label && event.data.colZ) {
			// 			dispatchSpreadsheetAction({ type: SET_FILTERS, stringFilter: { [colZ.id]: event.data.colZ.text } });
			// 			dispatchSpreadsheetAction({ type: FILTER_COLUMN });
			// 			return;
			// 		}
			// 		const selectedRow = event.data.rowID;
			// 		dispatchSpreadsheetAction({
			// 			type: SELECT_ROW,
			// 			rowID: selectedRow,
			// 			rowIndex: rows.findIndex((row) => row.id === selectedRow),
			// 		});
			// 	}
			// }
			setPerformingAnalysis(false);
			dispatchSpreadsheetAction({ type: TOGGLE_BAR_CHART_MODAL, barChartModalOpen: false });

			// set event listener and wait for target to be ready
			// window.addEventListener('message', receiveMessage, false);
			// window.addEventListener('message', targetClickEvent);
			// window.addEventListener('message', removeTargetClickEvent);
		} else {
			// user should never see this, as columns with under 1 value are filtered out
			setError('Columns must each contain at least 1 value to perform this analysis');
			return;
		}
	}

	const filteredColumns = columns.filter((column) =>
		rows.some((row) => row[column.id] || typeof row[column.id] === 'number'),
	);

	return (
		<div>
			<Modal
				className="ant-modal"
				onCancel={handleModalClose}
				onOk={performAnalysis}
				title="Bar Chart"
				visible={barChartModalOpen}
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
									xColData.length === 0 || yColData.length === 0 || groupingColData.length === 0 || performingAnalysis
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
					<SelectColumn
						title={'Select Column'}
						groupingColData={groupingColData[0]}
						columns={filteredColumns}
						setSelectedColumn={setSelectedColumn}
					/>
					<div style={{ width: 410 }}>
						Cast Selected Columns into Roles
						<VariableSelector
							data={yColData}
							label="Y"
							setData={setYColData}
							selectedColumn={selectedColumn}
							styleProps={{ marginBottom: 20, marginTop: 20 }}
						/>
						<VariableSelector
							data={xColData}
							label="X"
							setData={setXColData}
							selectedColumn={selectedColumn}
							styleProps={{ marginBottom: 20 }}
						/>
						<VariableSelector
							data={groupingColData}
							label="Group"
							setData={setGroupingColData}
							selectedColumn={selectedColumn}
						/>
					</div>
				</div>
			</Modal>
		</div>
	);
}
