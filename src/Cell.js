import React from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import { CLOSE_CONTEXT_MENU, REMOVE_SELECTED_CELLS } from './constants';
import { formatForNumberColumn } from './Spreadsheet';
import { Tooltip } from 'antd';
import './App.css';

export function RowNumberCell({ rowIndex }) {
	return <div className={'row-number-cell'}>{rowIndex + 1}</div>;
}

export function SelectedCell({
	changeActiveCell,
	column,
	columnIndex,
	columnID,
	handleContextMenu,
	modifyCellSelectionRange,
	rowIndex,
	cellValue,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { contextMenuOpen } = useSpreadsheetState();

	function onMouseDown(event) {
		event.preventDefault();
		if (contextMenuOpen) {
			dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
		}
		if (event.button === 0) {
			dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
			changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey, columnID);
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
				textAlign: column.type === 'String' ? 'left' : 'right',
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
			{cellValue}
		</div>
	);
}

export function NormalCell({
	cellValue,
	columnIndex,
	column,
	columns,
	columnID,
	rowID,
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
		selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey, rowID, columnID);
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			modifyCellSelectionRange(rowIndex, columnIndex, true);
		}
	}

	// this will need fixing
	return formatForNumberColumn(cellValue, columns.find((col) => col.id === columnID)) ? (
		<Tooltip title={`Cell value is not a number`}>
			<div
				key={`row${rowIndex}col${columnIndex}`}
				onMouseDown={onMouseDown}
				onMouseEnter={onMouseEnter}
				style={{
					backgroundColor: 'pink',
					height: '100%',
					width: '100%',
					lineHeight: 2,
					padding: '0 5px',
					overflow: 'hidden',
					userSelect: 'none',
				}}
			>
				{cellValue || (column.type === 'Number' && '\u2022')}
			</div>
		</Tooltip>
	) : (
		<div
			style={{
				textAlign: column.type === 'String' ? 'left' : 'right',
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
		>
			{cellValue || (column.type === 'Number' && '\u2022')}
		</div>
	);
}
