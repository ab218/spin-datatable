import React from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from '../SpreadsheetProvider';
import { CLOSE_CONTEXT_MENU, REMOVE_SELECTED_CELLS, FORMULA, STRING } from '../constants';
import '../App.css';

export default function SelectedCell({
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
		if (event.button === 0 && column && column.type !== FORMULA) {
			dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
			changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey, columnID);
		}
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			modifyCellSelectionRange(rowIndex, columnIndex, true);
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
			onContextMenu={handleContextMenu}
			onMouseEnter={onMouseEnter}
			onMouseDown={onMouseDown}
		>
			{cellValue}
		</div>
	);
}
