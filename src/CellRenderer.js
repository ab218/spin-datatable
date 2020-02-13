/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import ActiveCell from './ActiveCell';
import { SelectedCell, NormalCell } from './Cell';
import { CLOSE_CONTEXT_MENU, OPEN_CONTEXT_MENU } from './constants';

export default function CellRenderer({
	rowIndex,
	columnIndex,
	rowData,
	cellData,
	dataKey,
	createNewColumns,
	createNewRows,
	changeActiveCell,
	modifyCellSelectionRange,
	selectCell,
}) {
	const {
		activeCell,
		cellSelectionRanges,
		currentCellSelectionRange,
		columns,
		contextMenuOpen,
		rows,
	} = useSpreadsheetState();

	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

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
		// const withinASelectedRange = cellSelectionRanges.some(withinRange);
		// return withinASelectedRange || (currentCellSelectionRange && withinRange(currentCellSelectionRange));
		return cellSelectionRanges.concat(currentCellSelectionRange || []).some(withinRange);
	}

	function handleContextMenu(e) {
		e.preventDefault();
		dispatchSpreadsheetAction({ type: OPEN_CONTEXT_MENU, contextMenuPosition: { left: e.pageX, top: e.pageY } });
	}

	if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndex) {
		return (
			<ActiveCell
				handleContextMenu={handleContextMenu}
				key={`row${rowIndex}col${columnIndex}`}
				columnIndex={columnIndex}
				createNewRows={createNewRows}
				rowIndex={rowIndex}
				rows={rows}
				value={cellData}
			/>
		);
	} else if (isSelectedCell(rowIndex, columnIndex)) {
		// } else if (uniqueColumnIDs.includes(dataKey) && uniqueRowIDs.includes(rowData.id)) {
		// } else if (idsInclude(rowData.id, dataKey, uniqueRowIDs, uniqueColumnIDs)) {
		return (
			<SelectedCell
				handleContextMenu={handleContextMenu}
				key={`Row${rowIndex}Col${columnIndex}`}
				changeActiveCell={changeActiveCell}
				rowId={rowData.id}
				columnId={dataKey}
				columnIndex={columnIndex}
				rowIndex={rowIndex}
				cellValue={cellData}
				modifyCellSelectionRange={modifyCellSelectionRange}
			/>
		);
	} else if (rowIndex === rows.length) {
		// This is a blank clickable row
		if (dataKey) {
			return (
				<div
					style={{ backgroundColor: 'white', height: '100%', width: '100%' }}
					onMouseDown={(e) => {
						e.preventDefault();
						if (contextMenuOpen) {
							dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						}
						selectCell(rowIndex, columnIndex, e.ctrlKey || e.shiftKey || e.metaKey);
					}}
				/>
			);
		} else {
			// Cells in blank clickable row not in a defined column
			return (
				<div
					onDoubleClick={(e) => {
						e.preventDefault();
						if (contextMenuOpen) {
							dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						}
						if (columnIndex > columns.length) {
							createNewColumns(columnIndex - columns.length);
						}
					}}
					style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
				/>
			);
		}
	} else if (!rowData.id) {
		// The cells in these rows cannot be clicked
		return <div className="non-interactive-cell" style={{ backgroundColor: '#eee', height: '100%', width: '100%' }} />;
	} else if (dataKey) {
		return (
			<NormalCell
				key={`Row${rowIndex}Col${columnIndex}`}
				columns={columns}
				rowId={rowData.id}
				columnId={dataKey}
				columnIndex={columnIndex}
				modifyCellSelectionRange={modifyCellSelectionRange}
				rowIndex={rowIndex}
				selectCell={selectCell}
				cellValue={cellData}
			/>
		);
	} else {
		return (
			// cells in defined rows but undefined columns
			<div
				style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
				key={`row${rowIndex}col${columnIndex}`}
				onDoubleClick={(e) => {
					e.preventDefault();
					if (contextMenuOpen) {
						dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
					}
					if (columnIndex > columns.length) {
						createNewColumns(columnIndex - columns.length);
					}
				}}
			/>
		);
	}
}
