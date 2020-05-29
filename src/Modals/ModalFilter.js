import React, { useState, useEffect } from 'react';
import { Modal, Select } from 'antd';
import IntegerStep from './IntegerStep';
import AddColumnButton from './AddColumnButton';
import RemoveColumnButton from './RemoveColumnButton';
import { SelectColumn } from './ModalShared';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useSelectState,
	useRowsState,
} from '../context/SpreadsheetProvider';
import {
	FILTER_COLUMN,
	TOGGLE_FILTER_MODAL,
	REMOVE_SELECTED_CELLS,
	SET_FILTERS,
	DELETE_FILTER,
	STRING,
} from '../constants';

export default function AntModal() {
	const [ clickedColumn, setClickedColumn ] = useState(null);

	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const { filterModalOpen } = useSpreadsheetState();
	const { columns, rows } = useRowsState();
	const { filters, selectedColumns } = useSelectState();

	function handleClose() {
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false });
	}

	function handleCancel() {
		dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false });
	}

	function removeColumn(columnID) {
		function deleteFilter() {
			const filtersCopy = { ...filters };
			const newNumberFilters = filtersCopy.numberFilters.filter((numFilter) => columnID !== numFilter.id);
			filtersCopy.numberFilters = newNumberFilters;
			delete filtersCopy.stringFilters[columnID];
			return filtersCopy;
		}
		const filteredColumns = selectedColumns.filter((sel) => sel.id !== columnID);
		dispatchSelectAction({ type: DELETE_FILTER, filters: deleteFilter(), selectedColumns: filteredColumns });
		dispatchSelectAction({ type: FILTER_COLUMN, rows, columns });
	}

	return (
		<div>
			<Modal
				className="ant-modal"
				destroyOnClose
				width={500}
				onCancel={handleCancel}
				onOk={handleClose}
				title={`Data Filter`}
				visible={filterModalOpen}
				style={{ display: 'flex', justifyContent: 'center' }}
			>
				<div style={{ width: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<SelectColumn
						title={'Select Column'}
						columns={columns}
						setSelectedColumn={setClickedColumn}
						style={{ width: '300px' }}
					/>
					<AddColumnButton clickedColumn={clickedColumn} />
					{selectedColumns &&
						selectedColumns.length > 0 &&
						selectedColumns.map(
							(col, i) =>
								col.type === STRING ? (
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
	const { selectedColumns } = useSelectState();
	const { id, colMin, colMax, label, min, max } = column;

	return (
		<div style={{ paddingLeft: 10, paddingBottom: 10, marginBottom: 20, display: 'flex' }}>
			<IntegerStep
				currentMin={min}
				currentMax={max}
				key={id}
				columnID={id}
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
	const dispatchSelectAction = useSelectDispatch();
	const { rows, columns } = useRowsState();
	const [ checkedText, setCheckedText ] = useState();

	useEffect(
		() => {
			dispatchSelectAction({ type: SET_FILTERS, stringFilter: checkedText });
			dispatchSelectAction({ type: FILTER_COLUMN, rows, columns });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ checkedText ],
	);
	const { id, label } = column;
	const uniqueColumnValues = [ ...new Set(rows.map((row) => row[id])) ].filter((x) => x);
	const { Option } = Select;
	function handleChange(text) {
		setCheckedText({ [id]: text });
	}
	return (
		<div style={{ marginBottom: 20, paddingBottom: 30, paddingLeft: 10, textAlign: 'center' }}>
			{label} ({uniqueColumnValues.length})
			<div style={{ display: 'flex' }}>
				<Select mode="multiple" style={{ width: 400 }} placeholder="Please select" onChange={handleChange}>
					{uniqueColumnValues.map((text) => (
						<Option style={{ width: 400 }} key={text}>
							{text}
						</Option>
					))}
				</Select>
				<RemoveColumnButton removeColumn={() => removeColumn(id)} />
			</div>
		</div>
	);
}
