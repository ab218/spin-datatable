/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Divider, Input } from 'antd';
import {
	FILTER_SELECT_ROWS,
	HIGHLIGHT_FILTERED_ROWS,
	OPEN_CONTEXT_MENU,
	REMOVE_HIGHLIGHTED_FILTERED_ROWS,
	REMOVE_SELECTED_CELLS,
	SELECT_COLUMN,
	SET_FILTERS,
	SET_SELECTED_COLUMN,
	SET_TABLE_NAME,
	TOGGLE_FILTER_MODAL,
} from './constants';
import {
	useSelectDispatch,
	useSelectState,
	useRowsState,
	useRowsDispatch,
	useSpreadsheetDispatch,
	useSpreadsheetState,
} from './context/SpreadsheetProvider';
import { createModelingTypeIcon } from './Modals/ModalShared';

const SelectedRowsCounter = React.memo(function() {
	const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
	const [ selectedRowsTotal, setSelectedRowsTotal ] = useState(0);

	const isOverlappingOrContiguous = (range1, range2) => {
		// console.log('range1:', range1, 'range2:', range2);
		// contiguous = 1 row away
		const offset = 1;
		return range1.bottom + offset >= range2.top;
	};

	const mergeRange = (range1, range2) => {
		return { top: Math.min(range1.top, range2.top), bottom: Math.max(range1.bottom, range2.bottom) };
	};

	const byTop = (a, b) => a.top - b.top;

	// For each cell selection range, merge it any overlapping ranges in our accumulator
	// ACC: [ R: 3 - 6, R: 8 - 10, ...]
	// GIVEN RANGE: R: 5 - 9 -> 3 - 9  -> 3 - 10

	useEffect(
		() => {
			console.log('number of ranges:', cellSelectionRanges.length);
			const flattenedCellSelectionRanges = cellSelectionRanges
				.concat(currentCellSelectionRange)
				.filter(Boolean)
				.sort(byTop)
				.reduce((stack, curr) => {
					// If the given range overlaps, merge it with overlapping range and replace it on the stack;
					// otherwise, add the given range to the top of our stack
					//
					const overlapped = stack.length && isOverlappingOrContiguous(stack[0], curr);
					return overlapped ? [ mergeRange(stack[0], curr) ].concat(stack.slice(1)) : [ curr ].concat(stack);
				}, []);
			console.log('flattened:', flattenedCellSelectionRanges.length);
			const rowCount = flattenedCellSelectionRanges.reduce((sum, range) => {
				return sum + (range.bottom - range.top) + 1;
			}, 0);
			setSelectedRowsTotal(rowCount);
		},
		[ cellSelectionRanges, currentCellSelectionRange ],
	);
	return (
		<tr>
			<td style={{ width: '80%' }}>Selected</td>
			<td style={{ width: '20%' }}>{selectedRowsTotal}</td>
		</tr>
	);
});

const SidebarColumn = React.memo(function({ column, columnIndex, rows }) {
	const dispatchSelectAction = useSelectDispatch();
	const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
	const [ selected, setSelected ] = useState();

	useEffect(
		() => {
			const inCurrentCellSelection =
				currentCellSelectionRange &&
				columnIndex >= currentCellSelectionRange.left &&
				columnIndex <= currentCellSelectionRange.right;
			const inCellSelectionRanges = cellSelectionRanges.some(
				(range) => columnIndex >= range.left && columnIndex <= range.right,
			);
			setSelected(inCurrentCellSelection || inCellSelectionRanges);
		},
		[ cellSelectionRanges, currentCellSelectionRange ],
	);

	return (
		<tr
			onClick={(e) => {
				dispatchSelectAction({
					type: SELECT_COLUMN,
					rows: rows,
					columnID: column.id,
					columnIndex,
					metaKeyPressed: e.ctrlKey || e.shiftKey || e.metaKey,
				});
			}}
		>
			<td className={selected ? 'sidebar-column-selected' : ''}>
				{createModelingTypeIcon(column.modelingType)}
				<span>{column.label}</span>
			</td>
		</tr>
	);
});

export default React.memo(function Sidebar() {
	const {
		columns,
		rows,
		appliedFilterExclude,
		appliedFilterInclude,
		excludedRows,
		dataTableName,
		savedFilters,
	} = useRowsState();
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
							<SidebarColumn key={columnIndex} column={column} columnIndex={columnIndex} rows={rows} />
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
					<SelectedRowsCounter />
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
								const {
									filteredRowIDs,
									filterName,
									id,
									numberFilters,
									selectedColumns,
									script,
									stringFilters,
								} = filter;
								const checked = filterClicked.findIndex((f) => f.id === filter.id) !== -1;
								return (
									<React.Fragment key={id}>
										<tr
											className={checked ? 'sidebar-column-selected' : ''}
											onClick={(e) => {
												setFilterClicked(
													(prev) => (checked ? prev.filter((f) => f.id !== filter.id) : prev.concat(filter)),
												);
											}}
											onContextMenu={(e) => {
												e.preventDefault();
												dispatchSpreadsheetAction({
													type: OPEN_CONTEXT_MENU,
													contextMenuType: 'cellSelectionRule',
													contextMenuPosition: { left: e.pageX, top: e.pageY },
													filter,
												});
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
													id,
													filterName,
													stringFilters,
													numberFilters,
													script,
												});
											}}
										>
											<td>{filterName || script || 'Filter'}</td>
											<td>
												{appliedFilterInclude.includes(filter.id) ? (
													<CheckCircleOutlined style={{ color: 'green', marginRight: 20 }} />
												) : null}
												{appliedFilterExclude.includes(filter.id) ? (
													<StopOutlined style={{ color: 'red', marginRight: 20 }} />
												) : null}
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
