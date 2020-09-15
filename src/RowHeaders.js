import React, { useEffect, useState } from 'react';
import { StopOutlined } from '@ant-design/icons';
import {
	useSpreadsheetState,
	useRowsState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useRowsDispatch,
	useSelectState,
} from './context/SpreadsheetProvider';
import {
	CLOSE_CONTEXT_MENU,
	CREATE_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	OPEN_CONTEXT_MENU,
	SELECT_ROW,
} from './constants';

export default React.memo(function RowHeaders({ rowIndex, rowData }) {
	const { contextMenuOpen } = useSpreadsheetState();
	const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
	const { columns, rows, excludedRows, includedRows } = useRowsState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const [ selected, setSelected ] = useState();

	useEffect(
		() => {
			const inCurrent =
				currentCellSelectionRange &&
				currentCellSelectionRange.top <= rowIndex &&
				currentCellSelectionRange.bottom >= rowIndex;
			const inRanges = cellSelectionRanges.some(
				(cellRange) => cellRange.top <= rowIndex && cellRange.bottom >= rowIndex,
			);
			setSelected(inCurrent || inRanges);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ currentCellSelectionRange, cellSelectionRanges ],
	);

	function createNewRows(rowCount) {
		dispatchRowsAction({ type: CREATE_ROWS, rowCount });
	}
	function rowHeadersOnDoubleClick(e, rowIndex) {
		e.preventDefault();
		if (rowIndex + 1 > rows.length) {
			createNewRows(rowIndex + 1 - rows.length);
		}
	}

	// prioritize included rows
	function isRowExcluded(rowID) {
		if (includedRows.length) {
			return rowID && !includedRows.includes(rowID);
		} else if (excludedRows.length) {
			return excludedRows.includes(rowID);
		} else {
			return false;
		}
	}
	// only show row numbers of existing rows
	return (
		<div
			onContextMenu={(e) => {
				if (rowIndex < rows.length) {
					e.preventDefault();
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
						metaKeyPressed: e.ctrlKey || e.shiftKey || e.metaKey,
					});
				}
			}}
			onMouseEnter={(e) => {
				if (typeof e.buttons === 'number' && e.buttons > 0 && rowData.id) {
					dispatchSelectAction({
						type: MODIFY_CURRENT_SELECTION_CELL_RANGE,
						rows,
						columns,
						endRangeRow: rowIndex,
						endRangeColumn: 0,
					});
				}
			}}
			onDoubleClick={(e) => rowHeadersOnDoubleClick(e, rowIndex)}
			className={selected ? 'selected-row-number-cell' : 'row-number-cell'}
			style={{
				borderBottom: '1px solid rgb(221, 221, 221)',
				userSelect: 'none',
				lineHeight: 2,
			}}
		>
			<span>{isRowExcluded(rowData.id) && <StopOutlined style={{ color: 'red', marginRight: 20 }} />}</span>
			<span style={{ position: 'absolute', right: 0, marginRight: 10 }}>{rows.length > rowIndex && rowIndex + 1}</span>
		</div>
	);
});
