import React from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import { CLOSE_CONTEXT_MENU } from './constants';
import { formatForNumberColumn } from './Spreadsheet';
import { Tooltip } from 'antd';
import './App.css';

export function RowNumberCell({ rowIndex }) {
	return <div className={'row-number-cell'}>{rowIndex + 1}</div>;
}

export function SelectedCell({
	changeActiveCell,
	columnIndex,
	columnId,
	finishCurrentSelectionRange,
	handleContextMenu,
	isFormulaColumn,
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
		dispatchSpreadsheetAction({ type: 'REMOVE_SELECTED_CELLS' });
		if (!isFormulaColumn && event.button === 0) {
			changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey, columnId);
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
				style={{
					backgroundColor: 'pink',
					height: '100%',
					width: '100%',
					userSelect: cellValue ? '' : 'none',
				}}
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
