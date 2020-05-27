import React from 'react';
import NormalCell from './Cell/NormalCell';
import BlankCell from './Cell/BlankCell';
import BlankClickableCell from './Cell/BlankClickableCell';
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
	console.log('render');
	// function handleContextMenu(e) {
	// 	e.preventDefault();
	// 	dispatchSpreadsheetAction({ type: OPEN_CONTEXT_MENU, contextMenuPosition: { left: e.pageX, top: e.pageY } });
	// }
	if (rowID && !columnID) {
		return <BlankCell rowIndex={rowIndex} columnIndex={columnIndex} />;
	} else if (rowIndex === rowsLength) {
		// This is a blank clickable row
		return <BlankClickableCell columnID={columnID} rowIndex={rowIndex} columnIndex={columnIndex} />;
	} else if (!rowID) {
		// No column ID and no Row ID. The cells in these rows cannot be clicked.
		return <NoColumnNoRowCell />;
	} else if (columnID) {
		return (
			<NormalCell
				key={`Row${rowIndex}Col${columnIndex}`}
				column={column}
				columnID={columnID}
				rowID={rowID}
				columnIndex={columnIndex}
				rowIndex={rowIndex}
				cellValue={cellData}
			/>
		);
	}
});
