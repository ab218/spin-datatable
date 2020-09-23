/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useCallback } from 'react';
import { TEXT } from '../constants';
import { cursorKeyToRowColMapper } from '../Spreadsheet';
import { ACTIVATE_CELL, CREATE_ROWS, REDO, UNDO, REMOVE_SELECTED_CELLS, UPDATE_CELL, FORMULA } from '../constants';
import { useRowsState, useSelectDispatch, useRowsDispatch } from '../context/SpreadsheetProvider';
export default React.memo(function ActiveCell(props) {
	const { columnIndex, rowIndex, column, handleContextMenu, value: oldValue } = props;
	const dispatchRowsAction = useRowsDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const { columns, rows } = useRowsState();
	const inputRef = useRef(null);

	function changeActiveCell(row, column, columnID) {
		dispatchSelectAction({ type: ACTIVATE_CELL, row, column, columnID });
	}

	const updateCellCallback = useCallback(
		function updateCell(currentValue, rowIndex, columnIndex) {
			// Don't allow formula column cells to be edited
			const formulaColumns = columns.map((col) => (col.type === FORMULA ? columns.indexOf(col) : null));
			if (!formulaColumns.includes(columnIndex)) {
				dispatchRowsAction({
					type: UPDATE_CELL,
					rowIndex,
					columnIndex,
					cellValue: currentValue,
				});
			}
		},
		[ rowIndex, columnIndex ],
	);

	useEffect(
		() => {
			if (rowIndex === rows.length) {
				dispatchRowsAction({ type: CREATE_ROWS, rowCount: 1 });
			}
			return () => {
				const currentValue = inputRef.current.value;
				if (currentValue && currentValue !== oldValue) {
					updateCellCallback(currentValue, rowIndex, columnIndex);
				}
			};
		},
		[ inputRef ],
	);

	const onKeyDown = (event, rows, rowIndex, columns, columnIndex) => {
		switch (event.key) {
			case 'Escape':
				// revert back to previous value
				inputRef.current.value = oldValue;
				dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				break;
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
			case 'z':
				event.preventDefault();
				if (event.shiftKey) {
					dispatchRowsAction({ type: REDO });
					return;
				}
				dispatchRowsAction({ type: UNDO });
				return;
			default:
				break;
		}
	};

	return (
		<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => handleContextMenu(e)}>
			<input
				autoFocus
				onFocus={(e) => e.target.select()}
				defaultValue={oldValue}
				type="text"
				style={{
					textAlign: column && column.type === TEXT ? 'left' : 'right',
					height: '100%',
					width: '100%',
				}}
				ref={inputRef}
				onKeyDown={(e) => onKeyDown(e, rows, rowIndex, columns, columnIndex)}
			/>
		</div>
	);
});
