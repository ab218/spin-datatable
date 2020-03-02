import React, { useState } from 'react';
import { Button, Input, Modal } from 'antd';
import Dropdown from './Dropdown';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, UPDATE_COLUMN } from './constants';

export default function AntModal({ selectedColumn }) {
	const [ error, setError ] = useState(null);
	const [ columnName, setColumnName ] = useState(selectedColumn.label);
	const [ columnType, setColumnType ] = useState(selectedColumn.type);
	const [ columnModelingType, setColumnModelingType ] = useState(selectedColumn.modelingType);
	const [ columnFormula, setColumnFormula ] = useState(selectedColumn.formula);
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { columns, columnTypeModalOpen } = useSpreadsheetState();

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

	function translateIDToLabel(formula) {
		if (!formula) return;
		return columns.filter((someColumn) => formula.includes(someColumn.id)).reduce((changedFormula, someColumn) => {
			return changedFormula.replace(new RegExp(`\\b${someColumn.id}\\b`, 'g'), `${someColumn.label}`);
		}, formula);
	}

	const validateColumnName = (columnName) => {
		// Remove current column from columns pool, so that if a user wants to give the column the same name then it won't throw an error
		const filteredColumns = columns.filter((col) => col.id !== selectedColumn.id);
		const lowerCaseColumnNames = filteredColumns.map((col) => col.label.toLowerCase());
		return lowerCaseColumnNames.includes(columnName.toLowerCase());
	};

	return (
		<div>
			<Modal
				className="ant-modal"
				destroyOnClose
				onCancel={() => handleClose(true)}
				title={columnName || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>{`<Blank>`}</span>}
				visible={columnTypeModalOpen}
				footer={[
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<span style={{ color: 'red' }}>{error}</span>
						<span>
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
					<span className="modal-span">
						<h4>Formula</h4>
						<Input
							style={{ width: 200 }}
							value={translateIDToLabel(columnFormula)}
							onChange={(e) => setColumnFormula(e.target.value)}
						/>
					</span>
				)}
			</Modal>
		</div>
	);
}
