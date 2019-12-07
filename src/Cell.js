import React, { useEffect } from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import {
	ACTIVATE_CELL,
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	DELETE_VALUES,
	TRANSLATE_SELECTED_CELL,
	UPDATE_CELL,
} from './constants';
import { formatForNumberColumn } from './Spreadsheet';
import { Tooltip } from 'antd';
import './App.css';

export function RowNumberCell({ rowIndex }) {
	return <div className={'row-number-cell'}>{rowIndex + 1}</div>;
}

export function SelectedCell({
	changeActiveCell,
	columns,
	columnIndex,
	columnId,
	finishCurrentSelectionRange,
	handleContextMenu,
	isFormulaColumn,
	modifyCellSelectionRange,
	paste,
	row,
	rows,
	rowIndex,
	cellValue,
	createNewRows,
	createNewColumns,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { contextMenuOpen } = useSpreadsheetState();
	const cursorKeyToRowColMapper = {
		ArrowUp: function(row, column) {
			// rows should never go less than index 0 (top row header)
			return { row: Math.max(row - 1, 0), column };
		},
		ArrowDown: function(row, column, numberOfRows) {
			return { row: Math.min(row + 1, numberOfRows - 1), column };
		},
		ArrowLeft: function(row, column) {
			// Column should be minimum of 1 due to side row header
			return { row, column: Math.max(column - 1, 1) };
		},
		ArrowRight: function(row, column, _, numberOfColumns) {
			return { row, column: Math.min(column + 1, numberOfColumns) };
		},
	};

	useEffect(() => {
		function onKeyDown(event) {
			if (event.metaKey || event.ctrlKey) {
				if (event.key === 'c') {
					// Spreadsheet is handling copy event
					return;
				} else if (event.key === 'v') {
					// Spreadsheet is handling paste event
					return;
				} else if (event.key === 'a') {
					// Spreadsheet is handling selectAll event
					return;
				}
			}
			// if the key pressed is not a non-character key (arrow key etc)
			if (!isFormulaColumn && event.key.length === 1) {
				if (rowIndex + 1 > rows.length) {
					createNewRows(rows);
				}
				if (columnIndex > columns.length) {
					createNewColumns(columnIndex - columns.length);
				}
				dispatchSpreadsheetAction({ type: UPDATE_CELL, row, columnId, cellValue: event.key });
				dispatchSpreadsheetAction({ type: 'DISABLE_SELECT' });
				dispatchSpreadsheetAction({ type: ACTIVATE_CELL, row: rowIndex, column: columnIndex });
			} else {
				switch (true) {
					case Object.keys(cursorKeyToRowColMapper).includes(event.key):
						event.preventDefault();
						const { row, column } = cursorKeyToRowColMapper[event.key](
							rowIndex,
							columnIndex,
							rows.length,
							columns.length,
						);
						dispatchSpreadsheetAction({ type: TRANSLATE_SELECTED_CELL, rowIndex: row, columnIndex: column });
						break;
					case event.key === 'Backspace':
						dispatchSpreadsheetAction({ type: DELETE_VALUES });
						break;
					default:
						break;
				}
			}
		}
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	function onMouseDown(event) {
		event.preventDefault();
		if (contextMenuOpen) {
			dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
		}
		dispatchSpreadsheetAction({ type: 'REMOVE_SELECTED_CELLS' });
		if (!isFormulaColumn && event.button === 0) {
			changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
		}
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			modifyCellSelectionRange(rowIndex, columnIndex, true);
		}
	}

	return (
		<div
			key={`row${rowIndex}col${columnIndex}`}
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: '#C0C0C0',
				userSelect: 'none',
				lineHeight: 2,
				padding: '0 5px',
			}}
			onContextMenu={handleContextMenu}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter}
			onMouseUp={finishCurrentSelectionRange}
		>
			{cellValue || ''}
		</div>
	);
}

export function NormalCell({
	cellValue,
	columnIndex,
	columns,
	columnId,
	finishCurrentSelectionRange,
	modifyCellSelectionRange,
	rowIndex,
	selectCell,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { contextMenuOpen } = useSpreadsheetState();

	function onMouseDown(event) {
		// prevent text from being highlighted on drag select cells
		event.preventDefault();
		if (contextMenuOpen) {
			dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
		}
		selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			modifyCellSelectionRange(rowIndex, columnIndex, true);
		}
	}

	// this will need fixing
	return formatForNumberColumn(cellValue, columns.find((col) => col.id === columnId)) ? (
		<Tooltip title={`Cell value is not a number`}>
			<div
				key={`row${rowIndex}col${columnIndex}`}
				onMouseDown={onMouseDown}
				onMouseEnter={onMouseEnter}
				onMouseUp={finishCurrentSelectionRange}
				style={{ backgroundColor: 'pink', height: '100%', width: '100%', userSelect: cellValue ? '' : 'none' }}
			>
				{cellValue || '\u2022'}
			</div>
		</Tooltip>
	) : (
		<div
			style={{
				height: '100%',
				width: '100%',
				lineHeight: 2,
				padding: '0 5px',
				overflow: 'hidden',
				userSelect: 'none',
			}}
			key={`row${rowIndex}col${columnIndex}`}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter}
			onMouseUp={finishCurrentSelectionRange}
		>
			{cellValue || '\u2022'}
		</div>
	);
}
