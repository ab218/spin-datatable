import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch, useRowsState } from '../context/SpreadsheetProvider';
import { TOGGLE_BAR_CHART_MODAL } from '../constants';
import { SelectColumn, styles, VariableSelector } from './ModalShared';
import ErrorMessage from './ErrorMessage';
import { receiveMessage } from './ModalFitYX';

export default function AnalysisModal({ setPopup }) {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ groupingColData, setGroupingColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);
	const { barChartModalOpen } = useSpreadsheetState();
	const { columns, rows, excludedRows } = useRowsState();
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
			const payload = {
				analysisType: 'barchart',
				colXArr,
				colYArr,
				colZArr,
				colX,
				colY,
				colZ,
				XYZCols,
				colXScale: colX.modelingType,
			};
			const popup = window.open('http://localhost:3001/', '', 'left=9999,top=100,width=1000,height=850');
			window.addEventListener('message', (event) => receiveMessage(event, popup, payload), false);

			setPerformingAnalysis(false);
			dispatchSpreadsheetAction({ type: TOGGLE_BAR_CHART_MODAL, barChartModalOpen: false });
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
