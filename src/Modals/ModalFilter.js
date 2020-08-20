import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from 'antd';
import ErrorMessage from './ErrorMessage';
import IntegerStep from './IntegerStep';
import AddColumnButton from './AddColumnButton';
import RemoveColumnButton from './RemoveColumnButton';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useSelectState,
	useRowsState,
	useRowsDispatch,
} from '../context/SpreadsheetProvider';
import {
	FILTER_COLUMN,
	TOGGLE_FILTER_MODAL,
	REMOVE_SELECTED_CELLS,
	SET_FILTERS,
	DELETE_FILTER,
	SAVE_FILTER,
	SET_SELECTED_COLUMN,
	STRING,
} from '../constants';

const FilterModal = React.memo(function AntModal() {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const { filterModalOpen } = useSpreadsheetState();
	const { columns, filters, filteredRowIDs, savedFilters } = useRowsState();
	const { selectedColumns } = useSelectState();
	const defaultFilterName = 'Data Filter';
	const [ filterName, setFilterName ] = useState(defaultFilterName);
	const [ error, setError ] = useState('');

	useEffect(
		() => {
			if (Object.keys(filters.stringFilters).length || filters.numberFilters.length) {
				let template = '';
				filters.numberFilters.forEach((numberFilter, i) => {
					if (numberFilter.min && numberFilter.max) {
						template += `${numberFilter.min} ≤ ${numberFilter.label} ≤ ${numberFilter.max}`;
					}
					if (i !== filters.numberFilters.length - 1) {
						template += ` & `;
					}
				});
				setFilterName(template);
			}
		},
		[ filters ],
	);

	function handleClose() {
		dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
		dispatchRowsAction({
			type: DELETE_FILTER,
			filters: { numberFilters: [], stringFilters: {} },
		});
		dispatchRowsAction({ type: 'REMOVE_FILTERED_ROWS' });
		dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: [] });
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false });
	}

	function handleSaveOk() {
		if (selectedColumns.length === 0) {
			return setError('You must select at least one column.');
		}
		if (filters.numberFilters.length === 0 && Object.keys(filters.stringFilters).length === 0) {
			return setError('You must create at least one condition for your filter.');
		}
		if (filterName === '') {
			return setError('Filter name cannot be blank.');
		}
		if (savedFilters.findIndex((filter) => filterName === filter.filterName) !== -1) {
			return setError('Filter name is already in use. Please choose a unique name.');
		}
		dispatchRowsAction({ type: SAVE_FILTER, filters, filterName });
		dispatchRowsAction({
			type: DELETE_FILTER,
			filters: { numberFilters: [], stringFilters: {} },
		});
		dispatchRowsAction({ type: 'REMOVE_FILTERED_ROWS' });
		dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: [] });
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
		dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: filteredColumns });
		dispatchRowsAction({ type: DELETE_FILTER, filters: deleteFilter() });
		dispatchRowsAction({ type: FILTER_COLUMN });
	}

	const ModalFooter = () => (
		<div>
			<div key="footer-div" style={{ width: '100%', height: 40, display: 'flex', justifyContent: 'space-between' }}>
				<span style={{ display: 'flex', width: '33%' }}>{filteredRowIDs.length} selected.</span>
				<span style={{ display: 'flex', width: '67%' }}>
					<Input
						style={{ width: '100%', marginRight: '10px' }}
						maxLength={100}
						defaultValue={filterName}
						onBlur={(e) => {
							setFilterName(e.target.value);
						}}
						onPressEnter={(e) => {
							setFilterName(e.target.value);
						}}
					/>
					<Button onClick={handleSaveOk} key="save" type="primary">
						Save
					</Button>
				</span>
			</div>
			<div style={{ height: '40px', textAlign: 'center' }}>
				<ErrorMessage error={error} setError={setError} />
			</div>
		</div>
	);

	return (
		<Modal
			className="ant-modal"
			width={800}
			onCancel={handleClose}
			title={filterName || 'Data Filter'}
			visible={filterModalOpen}
			bodyStyle={{ maxHeight: 300 }}
			footer={<ModalFooter />}
		>
			<div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
				<div style={{ width: '20%', height: 250, overflowY: 'scroll' }}>
					{columns.map((column) => <AddColumnButton key={column.id} column={column} />)}
				</div>
				<div style={{ width: '60%', height: 250, overflowY: 'scroll' }}>
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
			</div>
		</Modal>
	);
});

const FilterColumnSlider = React.memo(function FilterColumnSlider({ column, removeColumn }) {
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
});

const FilterColumnPicker = React.memo(function FilterColumnPicker({ column, removeColumn }) {
	const dispatchRowsAction = useRowsDispatch();
	const { rows, filters } = useRowsState();
	const { selectedColumns } = useSelectState();
	const { id, label } = column;
	const [ checkedText, setCheckedText ] = useState(filters.stringFilters);

	useEffect(
		() => {
			dispatchRowsAction({ type: SET_FILTERS, selectedColumns, stringFilters: checkedText });
			dispatchRowsAction({ type: FILTER_COLUMN });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ checkedText ],
	);
	const uniqueColumnValues = [ ...new Set(rows.map((row) => row[id])) ].filter((x) => x);
	const { Option } = Select;
	function handleChange(text) {
		setCheckedText({ [id]: text });
	}
	return (
		<div style={{ marginBottom: 20, paddingBottom: 30, paddingLeft: 10, textAlign: 'center' }}>
			{label} ({uniqueColumnValues.length})
			<div style={{ display: 'flex' }}>
				<Select
					mode="multiple"
					style={{ width: 400 }}
					placeholder="Please select"
					value={checkedText && checkedText[id]}
					onChange={handleChange}
				>
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
});

export default FilterModal;
