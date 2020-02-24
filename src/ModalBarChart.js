import React, { useState } from 'react';
import { Button, Card, Modal, Radio, Typography } from 'antd';
import RemoveColumnButton from './RemoveColumnButton';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { createBarChart } from './Analyses';
import { TOGGLE_BAR_CHART_MODAL, SELECT_ROW } from './constants';
import { SelectColumn, styles } from './ModalShared';
import { REMOVE_SELECTED_CELLS, FILTER_COLUMN, SET_FILTERS } from './constants';

export default function AnalysisModal() {
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

	function addColumnToList(col, setCol) {
		if (!selectedColumn || col.length > 0) return;
		setCol((prevState) => prevState.concat(selectedColumn));
	}

	function removeColumnFromList(setCol, column) {
		setCol((prevState) => prevState.filter((col) => col !== column));
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
			const results = await createBarChart(colXArr, colYArr, colZArr, colX, colY, colZ, XYZCols);
			const popup = window.open(window.location.href + 'bar_chart.html', '', 'left=9999,top=100,width=1000,height=800');
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
					if (!event.data.metaKeyPressed) {
						dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
					}
					if (event.data.label && event.data.colZ) {
						dispatchSpreadsheetAction({ type: SET_FILTERS, filters: { stringFilters: [ event.data.colZ.text ] } });
						dispatchSpreadsheetAction({ type: FILTER_COLUMN });
						return;
					}
					const selectedRow = event.data.rowID;
					dispatchSpreadsheetAction({
						type: SELECT_ROW,
						rowId: selectedRow,
						rowIndex: rows.findIndex((row) => row.id === selectedRow),
					});
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

	function RadioGroup({ data, styleProps, removeData }) {
		return (
			<Card bordered style={{ ...styles.cardWithBorder, ...styleProps }}>
				<Radio.Group style={styles.radioGroup} buttonStyle="solid">
					{data.length === 0 ? <em>Required</em> : null}
					{data.map((column) => (
						<div style={{ display: 'flex', ...styles.radioButton }} key={column.id}>
							<Typography.Text ellipsis={true} style={{ paddingLeft: 5, margin: 'auto' }}>
								{column.label}
							</Typography.Text>
							<RemoveColumnButton removeColumn={() => removeColumnFromList(removeData, column)} />
						</div>
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
				onCancel={handleModalClose}
				okButtonProps={{ disabled: performingAnalysis }}
				cancelButtonProps={{ disabled: performingAnalysis }}
				okText={performingAnalysis ? 'Loading...' : 'Ok'}
				onOk={performAnalysis}
				title="Bar Chart"
				visible={barChartModalOpen}
				width={650}
				bodyStyle={{ background: '#ECECEC' }}
			>
				<div style={styles.flexSpaced}>
					<div>
						Select Column
						<SelectColumn columns={filteredColumns} setSelectedColumn={setSelectedColumn} />
					</div>
					<div style={{ width: 360 }}>
						Cast Selected Columns into Roles
						<div style={{ marginBottom: 20, marginTop: 20, ...styles.flexSpaced }}>
							<CaratButtons data={yColData} setData={setYColData} label="Y" />
							<RadioGroup data={yColData} removeData={setYColData} />
						</div>
						<div style={{ marginBottom: 20, ...styles.flexSpaced }}>
							<CaratButtons data={xColData} setData={setXColData} label="X" />
							<RadioGroup data={xColData} removeData={setXColData} />
						</div>
						<div style={styles.flexSpaced}>
							<CaratButtons data={groupingColData} setData={setGroupingColData} label="Group" />
							<RadioGroup data={groupingColData} removeData={setGroupingColData} />
						</div>
					</div>
				</div>
				<h5 style={{ display: error ? 'flex' : 'none', position: 'absolute', color: 'red' }}>{error}</h5>
			</Modal>
		</div>
	);
}
