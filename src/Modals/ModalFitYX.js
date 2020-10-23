import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch, useRowsState } from '../context/SpreadsheetProvider';
import {
	performLinearRegressionAnalysis,
	performOnewayAnalysis,
	performContingencyAnalysis,
} from '../analysis-output/Analysis';
import ErrorMessage from './ErrorMessage';
import { TOGGLE_ANALYSIS_MODAL } from '../constants';
import { SelectColumn, styles, VariableSelector } from './ModalShared';
import { createRandomID, filterExcludedRows } from '../context/helpers';
import { ORDINAL, CONTINUOUS, NOMINAL, BIVARIATE, LOGISTIC, ONEWAY, CONTINGENCY } from '../constants';
import VariableLegend from './FitYXLegend';
import DraggableModal from './DraggableModal';

export default function AnalysisModal({ setPopup }) {
	const [ selectedColumn, setSelectedColumn ] = useState(null);
	const [ xColData, setXColData ] = useState([]);
	const [ yColData, setYColData ] = useState([]);
	const [ error, setError ] = useState(null);
	const [ performingAnalysis, setPerformingAnalysis ] = useState(false);
	const [ analysisType, setAnalysisType ] = useState(null);
	const { analysisModalOpen } = useSpreadsheetState();
	const { columns, rows, excludedRows, includedRows } = useRowsState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	function handleModalClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
	}

	async function performAnalysis() {
		if (!yColData[0] || !xColData[0]) {
			setError('Please add all required columns and try again');
			return;
		}
		const colX = xColData[0];
		const colY = yColData[0];
		// TODO: refactor all this
		const colA = filterExcludedRows(rows, includedRows, excludedRows, colX);
		const colB = filterExcludedRows(rows, includedRows, excludedRows, colY);
		function makeRows(colA, colB) {
			return rows
				.map((row) => {
					const foundRowA = colA.find((r) => r.rowID === row.id);
					const foundRowB = colB.find((r) => r.rowID === row.id);
					if (foundRowA && foundRowB) {
						return [ foundRowA.value, foundRowB.value, row.id ];
					}
					return null;
				})
				.filter(Boolean);
		}
		const XYCols = makeRows(colA, colB);
		const colXArr = XYCols.map((a) => a[0]);
		const colYArr = XYCols.map((a) => a[1]);

		async function linearRegression() {
			if (colXArr.length >= 10 && colYArr.length >= 10) {
				try {
					setPerformingAnalysis(true);
					const results = await performLinearRegressionAnalysis(colXArr, colYArr, colX, colY, XYCols);
					setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
					setPerformingAnalysis(false);
					handleModalClose();
				} catch (e) {
					console.log(e);
					setPerformingAnalysis(false);
					setError('Something went wrong while performing analysis');
				}
			} else {
				setError('Columns must each contain at least 10 values to perform this analysis.');
				return;
			}
		}
		async function oneway() {
			try {
				setPerformingAnalysis(true);
				const results = await performOnewayAnalysis(colXArr, colYArr, colX, colY, XYCols);
				setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
				setPerformingAnalysis(false);
				handleModalClose();
			} catch (e) {
				console.log(e);
				setPerformingAnalysis(false);
				setError('Something went wrong while performing analysis');
			}
		}

		async function contingency() {
			try {
				setPerformingAnalysis(true);
				const results = await performContingencyAnalysis(colXArr, colYArr, colX, colY, XYCols);
				setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
				setPerformingAnalysis(false);
				handleModalClose();
			} catch (e) {
				console.log(e);
				setPerformingAnalysis(false);
				setError('Something went wrong while performing analysis');
			}
		}

		switch (analysisType) {
			case BIVARIATE: {
				return linearRegression();
			}
			case ONEWAY: {
				return oneway();
			}
			case CONTINGENCY: {
				return contingency();
			}
			default:
				return null;
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
			if (analysisType && analysisType === LOGISTIC) {
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
				title={<DraggableModal children={'Fit Y By X'} />}
				visible={analysisModalOpen}
				width={750}
				bodyStyle={{ background: '#ECECEC', opacity: performingAnalysis ? 0.2 : 1 }}
				footer={[
					<div key="footer-div" style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						<ErrorMessage error={error} setError={setError} />
						<span style={{ alignSelf: 'end' }}>
							<Button disabled={performingAnalysis} key="back" onClick={handleModalClose}>
								Cancel
							</Button>
							<Button
								disabled={
									xColData.length === 0 || yColData.length === 0 || performingAnalysis || analysisType === LOGISTIC
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
						<SelectColumn title="Select Columns" columns={filteredColumns} setSelectedColumn={setSelectedColumn} />
						<VariableLegend yColData={yColData} xColData={xColData} />
					</div>
					<div style={{ width: 400 }}>
						Cast Selected Columns into Roles
						<VariableSelector
							cardText={'Required'}
							data={yColData}
							label="Y, Outcome"
							performingAnalysis={performingAnalysis}
							setData={setYColData}
							selectedColumn={selectedColumn}
							styleProps={{ marginBottom: 20, marginTop: 20 }}
						/>
						<VariableSelector
							cardText={'Required'}
							data={xColData}
							label="X, Factor"
							performingAnalysis={performingAnalysis}
							setData={setXColData}
							selectedColumn={selectedColumn}
						/>
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', height: 30 }}>
					{xColData.length !== 0 &&
					yColData.length !== 0 && (
						<h4 style={{ textAlign: 'right' }}>
							Perform {analysisType} Analysis {analysisType === LOGISTIC && '(Currently unsupported)'}
						</h4>
					)}
				</div>
			</Modal>
		</div>
	);
}
