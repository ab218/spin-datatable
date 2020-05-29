import React, { useState, useEffect, useRef } from 'react';
import { STRING } from '../constants';
import { cursorKeyToRowColMapper } from '../Spreadsheet';
import { ACTIVATE_CELL, UPDATE_CELL, FORMULA } from '../constants';
import { useRowsState, useSelectDispatch, useRowsDispatch } from '../context/SpreadsheetProvider';
export default React.memo(function ActiveCell({ columnIndex, rowIndex, column, handleContextMenu, value }) {
	const dispatchRowsAction = useRowsDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const { columns, rows } = useRowsState();
	const [ currentValue, setCurrentValue ] = useState('');
	const inputRef = useRef(null);

	function changeActiveCell(row, column, selectionActive, columnID) {
		dispatchSelectAction({ type: ACTIVATE_CELL, row, column, selectionActive, columnID });
	}

	function updateCell(currentValue, rowIndex, columnIndex) {
		// Don't allow formula column cells to be edited
		const formulaColumns = columns.map((col) => (col.type === FORMULA ? columns.indexOf(col) : null));
		if (!formulaColumns.includes(columnIndex - 1)) {
			dispatchRowsAction({
				type: UPDATE_CELL,
				rowIndex,
				columnIndex: columnIndex - 1,
				cellValue: currentValue,
			});
		}
	}

	useEffect(
		() => {
			return () => {
				if (currentValue !== value) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					updateCell(inputRef.current.value, rowIndex, columnIndex);
				}
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ rowIndex, columnIndex ],
	);

	const onKeyDown = (event, rows, rowIndex, columns, columnIndex) => {
		switch (event.key) {
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

	return (
		<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => handleContextMenu(e)}>
			<input
				autoFocus
				onFocus={(e) => e.target.select()}
				defaultValue={value}
				type="text"
				style={{
					textAlign: column && column.type === STRING ? 'left' : 'right',
					height: '100%',
					width: '100%',
				}}
				ref={inputRef}
				onKeyDown={(e) => onKeyDown(e, rows, rowIndex, columns, columnIndex)}
				onChange={(e) => {
					e.preventDefault();
					setCurrentValue(e.target.value);
				}}
			/>
		</div>
	);
});
