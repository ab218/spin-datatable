/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import { UPDATE_CELL } from './constants';

const cursorKeyToRowColMapper = {
	ArrowUp: function(row, column) {
		// rows should never go less than index 0 (top row header)
		return { row: Math.max(row - 1, 0), column };
	},
	ArrowDown: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows), column };
	},
	Enter: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows), column };
	},
};

export default function ActiveCell({
	changeActiveCell,
	columnIndex,
	row,
	rows,
	column,
	columns,
	createNewColumns,
	createNewRows,
	handleContextMenu,
	numberOfRows,
	rowIndex,
	value,
	style,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { selectDisabled } = useSpreadsheetState();

	const onKeyDown = (event) => {
		switch (event.key) {
			// TODO: implement key shortcuts from: https://www.ddmcomputing.com/excel/keys/xlsk05.html
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
				event.preventDefault();
				const { row, column } = cursorKeyToRowColMapper[event.key](rowIndex, columnIndex, numberOfRows);
				changeActiveCell(row, column, event.ctrlKey || event.shiftKey || event.metaKey);
				break;

			default:
				break;
		}
	};

	// const inputEl = useRef(null);
	// useEffect(() => {
	// 	const oldInputElCurrent = inputEl.current;
	// 	// Sometimes focus wasn't firing so I added a short setTimeout here
	// 	setTimeout(() => {
	// 		oldInputElCurrent.focus();
	// 		if (!selectDisabled) {
	// 			oldInputElCurrent.select();
	// 		}
	// 	}, 5);
	// 	dispatchSpreadsheetAction({ type: 'ENABLE_SELECT' });
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, []);

	// useEffect(() => {
	// 	if (rows === 1) {
	// 		createNewRows(rows);
	// 	}
	// 	if (columnIndex > columns.length) {
	// 		createNewColumns(columnIndex - columns.length);
	// 	}
	// });

	return (
		<div style={{ ...style }} className={'virtualized-cell'} onContextMenu={(e) => handleContextMenu(e)}>
			<ActiveCellInput value={value} row={row} column={column} />
		</div>
	);
}

export function ActiveCellInput(props) {
	const [ currentValue, setCurrentValue ] = useState(props.value || '');
	const [ oldValue, setOldValue ] = useState(props.value);
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const inputRef = useRef(null);

	useEffect(() => {
		const oldInputRef = inputRef.current;
		setTimeout(() => {
			oldInputRef.focus();
		}, 5);
	}, []);

	useEffect(
		() => {
			if (currentValue && currentValue !== oldValue) {
				// Dispatch is causing page to scroll up. Why?
				dispatchSpreadsheetAction({ type: UPDATE_CELL, row: props.row, column: props.column, cellValue: currentValue });
				setOldValue(currentValue);
			}
		},
		[ currentValue ],
	);

	return (
		<input
			ref={inputRef}
			type="text"
			value={currentValue}
			// onKeyDown={onKeyDown}
			onChange={(e) => {
				e.preventDefault();
				setCurrentValue(e.target.value);
			}}
		/>
	);
}
