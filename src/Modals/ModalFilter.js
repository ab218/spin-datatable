import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from 'antd';
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
	STRING,
	SET_SELECTED_COLUMN,
} from '../constants';

export default function AntModal() {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const { filterModalOpen } = useSpreadsheetState();
	const { columns, filters } = useRowsState();
	const { selectedColumns } = useSelectState();
	const [ filterName, setFilterName ] = useState('');
	const [ saveModalVisible, setSaveModalVisible ] = useState(false);

	function handleClose() {
		dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
		dispatchRowsAction({
			type: DELETE_FILTER,
			filters: { numberFilters: [], stringFilters: [] },
		});
		dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: [] });
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false });
	}

	function handleSaveOk() {
		dispatchRowsAction({ type: 'SAVE_FILTER', filters, filterName });
		dispatchRowsAction({
			type: DELETE_FILTER,
			filters: { numberFilters: [], stringFilters: [] },
		});
		setSaveModalVisible(false);
		dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: [] });
		dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: false });
	}

	function handleSaveCancel() {
		setSaveModalVisible(false);
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
		<div key="footer-div" style={{ width: '100%', height: 40, display: 'flex', justifyContent: 'space-between' }}>
			<span style={{ display: 'flex' }}>
				{/* <Checkbox checked={selectRows} onChange={() => setSelectRows((prev) => !prev)}>
					Select
				</Checkbox>
				<Checkbox checked={includeRows} onChange={() => setIncludeRows((prev) => !prev)}>
					Include
				</Checkbox> */}
			</span>
			<span>
				<Button onClick={(e) => setSaveModalVisible(true)} key="save" type="primary">
					Save
				</Button>
			</span>
		</div>
	);

	return (
		<Modal
			className="ant-modal"
			width={800}
			onCancel={handleClose}
			title={`Data Filter`}
			visible={filterModalOpen}
			bodyStyle={{ maxHeight: 300 }}
			footer={<ModalFooter />}
		>
			<Modal title="Save Filter As..." visible={saveModalVisible} onOk={handleSaveOk} onCancel={handleSaveCancel}>
				<Input
					style={{ width: '100%' }}
					maxLength={100}
					value={filterName}
					onChange={(e) => setFilterName(e.target.value)}
				/>
			</Modal>
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
	const dispatchRowsAction = useRowsDispatch();
	const { rows, columns } = useRowsState();
	const [ checkedText, setCheckedText ] = useState();

	useEffect(
		() => {
			dispatchRowsAction({ type: SET_FILTERS, stringFilter: checkedText });
			dispatchRowsAction({ type: FILTER_COLUMN, rows, columns });
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
