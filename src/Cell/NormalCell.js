import React from 'react';
import { Tooltip } from 'antd';
import { useSelectDispatch, useRowsState } from '../context/SpreadsheetProvider';
import {
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	SELECT_CELL,
	// CLOSE_CONTEXT_MENU,
	NUMBER,
	STRING,
} from '../constants';

function formatForNumberColumn(cellValue, column) {
	if (cellValue && column.type === NUMBER) {
		return isNaN(cellValue);
	}
}

export default React.memo(function NormalCell({ cellValue, columnIndex, column, rowIndex, rowID }) {
	const { columns, rows, filteredRowIDs } = useRowsState();
	const dispatchSelectAction = useSelectDispatch();
	function determineBackgroundColor() {
		if (filteredRowIDs && filteredRowIDs.length > 0 && filteredRowIDs.includes(rowID)) {
			return 'lightgreen';
		}
		if (cellValue && column.type === NUMBER) {
			if (isNaN(cellValue)) {
				return 'pink';
			}
		}
		return 'transparent';
	}

	function onMouseDown(event) {
		dispatchSelectAction({
			metaKeyPressed: event.metaKey || event.ctrlKey,
			type: SELECT_CELL,
			rowIndex,
			columnIndex,
		});
	}

	function onMouseEnter(event) {
		if (typeof event.buttons === 'number' && event.buttons > 0) {
			dispatchSelectAction({
				type: MODIFY_CURRENT_SELECTION_CELL_RANGE,
				endRangeRow: rowIndex,
				endRangeColumn: columnIndex,
				rows,
				columns,
			});
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

	const isNotANumber = formatForNumberColumn(cellValue, column);

	return (
		<Tooltip title={isNotANumber ? `Cell value is not a number` : null}>
			<div
				key={`row${rowIndex}col${columnIndex}`}
				onMouseDown={onMouseDown}
				onMouseOver={onMouseEnter}
				style={{
					textAlign: column.type === STRING ? 'left' : 'right',
					backgroundColor: determineBackgroundColor(),
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
	);
});
