import React from 'react';
import {
	useSpreadsheetDispatch,
	useSelectDispatch,
	// useRowsDispatch,
	// useRowsState,
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
	// console.log('selected');
	// const dispatchRowsAction = useRowsDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	// const { rows, columns } = useRowsState();

	function changeActiveCell(row, column, selectionActive, columnID) {
		dispatchSelectAction({ type: ACTIVATE_CELL, row, column, selectionActive, columnID });
	}
	// const dispatchRowsAction = useRowsDispatch();

	// function createNewRows(rowCount) {
	// 	dispatchRowsAction({ type: CREATE_ROWS, rowCount });
	// }

	// const onKeyDown = (event) => {
	// 	event.preventDefault();
	// 	// if the key pressed is not a non-character key (arrow key etc)
	// 	if (event.key.length === 1) {
	// 		// if (rowIndex + 1 > rows.length) {
	// 		// 	createNewRows(rows);
	// 		// }
	// 		if (columns[columnIndex].type !== FORMULA) {
	// 			dispatchSelectAction({
	// 				type: ACTIVATE_CELL,
	// 				row: rowIndex,
	// 				column: columnIndex + 1,
	// 				newInputCellValue: event.key,
	// 			});
	// 		}
	// 	} else {
	// 		switch (event.key) {
	// 			case 'Backspace':
	// 				dispatchRowsAction({ type: 'DELETE_VALUES' });
	// 				break;
	// 			case 'Escape':
	// 				dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
	// 				break;
	// 			case 'ArrowDown':
	// 			case 'ArrowUp':
	// 			case 'ArrowLeft':
	// 			case 'ArrowRight':
	// 				event.preventDefault();
	// 				const { row, column } = cursorKeyToRowColMapper[event.key](
	// 					rowIndex,
	// 					columnIndex + 1,
	// 					rows.length,
	// 					columns.length,
	// 				);
	// 				dispatchSelectAction({ type: 'TRANSLATE_SELECTED_CELL', rowIndex: row, columnIndex: column });
	// 				break;
	// 			default:
	// 				break;
	// 		}
	// 	}
	// };

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
