import React from 'react';
import ActiveCell from './ActiveCell';
import { NormalCell, RowNumberCell, SelectedCell } from './Cell';
import {
	CLOSE_CONTEXT_MENU,
	// UPDATE_CELL
} from './constants';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
// import { checkIfValidNumber } from './Spreadsheet';

export default function Row({
	activeCell,
	cellCount,
	columns,
	changeActiveCell,
	createNewColumns,
	createNewRows,
	finishCurrentSelectionRange,
	isSelectedCell,
	modifyCellSelectionRange,
	numberOfRows,
	handleContextMenu,
	paste,
	row,
	rows,
	rowIndex,
	selectCell,
	selectedRow,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { contextMenuOpen } = useSpreadsheetState();

	return (
		<div>
			{Array(cellCount).fill(undefined).map((_, columnIndex) => {
				console.log(columnIndex);
				const column = columns[columnIndex - 1];
				const isFormulaColumn = column && column.type === 'Formula' && column.formula;
				if (columnIndex === 0) {
					// The row # on the left side
					return <RowNumberCell key={`RowNumberCell${rowIndex}`} rowIndex={rowIndex} />;
				}
				if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndex) {
					return (
						<ActiveCell
							handleContextMenu={handleContextMenu}
							key={`row${rowIndex}col${columnIndex}`}
							changeActiveCell={changeActiveCell}
							column={column}
							columnIndex={columnIndex}
							columns={columns}
							createNewColumns={createNewColumns}
							createNewRows={createNewRows}
							numberOfRows={numberOfRows}
							row={row}
							rowIndex={rowIndex}
							rows={rows}
							value={column && row ? row[column.id] : ''}
						/>
					);
				} else if ((selectedRow && column) || isSelectedCell(rowIndex, columnIndex)) {
					return (
						<SelectedCell
							handleContextMenu={handleContextMenu}
							key={`Row${rowIndex}Col${columnIndex}`}
							changeActiveCell={changeActiveCell}
							column={column}
							columns={columns}
							columnIndex={columnIndex}
							createNewColumns={createNewColumns}
							createNewRows={createNewRows}
							finishCurrentSelectionRange={finishCurrentSelectionRange}
							isFormulaColumn={isFormulaColumn}
							modifyCellSelectionRange={modifyCellSelectionRange}
							numberOfRows={numberOfRows}
							paste={paste}
							row={row}
							rows={rows}
							rowIndex={rowIndex}
						/>
					);
				} else if (column) {
					return (
						<NormalCell
							key={`Row${rowIndex}Col${columnIndex}`}
							borderRight={(columnIndex === 1 || columnIndex === 6) && true}
							changeActiveCell={changeActiveCell}
							column={column}
							columnIndex={columnIndex}
							finishCurrentSelectionRange={finishCurrentSelectionRange}
							modifyCellSelectionRange={modifyCellSelectionRange}
							row={row}
							rowIndex={rowIndex}
							selectCell={selectCell}
						/>
					);
				} else {
					// The rest of the cells in the row that aren't in a defined column
					return (
						<div
							style={{ backgroundColor: '#eee' }}
							key={`row${rowIndex}col${columnIndex}`}
							onMouseDown={(e) => {
								e.preventDefault();
								if (contextMenuOpen) {
									dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
								}
								selectCell(rowIndex, columnIndex);
							}}
						/>
					);
				}
			})}
		</div>
	);
}
