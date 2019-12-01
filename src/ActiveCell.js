/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import {
	useSpreadsheetDispatch,
	// useSpreadsheetState
} from './SpreadsheetProvider';
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
	Tab: function(row, column, numberOfRows, numberOfColumns, shiftKey) {
		if (shiftKey) {
			if (column !== 1) return { row, column: column - 1 };
			else if (column === 1 && row === 0) return { row: numberOfRows - 1, column: numberOfColumns };
			else if (column === 1 && row !== 0) return { row: row - 1, column: numberOfColumns };
		} else {
			if (column < numberOfColumns) return { row, column: column + 1 };
			else if (column === numberOfColumns && row === numberOfRows - 1) return { row: 0, column: 1 };
			else if (column === numberOfColumns) return { row: row + 1, column: 1 };
		}
	},
};

export default function ActiveCell({
	changeActiveCell,
	columnIndex,
	row,
	rows,
	columns,
	createNewColumns,
	createNewRows,
	columnId,
	handleContextMenu,
	rowIndex,
	value,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	// const { selectDisabled } = useSpreadsheetState();

	const onKeyDown = (event) => {
		switch (event.key) {
			// TODO: implement key shortcuts from: https://www.ddmcomputing.com/excel/keys/xlsk05.html
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case 'Tab':
				event.preventDefault();
				const { row, column } = cursorKeyToRowColMapper[event.key](
					rowIndex,
					columnIndex,
					rows.length,
					columns.length,
					event.shiftKey,
				);
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

	useEffect(() => {
		if (rowIndex + 1 > rows.length) {
			createNewRows(rowIndex + 1 - rows.length);
		}
		if (columnIndex > columns.length) {
			createNewColumns(columnIndex - columns.length);
		}
	});

	const [ currentValue, setCurrentValue ] = useState(value || '');
	const [ oldValue, setOldValue ] = useState(value);
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
				dispatchSpreadsheetAction({
					type: UPDATE_CELL,
					row: row,
					columnId: columnId,
					cellValue: currentValue,
				});
				setOldValue(currentValue);
			}
		},
		[ currentValue ],
	);

	return (
		<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => handleContextMenu(e)}>
			<input
				ref={inputRef}
				type="text"
				style={{ height: '100%', width: '100%' }}
				value={currentValue}
				onKeyDown={onKeyDown}
				onChange={(e) => {
					e.preventDefault();
					setCurrentValue(e.target.value);
				}}
			/>
		</div>
	);
}
