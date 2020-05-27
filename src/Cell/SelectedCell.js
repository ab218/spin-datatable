import React from 'react';
import {
	useSpreadsheetDispatch,
	useSelectDispatch,
	// useRowsDispatch,
	useRowsState,
} from '../context/SpreadsheetProvider';
import {
	ACTIVATE_CELL,
	// CLOSE_CONTEXT_MENU,
	// CREATE_ROWS,
	// DELETE_VALUES,
	// TRANSLATE_SELECTED_CELL,
	OPEN_CONTEXT_MENU,
	REMOVE_SELECTED_CELLS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	FORMULA,
	STRING,
} from '../constants';
// import { cursorKeyToRowColMapper } from '../Spreadsheet';

export default React.memo(function SelectedCell({ column, columnIndex, columnID, rowIndex, cellValue }) {
	console.log('selected');
	// const dispatchRowsAction = useRowsDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { rows, columns } = useRowsState();

	function changeActiveCell(row, column, selectionActive, columnID) {
		dispatchSelectAction({ type: ACTIVATE_CELL, row, column, selectionActive, columnID });
	}

	function handleContextMenu(e) {
		e.preventDefault();
		return dispatchSpreadsheetAction({
			type: OPEN_CONTEXT_MENU,
			contextMenuPosition: { left: e.pageX, top: e.pageY },
		});
	}

	function onMouseDown(event) {
		event.preventDefault();
		// if (contextMenuOpen) {
		// 	dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
		// }
		if (event.button === 0 && column && column.type !== FORMULA) {
			dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
			changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey, columnID);
		}
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			dispatchSelectAction({
				type: MODIFY_CURRENT_SELECTION_CELL_RANGE,
				endRangeRow: rowIndex,
				endRangeColumn: columnIndex,
				rows,
				columns,
			});
		}
	}

	if (typeof cellValue === 'object') {
		return (
			<div
				key={`row${rowIndex}col${columnIndex}`}
				style={{
					textAlign: column.type === STRING ? 'left' : 'right',
					width: '100%',
					height: '100%',
					backgroundColor: '#C0C0C0',
					userSelect: 'none',
					lineHeight: 2,
					padding: '0 5px',
				}}
				onContextMenu={handleContextMenu}
				onMouseEnter={onMouseEnter}
				onMouseDown={onMouseDown}
			>
				{cellValue.error}
			</div>
		);
	}

	return (
		<div
			key={`row${rowIndex}col${columnIndex}`}
			style={{
				textAlign: column.type === STRING ? 'left' : 'right',
				width: '100%',
				height: '100%',
				backgroundColor: '#C0C0C0',
				userSelect: 'none',
				lineHeight: 2,
				padding: '0 5px',
			}}
			// onKeyDown={onKeyDown}
			onContextMenu={handleContextMenu}
			onMouseEnter={onMouseEnter}
			onMouseDown={onMouseDown}
		>
			{cellValue}
		</div>
	);
});
