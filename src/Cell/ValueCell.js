import React from 'react';
import { useSpreadsheetState, useSelectState } from '../context/SpreadsheetProvider';
import ActiveCell from './ActiveCell';
import SelectedCell from './SelectedCell';
import NormalCell from './NormalCell';
import BlankClickableCell from './BlankClickableCell';
// cells that hold some value
export default React.memo(function ValueCell({
	blankClickableRow,
	cellValue,
	columnIndex,
	column,
	columnID,
	rowID,
	rowIndex,
}) {
	// Value cells rerender on every click.
	const { newInputCellValue } = useSpreadsheetState();
	const { activeCell, cellSelectionRanges, currentCellSelectionRange } = useSelectState();

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
				column={column}
				key={`row${rowIndex}col${columnIndex}`}
				columnIndex={columnIndex}
				rowIndex={rowIndex}
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
			/>
		);
	} else if (blankClickableRow) {
		// This is a blank clickable row
		return <BlankClickableCell columnID={columnID} rowIndex={rowIndex} columnIndex={columnIndex} />;
	}

	return (
		<NormalCell cellValue={cellValue} columnIndex={columnIndex} column={column} rowID={rowID} rowIndex={rowIndex} />
	);
});
