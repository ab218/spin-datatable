import React, { useEffect, useState } from 'react';
import katex from 'katex';
import nerdamer from 'nerdamer';
import { Button, Icon, Input, Modal } from 'antd';
import { SelectColumn } from './ModalShared';
import Dropdown from './Dropdown';
import ErrorMessage from './ErrorMessage';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useRowsDispatch,
	useRowsState,
} from '../context/SpreadsheetProvider';
import {
	CLOSE_COLUMN_TYPE_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	UPDATE_COLUMN,
	NUMBER,
	STRING,
	FORMULA,
	CONTINUOUS,
	ORDINAL,
	NOMINAL,
} from '../constants';

export default function AntModal({ selectedColumn }) {
	const dispatchRowsAction = useRowsDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { columnTypeModalOpen } = useSpreadsheetState();
	const { columns, rows, modalError } = useRowsState();
	const { formula, description, label, modelingType, type, units } = selectedColumn;
	const formulaFromState = formula && formula.expression;
	const [ columnFormula, setColumnFormula ] = useState(swapIDsWithLabels(formulaFromState, columns) || '');
	const [ selectedFormulaVariable, setSelectedFormulaVariable ] = useState(null);
	const [ loaded, setLoaded ] = useState(false);
	const [ formulaError, setFormulaError ] = useState(null);
	const [ columnName, setColumnName ] = useState(label);
	const [ columnType, setColumnType ] = useState(type);
	const [ columnUnits, setColumnUnits ] = useState(units);
	const [ columnDescription, setColumnDescription ] = useState(description);
	const [ columnModelingType, setColumnModelingType ] = useState(modelingType);
	const [ error, setError ] = useState(null);

	function checkIfValidFormula(formula, columns) {
		if (!formula) return undefined;
		let formulaWithIDs = '';
		columns.forEach((col) => {
			if (formula.includes(col.label)) {
				formulaWithIDs = formulaWithIDs
					? formulaWithIDs.split(col.label).join(' ')
					: formula.split(col.label).join(' ');
			}
		});
		const containsLetters = (input) => /[A-Za-z]/.test(input);
		return containsLetters(formulaWithIDs || formula);
	}

	function swapLabelsWithIDs(formula, columns) {
		if (!formula) return undefined;
		let formulaWithIDs = '';
		const IDsSet = new Set();
		columns.forEach((col) => {
			if (formula.includes(col.label)) {
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
			if (formula.includes(col.id)) {
				formulaWithLabels = formulaWithLabels
					? formulaWithLabels.split(col.id).join(col.label)
					: formula.split(col.id).join(col.label);
			}
		});
		return formulaWithLabels || formula;
	}

	useEffect(
		() => {
			if (modalError) {
				return setError(modalError);
			}
		},
		[ modalError ],
	);

	// close modal if column is updated by checking if columns has changed
	useEffect(
		() => {
			return () => dispatchSpreadsheetAction({ type: CLOSE_COLUMN_TYPE_MODAL });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ columns ],
	);

	function handleClose() {
		const lettersAndSpacesOnlyReg = /^[0-9a-zA-Z\s]*$/;
		if (!columnName) {
			return setError('Column Name cannot be blank');
		}
		if (!lettersAndSpacesOnlyReg.test(columnName)) {
			return setError('Column Name must contain only letters, spaces and numbers');
		}
		if (!columnName[0].match(/[a-z]/i)) {
			return setError('Column Name must begin with a letter');
		}
		if (validateColumnName(columnName)) {
			return setError('Column Name must be unique');
		}
		if (columnFormula && formulaError) {
			return setError('Invalid formula entered');
		}
		dispatchRowsAction({
			type: UPDATE_COLUMN,
			updatedColumn: {
				label: columnName,
				units: columnUnits,
				modelingType: columnModelingType,
				type: columnType,
				formula: columnType === FORMULA ? swapLabelsWithIDs(columnFormula, columns) : null,
				id: selectedColumn.id,
				description: columnDescription,
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
			if (columnType === STRING && columnModelingType === CONTINUOUS) {
				setColumnModelingType(NOMINAL);
			}
		},
		[ columnModelingType, columnType ],
	);

	useEffect(
		() => {
			function renderFormula(formula) {
				const symExp = document.getElementById('symbolic-expression');
				try {
					const nerdLatex = nerdamer.convertToLaTeX(formula);
					katex.render(nerdLatex, symExp, {
						throwOnError: false,
					});
					nerdamer(formula);
					setFormulaError(false);
					if (checkIfValidFormula(columnFormula, columns)) {
						setFormulaError(true);
					}
					return;
				} catch (e) {
					console.log('FORMULA ERROR: ', e);
					setFormulaError(true);
				}
			}
			if (loaded && columnType === FORMULA && columnFormula) {
				renderFormula(formatInput(columnFormula));
			}
		},
		[ columnFormula, columnType, columns, loaded ],
	);

	function validateColumnName(columnName) {
		// Remove current column from columns pool, so that if a user wants to give the column the same name then it won't throw an error
		const filteredColumns = columns.filter((col) => col.id !== selectedColumn.id);
		const lowerCaseColumnNames = filteredColumns.map((col) => col.label.toLowerCase());
		return lowerCaseColumnNames.includes(columnName.toLowerCase());
	}

	function addTextToInput(text) {
		setColumnFormula((prev) => prev + text);
		document.getElementById('formula-input').focus();
	}

	function addBracketsToInput() {
		setColumnFormula((prev) => '(' + prev + ')');
		document.getElementById('formula-input').focus();
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
					<div key="footer-div" style={{ height: 40, display: 'flex', justifyContent: 'space-between' }}>
						<ErrorMessage error={error} setError={setError} />
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
						menuItems={[ NUMBER, STRING, FORMULA ]}
						setColumnType={setColumnType}
						columnType={columnType}
					/>
				</span>
				<span className="modal-span">
					<h4>Scale</h4>
					<Dropdown
						modelingTypeIcons={true}
						disabledType={columnType === STRING ? CONTINUOUS : ''}
						menuItems={[ CONTINUOUS, ORDINAL, NOMINAL ]}
						setColumnType={setColumnModelingType}
						columnType={columnModelingType}
					/>
				</span>
				<span className="modal-span">
					<h4>
						Notes <span style={{ fontStyle: 'italic', opacity: 0.4 }}>(Optional)</span>
					</h4>
					<Input.TextArea
						value={columnDescription}
						onChange={(e) => setColumnDescription(e.target.value)}
						style={{
							resize: 'none',
							userSelect: 'none',
							marginTop: 0,
							width: 300,
							height: 100,
							border: '1px solid blue',
						}}
					/>
				</span>
				{columnType === FORMULA && (
					<div>
						{rows.length > 0 ? (
							<div>
								<h3 style={{ textAlign: 'center', margin: 30 }}>Formula Editor</h3>
								<div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
									<span style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-end' }}>
										<FormulaButtons addTextToInput={addTextToInput} addBracketsToInput={addBracketsToInput} />
										<div style={{ display: 'flex' }}>
											<SelectColumn
												errorMessage={'There must at least two columns and one row'}
												styleProps={{ width: 200 }}
												columns={columns.filter((column) => column.id !== selectedColumn.id)}
												setSelectedColumn={setSelectedFormulaVariable}
											/>
											<div style={{ margin: 'auto 10px' }}>
												<Button
													onClick={(e) => {
														if (selectedFormulaVariable) {
															addTextToInput(selectedFormulaVariable.label);
														}
													}}
												>
													<Icon type="right" />
												</Button>
											</div>
										</div>
									</span>
									<SymbolicExpressionEditor
										formulaError={formulaError}
										columnFormula={columnFormula}
										setColumnFormula={setColumnFormula}
									/>
								</div>
							</div>
						) : (
							<div style={{ color: 'red' }}>There must be at least 1 row</div>
						)}
					</div>
				)}
			</Modal>
		</div>
	);
}

function SymbolicExpressionEditor({ formulaError, columnFormula, setColumnFormula }) {
	return (
		<div
			style={{
				overflow: 'scroll',
				height: 200,
				width: 300,
				display: 'flex',
				alignItems: 'center',
				flexDirection: 'column',
			}}
		>
			<div
				style={{
					textAlign: 'center',
					fontSize: '20px',
					margin: '10px',
					height: 75,
					color: formulaError ? 'red' : 'black',
				}}
				id="symbolic-expression"
			>
				{columnFormula ? '' : 'Enter Formula Below'}
			</div>
			<Input.TextArea
				allowClear
				rows={3}
				id="formula-input"
				value={columnFormula}
				onChange={(e) => setColumnFormula(e.target.value)}
				style={{ resize: 'none', userSelect: 'none', marginTop: 0, width: 200, height: 100, border: '1px solid blue' }}
			/>
		</div>
	);
}

function FormulaButtons({ addTextToInput, addBracketsToInput }) {
	function FormulaButton({ buttonText }) {
		return (
			<span style={{ margin: 'auto 5px' }}>
				<Button
					onClick={() => {
						addTextToInput(buttonText);
					}}
				>
					{buttonText}
				</Button>
			</span>
		);
	}
	return (
		<div>
			<FormulaButton buttonText={'+'} />
			<FormulaButton buttonText={'-'} />
			<FormulaButton buttonText={'*'} />
			<FormulaButton buttonText={'/'} />
			<span style={{ margin: 'auto 5px' }}>
				<Button
					onClick={() => {
						addBracketsToInput();
					}}
				>
					{`( )`}
				</Button>
			</span>
		</div>
	);
}
