import React, { useEffect, useState } from 'react';
import katex from 'katex';
import nerdamer from 'nerdamer';
import { Alert, Button, Icon, Input, Modal } from 'antd';
import { SelectColumn } from './ModalShared';
import Dropdown from './Dropdown';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, UPDATE_COLUMN } from './constants';

export default function AntModal({ selectedColumn }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { columns, columnTypeModalOpen, modalError } = useSpreadsheetState();
	const { formula, label, modelingType, type, units } = selectedColumn;
	const formulaFromState = formula && formula.expression;
	const [ columnFormula, setColumnFormula ] = useState(swapIDsWithLabels(formulaFromState, columns) || '');
	const [ selectedFormulaVariable, setSelectedFormulaVariable ] = useState(null);
	const [ loaded, setLoaded ] = useState(false);
	const [ formulaError, setFormulaError ] = useState(null);
	const [ columnName, setColumnName ] = useState(label);
	const [ columnType, setColumnType ] = useState(type);
	const [ columnUnits, setColumnUnits ] = useState(units);
	const [ columnModelingType, setColumnModelingType ] = useState(modelingType);

	function setModalError(modalError) {
		dispatchSpreadsheetAction({ type: 'SET_MODAL_ERROR', modalError });
	}

	function swapLabelsWithIDs(formula, columns) {
		if (!formula) return undefined;
		let formulaWithIDs = '';
		const IDsSet = new Set();
		columns.forEach((col) => {
			if (formulaWithIDs.includes(col.label) || formula.includes(col.label)) {
				IDsSet.add(col.id);
				formulaWithIDs = formulaWithIDs
					? formulaWithIDs.split(col.label).join(col.id)
					: formula.split(col.label).join(col.id);
			}
		});
		return { expression: formulaWithIDs || formula, IDs: [ ...IDsSet ] };
	}

	function swapIDsWithLabels(formula, columns) {
		if (!formula) return undefined;
		let formulaWithLabels = '';
		columns.forEach((col) => {
			if (formulaWithLabels.includes(col.id) || formula.includes(col.id)) {
				formulaWithLabels = formulaWithLabels
					? formulaWithLabels.split(col.id).join(col.label)
					: formula.split(col.id).join(col.label);
			}
		});
		return formulaWithLabels || formula;
	}

	function handleClose() {
		if (!columnName) {
			return setModalError('Column Name cannot be blank');
		}
		if (!columnName[0].toLowerCase().match(/[a-z]/i)) {
			return setModalError('Column Name must begin with a letter');
		}
		if (validateColumnName(columnName)) {
			return setModalError('Column Name must be unique');
		}
		if (columnFormula && formulaError) {
			return setModalError('Invalid formula entered');
		}
		dispatchSpreadsheetAction({
			type: UPDATE_COLUMN,
			updatedColumn: {
				label: columnName,
				modelingType: columnModelingType,
				type: columnType,
				formula: swapLabelsWithIDs(columnFormula, columns),
				id: selectedColumn.id,
			},
		});
	}

	function formatInput(formula) {
		return formula.split(' ').join('');

		// .replace(/[[\]']+/g, '');
	}

	// hacky way to call renderFormula on component mount
	useEffect(() => setLoaded(true), []);

	useEffect(
		() => {
			function renderFormula(formula) {
				const symExp = document.getElementById('symbolic-expression');
				try {
					const nerd = nerdamer.convertToLaTeX(formula);
					katex.render(nerd, symExp, {
						throwOnError: false,
					});
					setFormulaError(false);
					return;
				} catch (e) {
					console.log('FORMULA ERROR: ', e);
					setFormulaError(true);
				}
			}
			if (columnFormula) {
				renderFormula(formatInput(columnFormula));
			}
		},
		[ columnFormula, loaded ],
	);

	function validateColumnName(columnName) {
		// Remove current column from columns pool, so that if a user wants to give the column the same name then it won't throw an error
		const filteredColumns = columns.filter((col) => col.id !== selectedColumn.id);
		const lowerCaseColumnNames = filteredColumns.map((col) => col.label.toLowerCase());
		return lowerCaseColumnNames.includes(columnName.toLowerCase());
	}

	function addVariableToInput(column) {
		setColumnFormula((prev) => prev + column.label);
	}

	return (
		<div>
			<Modal
				width={700}
				className="ant-modal"
				destroyOnClose
				onCancel={() =>
					dispatchSpreadsheetAction({ type: TOGGLE_COLUMN_TYPE_MODAL, modalOpen: false, selectedColumn: null })}
				title={columnName || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>{`<Blank>`}</span>}
				visible={columnTypeModalOpen}
				footer={[
					<div style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						{modalError ? <Alert className="fade-in-animated" message={modalError} type="error" showIcon /> : <div />}
						<span style={{ alignSelf: 'end' }}>
							<Button
								key="back"
								onClick={() =>
									dispatchSpreadsheetAction({ type: TOGGLE_COLUMN_TYPE_MODAL, modalOpen: false, selectedColumn: null })}
							>
								Cancel
							</Button>
							<Button key="submit" type="primary" onClick={handleClose}>
								Submit
							</Button>
						</span>
					</div>,
				]}
			>
				<span className="modal-span">
					<h4>Column Name</h4>
					<Input
						style={{ width: 200 }}
						maxLength={20}
						value={columnName}
						onChange={(e) => setColumnName(e.target.value)}
					/>
				</span>
				<span className="modal-span">
					<h4>
						Units <span style={{ fontStyle: 'italic', opacity: 0.4 }}>(Optional)</span>
					</h4>
					<Input
						style={{ width: 75 }}
						maxLength={20}
						value={columnUnits}
						onChange={(e) => setColumnUnits(e.target.value)}
					/>
				</span>
				<span className="modal-span">
					<h4>Type</h4>
					<Dropdown
						modelingTypeIcons={false}
						menuItems={[ 'Number', 'String', 'Formula' ]}
						setColumnType={setColumnType}
						columnType={columnType}
					/>
				</span>
				<span className="modal-span">
					<h4>Modeling Type</h4>
					<Dropdown
						modelingTypeIcons={true}
						menuItems={[ 'Continuous', 'Ordinal', 'Nominal' ]}
						setColumnType={setColumnModelingType}
						columnType={columnModelingType}
					/>
				</span>
				{columnType === 'Formula' && (
					<div>
						<span className="modal-span">
							<h4>Formula</h4>
							<Input.TextArea
								rows={3}
								id="formula"
								value={columnFormula}
								onChange={(e) => setColumnFormula(e.target.value)}
								style={{ userSelect: 'none', width: 200, border: '1px solid blue' }}
							/>
						</span>
						{/* <div style={{ height: 30, display: 'flex', justifyContent: 'flex-end' }}>
							{formulaInputOpen && (
								<Input
									style={{ width: 200 }}
									onChange={(e) => setFormulaInput(e.target.value)}
									value={formulaInput}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											setColumnFormula((prev) => prev.concat(formulaInput));
											setFormulaInput('');
											setFormulaInputOpen(false);
										}
									}}
								/>
							)}
						</div> */}
						{/* <span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								+
							</Button>
						</span>
						<span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								-
							</Button>
						</span>
						<span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								*
							</Button>
						</span>
						<span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								/
							</Button>
						</span>
						<span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								(
							</Button>
						</span>
						<span style={{ margin: 'auto 10px' }}>
							<Button
								onClick={(e) => {
									console.log(e);
								}}
							>
								)
							</Button>
						</span> */}
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ display: 'flex' }}>
								<SelectColumn
									styleProps={{ width: 200 }}
									columns={columns.filter((column) => column.id !== selectedColumn.id)}
									setSelectedColumn={setSelectedFormulaVariable}
								/>
								<div style={{ margin: 'auto 10px' }}>
									<Button
										onClick={() => {
											if (selectedFormulaVariable) {
												addVariableToInput(selectedFormulaVariable);
											}
										}}
									>
										<Icon type="right" />
									</Button>
								</div>
							</span>
							{columnFormula && (
								<div
									style={{ overflow: 'scroll', margin: 'auto', color: formulaError ? 'red' : 'black' }}
									id="symbolic-expression"
								/>
							)}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
