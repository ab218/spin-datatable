import React, { useState } from 'react';
import { Button, Card, Modal, Radio } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { performLinearRegressionAnalysis } from './Analyses';
import { TOGGLE_ANALYSIS_MODAL } from './constants';
import { SelectColumn, styles } from './ModalShared';

export default function AnalysisModal() {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ selectedRightColumn, setSelectedRightColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const { analysisModalOpen, columns, rows } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	function handleModalClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
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

	function performAnalysis() {
		if (!yColData[0] || !xColData[0]) {
			setError('Please add all required columns and try again');
			return;
		}

		const colX = xColData[0] || columns[0];
		const colY = yColData[0] || columns[2];
		function mapColumnValues(colID) {
			return rows.map((row) => Number(row[colID]));
		}
		const colA = mapColumnValues(colX.id);
		const colB = mapColumnValues(colY.id);
		const maxColLength = Math.max(colA.length, colB.length);
		function makeXYCols(colA, colB) {
			const arr = [];
			for (let i = 0; i < maxColLength; i++) {
				// Filter out NaN, undefined, null values
				if ((colA[i] || colA[i] === 0) && (colB[i] || colB[i] === 0)) {
					arr.push([ colA[i], colB[i] ]);
				}
			}
			return arr.sort();
		}
		const XYCols = makeXYCols(colA, colB);
		const colXArr = XYCols.map((a) => a[0]);
		const colYArr = XYCols.map((a) => a[1]);

		if (colXArr.length >= 3 && colYArr.length >= 3) {
			performLinearRegressionAnalysis(colXArr, colYArr, colX.label, colY.label, XYCols);
			dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
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

	function CaratButtons({ data, setData, axis }) {
		return (
			<div style={styles.flexColumn}>
				<Button disabled={data.length !== 0} style={{ marginBottom: 5 }} onClick={() => addColumnToList(data, setData)}>
					Add {axis}
				</Button>
				{data.length !== 0 && <Button onClick={() => removeColumnFromList(setData)}>Remove {axis}</Button>}
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
				onOk={performAnalysis}
				title="Fit Y by X"
				visible={analysisModalOpen}
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
							<CaratButtons data={yColData} setData={setYColData} axis="Y" />
							<RadioGroup data={yColData} setData={setSelectedRightColumn} />
						</div>
						<div style={styles.flexSpaced}>
							<CaratButtons data={xColData} setData={setXColData} axis="X" />
							<RadioGroup data={xColData} setData={setSelectedRightColumn} />
						</div>
					</div>
				</div>
				<h5 style={{ display: error ? 'flex' : 'none', position: 'absolute', color: 'red' }}>{error}</h5>
			</Modal>
		</div>
	);
}
