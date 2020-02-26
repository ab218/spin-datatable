import React, { useState, useEffect } from 'react';
import { Modal, Select } from 'antd';
import IntegerStep from './IntegerStep';
import AddColumnButton from './AddColumnButton';
import RemoveColumnButton from './RemoveColumnButton';
import { SelectColumn } from './ModalShared';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import {
	FILTER_COLUMN,
	TOGGLE_FILTER_MODAL,
	REMOVE_SELECTED_CELLS,
	SET_FILTERS,
	SET_SELECTED_COLUMN,
} from './constants';

export default function AntModal() {
	const [ clickedColumn, setClickedColumn ] = useState(null);

	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { filterModalOpen, columns, selectedColumns } = useSpreadsheetState();

	function handleClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false, selectedColumns: [] });
	}

	function handleCancel() {
		dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false, selectedColumns: [] });
	}

	function removeColumn(columnId) {
		const filteredColumns = selectedColumns.filter((sel) => sel.id !== columnId);
		dispatchSpreadsheetAction({ type: SET_SELECTED_COLUMN, selectedColumns: filteredColumns });
	}

	return (
		<div>
			<Modal
				className="ant-modal"
				destroyOnClose
				onCancel={handleCancel}
				onOk={handleClose}
				title={`Data Filter`}
				visible={filterModalOpen}
				style={{ display: 'flex', justifyContent: 'center' }}
			>
				<div style={{ width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<SelectColumn columns={columns} setSelectedColumn={setClickedColumn} style={{ width: '300px' }} />
					<AddColumnButton clickedColumn={clickedColumn} />
					{selectedColumns &&
						selectedColumns.length > 0 &&
						selectedColumns.map(
							(col, i) =>
								col.type === 'String' ? (
									<FilterColumnPicker removeColumn={removeColumn} key={i} column={col} />
								) : (
									<FilterColumnSlider removeColumn={removeColumn} key={i} column={col} />
								),
						)}
				</div>
			</Modal>
		</div>
	);
}

function FilterColumnSlider({ column, removeColumn }) {
	const { selectedColumns } = useSpreadsheetState();
	const { id, colMin, colMax, label, min, max } = column;

	return (
		<div style={{ paddingLeft: 10, paddingBottom: 10, marginBottom: 20, display: 'flex' }}>
			<IntegerStep
				currentMin={min}
				currentMax={max}
				key={id}
				columnId={id}
				label={label}
				colMin={colMin}
				colMax={colMax}
				selectedColumns={selectedColumns}
			/>
			<RemoveColumnButton removeColumn={() => removeColumn(id)} />
		</div>
	);
}

function FilterColumnPicker({ column, removeColumn }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { rows } = useSpreadsheetState();
	const [ checkedText, setCheckedText ] = useState([]);

	useEffect(
		() => {
			dispatchSpreadsheetAction({ type: SET_FILTERS, stringFilter: checkedText });
			dispatchSpreadsheetAction({ type: FILTER_COLUMN });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ checkedText ],
	);
	const { id } = column;
	const uniqueColumnValues = [ ...new Set(rows.map((row) => row[id])) ].filter((x) => x);
	const { Option } = Select;
	function handleChange(text) {
		setCheckedText({ [column.id]: text });
	}
	return (
		<div style={{ marginBottom: 20, paddingBottom: 30, paddingLeft: 10, textAlign: 'center' }}>
			{column.label} ({uniqueColumnValues.length})
			<div style={{ display: 'flex' }}>
				<Select mode="multiple" style={{ width: 300 }} placeholder="Please select" onChange={handleChange}>
					{uniqueColumnValues.map((text) => (
						<Option style={{ width: 300 }} key={text}>
							{text}
						</Option>
					))}
				</Select>
				<RemoveColumnButton removeColumn={() => removeColumn(id)} />
			</div>
		</div>
	);
}
