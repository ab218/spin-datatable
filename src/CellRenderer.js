import React from 'react';
import ValueCell from './Cell/ValueCell';
import BlankCell from './Cell/BlankCell';
import NoColumnNoRowCell from './Cell/NoColumnNoRowCell';

export default React.memo(function CellRenderer({
	rowIndex,
	columnIndex,
	rowID,
	cellData,
	column,
	columnID,
	rowsLength,
}) {
	const blankClickableRow = rowIndex === rowsLength;
	if ((rowID && columnID) || blankClickableRow) {
		return (
			<ValueCell
				key={`Row${rowIndex}Col${columnIndex}`}
				column={column}
				columnID={columnID}
				rowID={rowID}
				columnIndex={columnIndex}
				rowIndex={rowIndex}
				cellValue={cellData}
				blankClickableRow={blankClickableRow}
			/>
		);
	} else if (rowID && !columnID) {
		return <BlankCell rowIndex={rowIndex} columnIndex={columnIndex} />;
	} else if (!rowID) {
		// No column ID and no Row ID. The cells in these rows cannot be clicked.
		return <NoColumnNoRowCell />;
	}
});
