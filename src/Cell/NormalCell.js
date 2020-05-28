import React from 'react';
import {
	useRowsState,
	useRowsDispatch,
	// useSpreadsheetDispatch,
	useSpreadsheetState,
	useSelectDispatch,
	useSelectState,
} from '../context/SpreadsheetProvider';
import ActiveCell from './ActiveCell';
import SelectedCell from './SelectedCell';
import NewNormalCell from './NewNormalCell';
// import BlankClickableCell from './BlankClickableCell';
import {
	ACTIVATE_CELL,
	UPDATE_CELL,
	FORMULA,
	// CLOSE_CONTEXT_MENU,
} from '../constants';

export default React.memo(function NormalCell({ cellValue, columnIndex, column, columnID, rowID, rowIndex }) {
	// Normal cells rerender on every click.
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();

	const { newInputCellValue } = useSpreadsheetState();
	const { columns, rows } = useRowsState();
	const { activeCell, cellSelectionRanges, currentCellSelectionRange } = useSelectState();

	function updateCell(currentValue, rowIndex, columnIndex) {
		// Don't allow formula column cells to be edited
		const formulaColumns = columns.map((col) => (col.type === FORMULA ? columns.indexOf(col) : null));
		if (!formulaColumns.includes(columnIndex - 1)) {
			dispatchRowsAction({
				type: UPDATE_CELL,
				rowIndex,
				columnIndex: columnIndex - 1,
				cellValue: currentValue,
			});
		}
	}

	function changeActiveCell(row, column, selectionActive, columnID) {
		dispatchSelectAction({ type: ACTIVATE_CELL, row, column, selectionActive, columnID });
	}

	function isSelectedCell(rowIndex, columnIndex) {
		function withinRange(value) {
			const { top, right, bottom, left } = value;
			if (columnIndex === null) {
				return rowIndex >= top && rowIndex <= bottom;
			} else if (rowIndex === null) {
				return columnIndex >= left && columnIndex <= right;
			} else {
				return rowIndex >= top && rowIndex <= bottom && columnIndex >= left && columnIndex <= right;
			}
		}
		const emptyArray = [];
		return cellSelectionRanges.concat(currentCellSelectionRange || emptyArray).some(withinRange);
	}

	if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndex) {
		return (
			<ActiveCell
				updateCell={updateCell}
				column={column}
				// handleContextMenu={handleContextMenu}
				key={`row${rowIndex}col${columnIndex}`}
				columnIndex={columnIndex}
				columns={columns}
				changeActiveCell={changeActiveCell}
				rowIndex={rowIndex}
				rows={rows}
				value={newInputCellValue || cellValue}
			/>
		);
	} else if (columnID && isSelectedCell(rowIndex, columnIndex)) {
		return (
			<SelectedCell
				key={`Row${rowIndex}Col${columnIndex}`}
				column={column}
				columnID={columnID}
				columnIndex={columnIndex}
				rowID={rowID}
				rowIndex={rowIndex}
				cellValue={cellValue}
				// modifyCellSelectionRange={modifyCellSelectionRange}
			/>
		);
	}

	return (
		<NewNormalCell
			rows={rows}
			columns={columns}
			cellValue={cellValue}
			columnIndex={columnIndex}
			column={column}
			rowIndex={rowIndex}
		/>
	);
});
