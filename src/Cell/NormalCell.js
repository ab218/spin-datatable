import React from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from '../SpreadsheetProvider';
import { CLOSE_CONTEXT_MENU, NUMBER, STRING } from '../constants';
import { formatForNumberColumn } from '../Spreadsheet';
import { Tooltip } from 'antd';
import '../App.css';

export default function NormalCell({
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

	if (typeof cellValue === 'object') {
		return (
			<Tooltip title={cellValue.errorMessage}>
				<div
					key={`row${rowIndex}col${columnIndex}`}
					onMouseDown={onMouseDown}
					onMouseEnter={onMouseEnter}
					style={{
						textAlign: column.type === STRING ? 'left' : 'right',
						backgroundColor: 'pink',
						height: '100%',
						width: '100%',
						lineHeight: 2,
						padding: '0 5px',
						overflow: 'hidden',
						userSelect: 'none',
					}}
				>
					{cellValue.error}
				</div>
			</Tooltip>
		);
	}

	// this will need fixing
	return formatForNumberColumn(cellValue, columns.find((col) => col.id === columnID)) ? (
		<Tooltip title={`Cell value is not a number`}>
			<div
				key={`row${rowIndex}col${columnIndex}`}
				onMouseDown={onMouseDown}
				onMouseEnter={onMouseEnter}
				style={{
					textAlign: column.type === STRING ? 'left' : 'right',
					backgroundColor: 'pink',
					height: '100%',
					width: '100%',
					lineHeight: 2,
					padding: '0 5px',
					overflow: 'hidden',
					userSelect: 'none',
				}}
			>
				{cellValue || (column.type === NUMBER && '\u2022')}
			</div>
		</Tooltip>
	) : (
		<div
			style={{
				textAlign: column.type === STRING ? 'left' : 'right',
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
			{cellValue || (column.type === NUMBER && '\u2022')}
		</div>
	);
}
