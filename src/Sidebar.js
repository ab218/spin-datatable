/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Divider, Dropdown, Input, Icon, Menu } from 'antd';
import {
	FILTER_SELECT_ROWS,
	HIGHLIGHT_FILTERED_ROWS,
	REMOVE_HIGHLIGHTED_FILTERED_ROWS,
	REMOVE_SELECTED_CELLS,
	REMOVE_SIDEBAR_FILTER,
	SELECT_COLUMN,
	SET_FILTERS,
	SET_SELECTED_COLUMN,
	SET_TABLE_NAME,
	TOGGLE_FILTER_MODAL,
} from './constants';
import {
	useSelectDispatch,
	useRowsState,
	useRowsDispatch,
	useSpreadsheetDispatch,
	useSpreadsheetState,
} from './context/SpreadsheetProvider';
import { createModelingTypeIcon } from './Modals/ModalShared';

export default React.memo(function Sidebar() {
	const { columns, rows, excludedRows, dataTableName, savedFilters } = useRowsState();
	const { filterModalOpen } = useSpreadsheetState();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const [ filterClicked, setFilterClicked ] = useState([]);

	useEffect(
		() => {
			if (filterClicked.length > 0) {
				dispatchSelectAction({ type: FILTER_SELECT_ROWS, filters: filterClicked, rows, columns });
			} else {
				dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
			}
		},
		[ filterClicked ],
	);

	const menu = (filter) => (
		<Menu>
			<Menu.Item
				onClick={(e) => {
					dispatchRowsAction({ type: REMOVE_SIDEBAR_FILTER, filter });
					dispatchRowsAction({ type: REMOVE_HIGHLIGHTED_FILTERED_ROWS });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Exclude rows
			</Menu.Item>
			<Menu.Item
				onClick={(e) => {
					dispatchRowsAction({ type: REMOVE_SIDEBAR_FILTER, filter });
					dispatchRowsAction({ type: REMOVE_HIGHLIGHTED_FILTERED_ROWS });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Unexclude rows
			</Menu.Item>
			<Menu.Item
				onClick={(e) => {
					dispatchRowsAction({ type: REMOVE_SIDEBAR_FILTER, filter });
					dispatchRowsAction({ type: REMOVE_HIGHLIGHTED_FILTERED_ROWS });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Delete Filter
			</Menu.Item>
		</Menu>
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
							{savedFilters.map((filter) => {
								const { stringFilters, numberFilters, selectedColumns, filteredRowIDs } = filter;
								const checked = filterClicked.findIndex((f) => f.id === filter.id) !== -1;
								return (
									<React.Fragment>
										<tr
											key={filter.filterName}
											className={checked ? 'sidebar-column-selected' : ''}
											onClick={(e) => {
												setFilterClicked(
													(prev) => (checked ? prev.filter((f) => f.id !== filter.id) : prev.concat(filter)),
												);
											}}
											onMouseOver={() => {
												dispatchRowsAction({
													type: HIGHLIGHT_FILTERED_ROWS,
													filteredRowIDs,
												});
											}}
											onMouseOut={() => {
												if (!filterModalOpen) {
													dispatchRowsAction({
														type: REMOVE_HIGHLIGHTED_FILTERED_ROWS,
													});
												}
											}}
											onDoubleClick={() => {
												dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns });
												dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: true });
												dispatchRowsAction({
													type: SET_FILTERS,
													selectedColumns,
													stringFilters,
													numberFilters,
												});
											}}
										>
											<td>{filter.filterName || 'Filter'}</td>
											<td>
												<Dropdown placement={'topRight'} overlay={() => menu(filter)}>
													<Icon type={'down'} />
												</Dropdown>
											</td>
										</tr>
										<tr style={{ height: '10px' }} />
									</React.Fragment>
								);
							})}
						</tbody>
					</table>
					<Divider />
				</React.Fragment>
			)}
		</div>
	);
});
