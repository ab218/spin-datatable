import React, { useState } from 'react';
import { Button, Card, Modal, Radio } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { createBarChart } from './Analyses';
import { TOGGLE_BAR_CHART_MODAL } from './constants';
import { SelectColumn, styles } from './ModalShared';
import { REMOVE_SELECTED_CELLS, SELECT_CELLS } from './constants';

export default function AnalysisModal() {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ selectedRightColumn, setSelectedRightColumn ] = useState(null);
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

	function addColumnToList(col, setCol) {
		if (!selectedColumn || col.length > 0) return;
		setSelectedRightColumn(selectedColumn);
		setCol((prevState) => prevState.concat(selectedColumn));
	}

	function removeColumnFromList(setCol) {
		if (!selectedRightColumn) return;
		setSelectedRightColumn(null);
		setCol((prevState) => prevState.filter((col) => col !== selectedRightColumn));
	}

	async function performAnalysis() {
		if (!yColData[0] || !xColData[0] || !groupingColData[0]) {
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
				const row = i + 1;
				// Filter out NaN, undefined, null values
				if ((colA[i] || colA[i] === 0) && (colB[i] || colB[i] === 0)) {
					arr.push({ x: colA[i], y: colB[i], group: colC[i], row });
				}
			}
			return arr.sort();
		}
		const XYZCols = makeXYZCols(colA, colB, colC);
		const colXArr = XYZCols.map((a) => a.x);
		const colYArr = XYZCols.map((a) => a.y);
		const colZArr = XYZCols.map((a) => a.group);

		if (colXArr.length >= 3 && colYArr.length >= 3 && colZArr.length >= 3) {
			const results = await createBarChart(colXArr, colYArr, colZArr, colX.label, colY.label, colZ.label, XYZCols);
			const popup = window.open(window.location.href + 'bar_chart.html', '', 'left=9999,top=100,width=850,height=800');
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
			dispatchSpreadsheetAction({ type: TOGGLE_BAR_CHART_MODAL, barChartModalOpen: false });

			// set event listener and wait for target to be ready
			window.addEventListener('message', receiveMessage, false);
			window.addEventListener('message', targetClickEvent);
			window.addEventListener('message', removeTargetClickEvent);
		} else {
			setError('Columns must each contain at least 3 values to perform this analysis');
			return;
		}
	}

	function RadioGroup({ data, setData, styleProps }) {
		return (
			<Card bordered style={{ ...styles.cardWithBorder, ...styleProps }}>
				<Radio.Group style={styles.radioGroup} buttonStyle="solid">
					{data.length === 0 ? <em>Required</em> : <div />}
					{data.map((column) => (
						<Radio.Button style={styles.radioButton} key={column.id} onClick={() => setData(column)} value={column}>
							{column.label}
						</Radio.Button>
					))}
				</Radio.Group>
			</Card>
		);
	}

	function CaratButtons({ data, setData, label }) {
		return (
			<div style={styles.flexColumn}>
				<Button disabled={data.length !== 0} style={{ marginBottom: 5 }} onClick={() => addColumnToList(data, setData)}>
					{label}
				</Button>
				{data.length !== 0 && <Button onClick={() => removeColumnFromList(setData)}>Remove {label}</Button>}
			</div>
		);
	}

	const filteredColumns = columns.filter((column) =>
		rows.some((row) => row[column.id] || typeof row[column.id] === 'number'),
	);

	return (
		<div>
			<Modal
				className="ant-modal"
				// destroyOnClose
				onCancel={handleModalClose}
				okButtonProps={{ disabled: performingAnalysis }}
				cancelButtonProps={{ disabled: performingAnalysis }}
				okText={performingAnalysis ? 'Loading...' : 'Ok'}
				onOk={performAnalysis}
				title="Bar Chart"
				visible={barChartModalOpen}
				width={600}
				bodyStyle={{ background: '#ECECEC' }}
			>
				<div style={styles.flexSpaced}>
					<div>
						Select Column
						<SelectColumn columns={filteredColumns} setSelectedColumn={setSelectedColumn} />
					</div>
					<div style={{ width: 310 }}>
						Cast Selected Columns into Roles
						<div style={{ marginBottom: 20, marginTop: 20, ...styles.flexSpaced }}>
							<CaratButtons data={yColData} setData={setYColData} label="Y" />
							<RadioGroup data={yColData} setData={setSelectedRightColumn} />
						</div>
						<div style={{ marginBottom: 20, ...styles.flexSpaced }}>
							<CaratButtons data={xColData} setData={setXColData} label="X" />
							<RadioGroup data={xColData} setData={setSelectedRightColumn} />
						</div>
						<div style={styles.flexSpaced}>
							<CaratButtons data={groupingColData} setData={setGroupingColData} label="Color" />
							<RadioGroup data={groupingColData} setData={setSelectedRightColumn} />
						</div>
					</div>
				</div>
				<h5 style={{ display: error ? 'flex' : 'none', position: 'absolute', color: 'red' }}>{error}</h5>
			</Modal>
		</div>
	);
}
