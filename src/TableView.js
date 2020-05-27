/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from 'react';
import { pingCloudFunctions } from './analysis-output/Analysis';
import { useRowsState, useSelectDispatch } from './context/SpreadsheetProvider';
import CellRenderer from './CellRenderer';
import AnalysisMenu from './AnalysisMenu';
import Sidebar from './Sidebar';
import RowHeaders from './RowHeaders';
import HeaderRenderer from './HeaderRenderer';
// import TestCounter from './TestCounter';
import {
	Column,
	Table,
	AutoSizer,
	// WindowScroller,
} from 'react-virtualized';
import { ACTIVATE_CELL } from './constants';

const blankColumnWidth = 100;

export const checkIfValidNumber = (str) => {
	if (str.match(/^-?\d*\.?\d*$/)) {
		return false;
	}
	return str;
};

export default React.memo(function Spreadsheet() {
	console.log('spreadsheet');
	const { rows, columns } = useRowsState();
	const dispatchSelectAction = useSelectDispatch();
	const [ widths, setWidths ] = useState({});
	const [ visibleColumns, setVisibleColumns ] = useState(1);
	const [ visibleRows, setVisibleRows ] = useState(1);

	useEffect(() => {
		// Activate cell top leftmost cell on first load
		dispatchSelectAction({ type: ACTIVATE_CELL, row: 0, column: 1 });
		// Wake up cloud functions
		pingCloudFunctions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When a new column is created, set the default width to 100px;
	useEffect(
		() => {
			columns.forEach((col) => {
				setWidths((prevWidths) => {
					return prevWidths[col.id] ? prevWidths : { ...prevWidths, [col.id]: 100 };
				});
			});
		},
		[ columns ],
	);

	const resizeColumn = ({ dataKey, deltaX }) =>
		setWidths((prevWidths) => {
			// for empty columns
			if (!dataKey) {
				return prevWidths;
			}
			return {
				...prevWidths,
				// don't allow columns to shrink below 50px
				[dataKey]: Math.max(prevWidths[dataKey] + deltaX, 50),
			};
		});

	// async function paste() {
	// 	// safari doesn't have navigator.clipboard
	// 	if (!navigator.clipboard) {
	// 		console.log('navigator.clipboard not supported by safari/edge');
	// 		return;
	// 	}
	// 	// TODO: Fix this bug properly
	// 	if (!cellSelectionRanges[0]) {
	// 		console.log('no cell selection range');
	// 		return;
	// 	}
	// 	const copiedValues = await navigator.clipboard.readText();
	// 	const copiedValuesStringified = JSON.stringify(copiedValues).replace(/(?:\\[rn]|[\r\n])/g, '\\n');
	// 	const copiedValuesRows = JSON.parse(copiedValuesStringified).split('\n');
	// 	const copiedValues2dArray = copiedValuesRows.map((clipRow) => clipRow.split('\t'));
	// 	const copiedValues2dArrayDimensions = { height: copiedValues2dArray.length, width: copiedValues2dArray[0].length };
	// 	const { top, left } = cellSelectionRanges[0];
	// 	const { height, width } = copiedValues2dArrayDimensions;
	// 	const numberOfColumnsRequired = left - 1 + width - columns.length;
	// 	const numberOfRowsRequired = top + height - rows.length;
	// 	if (numberOfRowsRequired > 0) {
	// 		createNewRows(numberOfRowsRequired);
	// 	}
	// 	if (numberOfColumnsRequired > 0) {
	// 		createNewColumns(numberOfColumnsRequired);
	// 	}
	// 	dispatchSpreadsheetAction({
	// 		type: 'PASTE_VALUES',
	// 		copiedValues2dArray,
	// 		top,
	// 		left,
	// 		height,
	// 		width,
	// 	});
	// }

	useEffect(
		() => {
			setVisibleColumns(Math.max(columns.length + 3, Math.ceil(window.innerWidth / 100)));
			setVisibleRows(Math.max(rows.length + 5, Math.ceil(window.innerHeight / 30)));
		},
		[ window.innerWidth, window.innerHeight, rows, columns ],
	);

	const columnsDiff = visibleColumns - columns.length;

	function sumOfColumnWidths(columns) {
		let total = 0;
		for (let i = 0; i < columns.length; i++) {
			total += columns[i];
		}
		return total;
	}

	// useEffect(() => {
	// 	function onKeyDown(event) {
	// 		if (barChartModalOpen || distributionModalOpen || analysisModalOpen || filterModalOpen) {
	// 			return;
	// 		}
	// 		if (!activeCell && cellSelectionRanges.length === 0) {
	// 			return;
	// 		}
	// 		const columnIndex = activeCell ? activeCell.column - 1 : cellSelectionRanges[0].left - 1;
	// 		const rowIndex = activeCell ? activeCell.row : cellSelectionRanges[0].top;

	// 		if (event.metaKey || event.ctrlKey) {
	// 			// prevent cell input if holding ctrl/meta
	// 			if (event.key === 'c') {
	// 				dispatchSpreadsheetAction({ type: 'COPY_VALUES' });
	// 				return;
	// 			} else if (event.key === 'a') {
	// 				// else if (event.key === 'v') {
	// 				// 	paste();
	// 				// 	return;
	// 				// }
	// 				event.preventDefault();
	// 				dispatchSelectAction({ type: 'SELECT_ALL_CELLS', rows, columns });
	// 				return;
	// 			}
	// 			return;
	// 		}
	// 		if (event.key.length === 1) {
	// 			if (rowIndex + 1 > rows.length) {
	// 				dispatchSpreadsheetAction({ type: 'CREATE_ROWS', rowCount: rows });
	// 			}
	// 			if (columns[columnIndex].type !== FORMULA) {
	// 				dispatchSelectAction({
	// 					type: 'ACTIVATE_CELL',
	// 					row: rowIndex,
	// 					column: columnIndex + 1,
	// 					newInputCellValue: event.key,
	// 				});
	// 			}
	// 		} else {
	// 			switch (event.key) {
	// 				case 'Backspace':
	// 					dispatchSpreadsheetAction({ type: 'DELETE_VALUES' });
	// 					break;
	// 				case 'Escape':
	// 					dispatchSpreadsheetAction({ type: 'REMOVE_SELECTED_CELLS' });
	// 					break;
	// 				case 'ArrowDown':
	// 				case 'ArrowUp':
	// 				case 'ArrowLeft':
	// 				case 'ArrowRight':
	// 					event.preventDefault();
	// 					const { row, column } = cursorKeyToRowColMapper[event.key](
	// 						rowIndex,
	// 						columnIndex + 1,
	// 						rows.length,
	// 						columns.length,
	// 					);
	// 					dispatchSelectAction({ type: 'TRANSLATE_SELECTED_CELL', rowIndex: row, columnIndex: column });
	// 					break;
	// 				default:
	// 					break;
	// 			}
	// 		}
	// 	}

	// 	document.addEventListener('keydown', onKeyDown);
	// 	return () => {
	// 		console.log('detach');
	// 		document.removeEventListener('keydown', onKeyDown);
	// 	};
	// });

	const emptyRow = {};

	const cellRendererCallback = useCallback((column) => (props) => {
		// rowData = rowID, dataKey = columnID
		const { dataKey: columnID, rowData } = props;
		const rowID = rowData.id;
		return <CellRenderer {...props} column={column} columnID={columnID} rowsLength={rows.length} rowID={rowID} />;
	});

	const rowHeaderCellRendererCallback = useCallback((props) => {
		return <RowHeaders {...props} />;
	});

	const headerRendererCallback = useCallback((column, columnIndex) => (props) => (
		<HeaderRenderer {...props} columnIndex={columnIndex} resizeColumn={resizeColumn} units={column && column.units} />
	));

	const blankHeaderRendererCallback = useCallback((columnIndex) => (props) => (
		<HeaderRenderer {...props} columnIndex={columnIndex} />
	));

	const analysisMenuCallback = useCallback(() => <AnalysisMenu />);

	return (
		// Height 100% necessary for autosizer to work
		<div style={{ height: '100%', width: '100%' }}>
			<Sidebar />
			<AutoSizer>
				{({ height }) => (
					<Table
						overscanRowCount={0}
						width={sumOfColumnWidths(Object.values(widths)) + columnsDiff * blankColumnWidth}
						height={height}
						headerHeight={25}
						rowHeight={30}
						rowCount={visibleRows}
						rowGetter={({ index }) => rows[index] || emptyRow}
						rowStyle={{ alignItems: 'stretch' }}
					>
						<Column
							width={100}
							label={''}
							dataKey={'rowHeaderColumn'}
							headerRenderer={analysisMenuCallback}
							cellRenderer={rowHeaderCellRendererCallback}
							style={{ margin: 0 }}
						/>
						{renderColumns(columns, widths, cellRendererCallback, headerRendererCallback)}
						{visibleColumns &&
							renderBlankColumns(
								visibleColumns,
								columns,
								blankColumnWidth,
								cellRendererCallback,
								blankHeaderRendererCallback,
							)}
					</Table>
				)}
			</AutoSizer>
		</div>
	);
});

function renderColumns(columns, widths, cellRendererCallback, headerRendererCallback) {
	return columns.map((column, columnIndex) => (
		<Column
			key={columnIndex}
			cellRenderer={cellRendererCallback(column)}
			columnIndex={columnIndex}
			dataKey={(column && column.id) || ''}
			headerRenderer={headerRendererCallback(column, columnIndex)}
			label={(column && column.label) || ''}
			width={(column && widths[column.id]) || 100}
			style={{
				border: '1px solid #ddd',
				borderLeft: columnIndex === 0 ? '1 px solid #ddd' : 'none',
				margin: 0,
			}}
		/>
	));
}

function renderBlankColumns(
	totalColumnCount,
	columns,
	blankColumnWidth,
	cellRendererCallback,
	blankHeaderRendererCallback,
) {
	const columnContainer = [];
	for (let columnIndex = columns.length - 1; columnIndex < totalColumnCount; columnIndex++) {
		columnContainer.push(
			<Column
				key={columnIndex}
				cellRenderer={cellRendererCallback(null)}
				columnIndex={columnIndex}
				dataKey={''}
				headerRenderer={blankHeaderRendererCallback(columnIndex)}
				label={''}
				width={blankColumnWidth}
				style={{
					border: '1px solid #ddd',
					borderLeft: columnIndex === 0 ? '1 px solid #ddd' : 'none',
					margin: 0,
				}}
			/>,
		);
	}
	return columnContainer;
}

export const cursorKeyToRowColMapper = {
	ArrowUp: function(row, column) {
		// rows should never go less than index 0 (top row header)
		return { row: Math.max(row - 1, 0), column };
	},
	ArrowDown: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows - 1), column };
	},
	ArrowLeft: function(row, column) {
		// Column should be minimum of 1 due to side row header
		return { row, column: Math.max(column - 1, 1) };
	},
	ArrowRight: function(row, column, _, numberOfColumns) {
		return { row, column: Math.min(column + 1, numberOfColumns) };
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
