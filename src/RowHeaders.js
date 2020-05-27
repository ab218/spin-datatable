import React from 'react';
import { Icon } from 'antd';
import {
	useSpreadsheetState,
	useRowsState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useRowsDispatch,
} from './context/SpreadsheetProvider';
import {
	CLOSE_CONTEXT_MENU,
	CREATE_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	OPEN_CONTEXT_MENU,
	SELECT_ROW,
} from './constants';

export default function RowHeaders({ rowIndex, rowData }) {
	const { contextMenuOpen, excludedRows, uniqueRowIDs } = useSpreadsheetState();
	const { columns, rows } = useRowsState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	function createNewRows(rowCount) {
		dispatchRowsAction({ type: CREATE_ROWS, rowCount });
	}
	function rowHeadersOnDoubleClick(e, rowIndex) {
		e.preventDefault();
		if (rowIndex + 1 > rows.length) {
			createNewRows(rowIndex + 1 - rows.length);
		}
	}
	// only show row numbers of existing rows
	return (
		<div
			onContextMenu={(e) => {
				if (rowIndex < rows.length) {
					e.preventDefault();
					// if (e.target.style.backgroundColor !== 'rgb(160,185,225)') {
					// 	dispatchSelectAction({
					// 		type: SELECT_ROW,
					// 		rowIndex,
					// 	});
					// }
					dispatchSpreadsheetAction({
						type: OPEN_CONTEXT_MENU,
						contextMenuType: 'row',
						rowIndex,
						contextMenuPosition: { left: e.pageX, top: e.pageY },
					});
				}
			}}
			onMouseDown={(e) => {
				// if defined row and left click
				if (rowIndex < rows.length && e.button === 0) {
					if (contextMenuOpen) {
						dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
					}
					dispatchSelectAction({
						type: SELECT_ROW,
						columns: columns,
						rowID: rowData.id,
						rowIndex,
						selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
					});
				}
			}}
			onMouseEnter={(e) => {
				if (typeof e.buttons === 'number' && e.buttons > 0) {
					dispatchSelectAction({
						type: MODIFY_CURRENT_SELECTION_CELL_RANGE,
						endRangeRow: rowIndex,
						endRangeColumn: 1,
					});
				}
			}}
			onDoubleClick={(e) => rowHeadersOnDoubleClick(e, rowIndex)}
			className={rowData.id && uniqueRowIDs.includes(rowData.id) ? 'selected-row-number-cell' : 'row-number-cell'}
			style={{
				borderBottom: '1px solid rgb(221, 221, 221)',
				userSelect: 'none',
				lineHeight: 2,
			}}
		>
			<span>{excludedRows.includes(rowData.id) && <Icon type="stop" style={{ color: 'red', marginRight: 20 }} />}</span>
			<span style={{ position: 'absolute', right: 0, marginRight: 10 }}>{rows.length > rowIndex && rowIndex + 1}</span>
		</div>
	);
}
