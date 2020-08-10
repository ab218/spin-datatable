/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Divider, Input, Checkbox } from 'antd';
import { FILTER_SELECT_ROWS, SELECT_COLUMN, REMOVE_SELECTED_CELLS, SET_TABLE_NAME } from './constants';
import {
	useSelectDispatch,
	useRowsState,
	useRowsDispatch,
	useSpreadsheetDispatch,
} from './context/SpreadsheetProvider';
import { createModelingTypeIcon } from './Modals/ModalShared';

export default React.memo(function Sidebar() {
	const { columns, rows, excludedRows, dataTableName, savedFilters, filteredRows } = useRowsState();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const [ filterClicked, setFilterClicked ] = useState(false);
	function filterOnclick(filter) {
		const { includeRows, selectRows, selectedColumns, stringFilter, numberFilters } = filter;
		setFilterClicked((prev) => !prev);
		dispatchRowsAction({
			type: 'SET_FILTERS',
			selectedColumns,
			stringFilter,
			numberFilters,
			includeRows,
			selectRows,
		});
		dispatchRowsAction({ type: 'FILTER_COLUMN', rows, columns });
	}

	useEffect(
		() => {
			dispatchSelectAction({ type: FILTER_SELECT_ROWS, filteredRows });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ filteredRows ],
	);

	return (
		<div
			style={{
				height: '100%',
				width: '95%',
			}}
		>
			<Input
				style={{ borderLeft: 'none', borderTop: 'none', borderRight: 'none', borderRadius: 0 }}
				size="large"
				placeholder="Untitled Data Table"
				defaultValue={dataTableName}
				onClick={(e) => {
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.target.blur();
					}
				}}
				onBlur={(e) => {
					dispatchRowsAction({ type: SET_TABLE_NAME, dataTableName: e.target.value });
				}}
			/>
			<table style={{ userSelect: 'none', marginTop: '100px', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ fontWeight: 'bold' }}>Columns</td>
					</tr>
					{columns &&
						columns.map((column, columnIndex) => (
							<tr
								onClick={(e) => {
									dispatchSelectAction({
										type: SELECT_COLUMN,
										rows: rows,
										columnID: column.id,
										columnIndex,
										selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
									});
								}}
								key={columnIndex}
							>
								<td
								// className={uniqueColumnIDs.includes(column.id) ? 'sidebar-column-selected' : ''}
								>
									{createModelingTypeIcon(column.modelingType)}
									<span>{column.label}</span>
								</td>
							</tr>
						))}
				</tbody>
			</table>
			<Divider />
			<table style={{ userSelect: 'none', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ width: '80%', fontWeight: 'bold' }}>Rows</td>
						<td style={{ width: '20%', fontWeight: 'bold' }} />
					</tr>
					<tr>
						<td style={{ width: '80%' }}>All Rows</td>
						<td style={{ width: '20%' }}>{rows.length}</td>
					</tr>
					{/* <tr>
						<td style={{ width: '80%' }}>Selected</td>
						<td style={{ width: '20%' }}>{uniqueRowIDs.length}</td>
					</tr> */}
					<tr>
						<td style={{ width: '80%' }}>Excluded</td>
						<td style={{ width: '20%' }}>{excludedRows.length}</td>
					</tr>
				</tbody>
			</table>
			<Divider />
			{savedFilters.length > 0 && (
				<React.Fragment>
					<table style={{ userSelect: 'none', marginLeft: '10px', width: '100%' }}>
						<tbody>
							<tr>
								<td style={{ width: '80%', fontWeight: 'bold' }}>Filters</td>
								<td style={{ width: '20%', fontWeight: 'bold' }} />
							</tr>
							{savedFilters.map((filter) => (
								<tr>
									<td
										onClick={() => {
											const { stringFilter, numberFilters, selectedColumns } = filter;
											dispatchRowsAction({
												type: 'SET_FILTERS',
												selectedColumns,
												stringFilter,
												numberFilters,
											});
											dispatchSpreadsheetAction({ type: 'TOGGLE_FILTER_MODAL', filterModalOpen: true });
										}}
									>
										{filter.filterName || 'Filter'}
									</td>
									<td>
										<Checkbox clicked={filterClicked} onClick={(e) => filterOnclick(filter)} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<Divider />
				</React.Fragment>
			)}
		</div>
	);
});
