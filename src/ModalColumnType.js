import React, { useEffect, useState } from 'react';
import katex from 'katex';
import nerdamer from 'nerdamer';
import { Alert, Button, Icon, Input, Modal } from 'antd';
import { SelectColumn } from './ModalShared';
import Dropdown from './Dropdown';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, UPDATE_COLUMN } from './constants';

export default function AntModal({ selectedColumn }) {
	const [ columnFormula, setColumnFormula ] = useState(selectedColumn.formula || '');
	const [ selectedFormulaVariable, setSelectedFormulaVariable ] = useState(null);
	const [ error, setError ] = useState(null);
	const [ formulaError, setFormulaError ] = useState(null);
	const [ columnName, setColumnName ] = useState(selectedColumn.label);
	const [ columnType, setColumnType ] = useState(selectedColumn.type);
	const [ columnModelingType, setColumnModelingType ] = useState(selectedColumn.modelingType);
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { columns, columnTypeModalOpen, rows } = useSpreadsheetState();

	function handleClose(cancel) {
		if (!cancel) {
			if (!columnName) {
				return setError('Column Name cannot be blank');
			}
			if (!columnName[0].toLowerCase().match(/[a-z]/i)) {
				return setError('Column Name must begin with a letter');
			}
			if (validateColumnName(columnName)) {
				return setError('Column Name must be unique');
			}
			if (columnFormula && formulaError) {
				return setError('Invalid formula entered');
			}
			if (columnType === 'Formula') {
				dispatchSpreadsheetAction({ type: 'UPDATE_ROWS', rows: updateColumn(selectedColumn.id) });
			}
			dispatchSpreadsheetAction({
				type: UPDATE_COLUMN,
				updatedColumn: {
					label: columnName,
					modelingType: columnModelingType,
					type: columnType,
					formula: columnFormula,
					id: selectedColumn.id,
				},
			});
		}
		dispatchSpreadsheetAction({ type: TOGGLE_COLUMN_TYPE_MODAL, modalOpen: false, selectedColumn: null });
	}

	function formatInput(formula) {
		return formula.split(' ').join('');

		// .replace(/[[\]']+/g, '');
	}

	function updateColumn(columnID) {
		const newMappedValues = evaluateColumn(columnFormula);
		const newRows = [ ...rows ];
		if (newMappedValues) {
			for (let i = 0; i < newRows.length; i++) {
				newRows[i][columnID] = newMappedValues[i];
			}
		}
		return newRows;
	}
	function evaluateColumn(formula) {
		const mappedExpessions = swapIDsForValues(formula);
		try {
			return mappedExpessions.map((expression) => {
				return nerdamer(expression).text('decimals');
			});
		} catch (e) {
			console.log(e);
		}
	}

	function swapIDsForValues(formula) {
		const formulaWithIDs = swapLabelsForIDs(formula);
		const mappedExpressions = [];
		rows.forEach((row) => {
			let currentExpression = '';
			Object.keys(row).forEach((rowKey) => {
				if (currentExpression.includes(rowKey) || formulaWithIDs.includes(rowKey)) {
					currentExpression = currentExpression
						? currentExpression.split(rowKey).join(row[rowKey])
						: formulaWithIDs.split(rowKey).join(row[rowKey]);
				}
			});
			mappedExpressions.push(currentExpression || formulaWithIDs);
		});
		return mappedExpressions;
	}

	function swapLabelsForIDs(formula) {
		let formulaWithIDs = '';
		columns.forEach((col) => {
			if (formulaWithIDs.includes(col.label) || formula.includes(col.label)) {
				formulaWithIDs = formulaWithIDs
					? formulaWithIDs.split(col.label).join(col.id)
					: formula.split(col.label).join(col.id);
			}
		});
		return formulaWithIDs || formula;
	}

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
					setFormulaError(true);
				}
			}
			if (columnFormula) {
				renderFormula(formatInput(columnFormula));
			}
		},
		[ columnFormula ],
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

	// function displayColumnFormula(columnFormula) {
	// 	const returnArr = [];
	// 	columnFormula.forEach((el) => {
	// 		if (typeof el === 'object') {
	// 			console.log(el);
	// 			returnArr.push(
	// 				<Tag closable color="red">
	// 					{el.label}
	// 				</Tag>,
	// 			);
	// 		}
	// 		if (typeof el === 'string') {
	// 			returnArr.push(el);
	// 		}
	// 	});
	// 	return returnArr;
	// }

	return (
		<div>
			<Modal
				width={700}
				className="ant-modal"
				destroyOnClose
				onCancel={() => handleClose(true)}
				title={columnName || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>{`<Blank>`}</span>}
				visible={columnTypeModalOpen}
				footer={[
					<div style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						{error ? <Alert className="fade-in-animated" message={error} type="error" showIcon /> : <div />}
						<span style={{ alignSelf: 'end' }}>
							<Button key="back" onClick={() => handleClose(true)}>
								Cancel
							</Button>
							<Button key="submit" type="primary" onClick={() => handleClose(false)}>
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
