import React, { useReducer } from 'react';
import { Parser } from 'hot-formula-parser';
import './App.css';
import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	DELETE_ROWS,
	DELETE_COLUMN,
	DELETE_VALUES,
	EXCLUDE_ROWS,
	FILTER_COLUMN,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	PASTE_VALUES,
	REMOVE_SELECTED_CELLS,
	SET_SELECTED_COLUMN,
	SELECT_CELL,
	SELECT_CELLS,
	SELECT_ALL_CELLS,
	SELECT_ROW,
	SELECT_COLUMN,
	SET_FILTERS,
	SORT_COLUMN,
	OPEN_CONTEXT_MENU,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_BAR_CHART_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
	TOGGLE_LAYOUT,
	TRANSLATE_SELECTED_CELL,
	UNEXCLUDE_ROWS,
	UPDATE_CELL,
	UPDATE_COLUMN,
} from './constants';

function generateUniqueRowIDs(cellSelectionRanges, rows) {
	const range = (start, end) => Array(end - start + 1).fill().map((_, i) => start + i);
	const selectedRows = cellSelectionRanges.map((row) => range(row.top, row.bottom));
	const flattenedRowIndexes = selectedRows.flat();
	const rowIDs = rows.map((row, i) => flattenedRowIndexes.includes(i) && row.id).filter((x) => x);
	return rowIDs;
}

function generateUniqueColumnIDs(cellSelectionRanges, columns) {
	const range = (start, end) => Array(end - start).fill().map((_, i) => start + i);
	const selectedColumns = cellSelectionRanges.map((column) => range(column.left - 1, column.right));
	const flattenedColumnIndexes = selectedColumns.flat();
	const columnIDs = columns.map((column, i) => flattenedColumnIndexes.includes(i) && column.id).filter((x) => x);
	return columnIDs;
}

function rowValueWithinTheseColumnRanges(row) {
	const columns = this;
	return columns.every(
		(column) => row[column.id] >= (column.min || column.colMin) && row[column.id] <= (column.max || column.colMax),
	);
}

function filterRowsByColumnRange(selectedColumns, rows) {
	return rows.filter(rowValueWithinTheseColumnRanges, selectedColumns);
}

function translateLabelToID(columns, formula) {
	return columns.filter((someColumn) => formula.includes(someColumn.label)).reduce((changedFormula, someColumn) => {
		return changedFormula.replace(new RegExp(`\\b${someColumn.label}\\b`, 'g'), `${someColumn.id}`);
	}, formula);
}

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();

function getRangeBoundaries({ startRangeRow, startRangeColumn, endRangeRow, endRangeColumn }) {
	const top = Math.min(startRangeRow, endRangeRow);
	const bottom = Math.max(startRangeRow, endRangeRow);
	const left = Math.min(startRangeColumn, endRangeColumn);
	const right = Math.max(startRangeColumn, endRangeColumn);
	return { top, left, bottom, right };
}

function createRandomID() {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 10; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

function createRandomLetterString() {
	const upperAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const alphabet = upperAlphabet + upperAlphabet.toLowerCase();
	return (
		'_' +
		Array(10).fill(undefined).map((_) => alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join('') +
		'_'
	);
}

function selectRowAndColumnIDs(top, left, bottom, right, columns, rows) {
	const colPos = columns
		.map((col, i) => {
			return i >= left - 1 && i <= right - 1 && col.id;
		})
		.filter((x) => x);
	const rowPos = rows
		.map((row, i) => {
			return i >= top && i <= bottom && row.id;
		})
		.filter((x) => x);
	return { selectedColumnIDs: colPos, selectedRowIDs: rowPos };
}

function spreadsheetReducer(state, action) {
	const {
		analysisModalOpen,
		barChartModalOpen,
		cellValue,
		contextMenuPosition,
		contextMenuType,
		colName,
		column,
		columnCount,
		columnId,
		columnIndex,
		columnTypeModalOpen,
		distributionModalOpen,
		endRangeRow,
		endRangeColumn,
		filterModalOpen,
		layout,
		row,
		rows,
		rowIndex,
		rowCount,
		selectionActive,
		selectedColumns,
		updatedColumn,
	} = action;
	function getCol(colName) {
		return state.columns.find((col) => col.label === colName);
	}
	const { type, ...event } = action;
	state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		// On text input of a selected cell, value is cleared, cell gets new value and cell is activated
		// EVENT: Activate a cell
		case ACTIVATE_CELL: {
			const activeCell = { row, column, columnId };
			return { ...state, activeCell, cellSelectionRanges: [], uniqueRowIDs: [], uniqueColumnIDs: [] };
		}
		case ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS: {
			const { currentCellSelectionRange, cellSelectionRanges } = state;
			return {
				...state,
				cellSelectionRanges: cellSelectionRanges.concat(currentCellSelectionRange || []),
				currentCellSelectionRange: null,
			};
		}
		case COPY_VALUES: {
			// TODO: There should be a line break if the row is undefined values
			// TODO: There should be no line break for the first row when you copy
			const { cellSelectionRanges, columns, rows } = state;
			// Fixes crash if cell from non existant column is selected
			if (!cellSelectionRanges.length) return { ...state };
			// const copyEl = (elToBeCopied) => {
			// 	let range, sel;
			// 	// Ensure that range and selection are supported by the browsers
			// 	if (document.createRange && window.getSelection) {
			// 		range = document.createRange();
			// 		sel = window.getSelection();
			// 		// unselect any element in the page
			// 		sel.removeAllRanges();
			// 		try {
			// 			range.selectNodeContents(elToBeCopied);
			// 			sel.addRange(range);
			// 		} catch (e) {
			// 			console.log(e);
			// 		}
			// 		document.execCommand('copy');
			// 	}
			// 	sel.removeAllRanges();
			// 	console.log('Element Copied!');
			// };

			// function createTable(tableData) {
			// 	const table = document.createElement('table');
			// 	table.setAttribute('id', 'copy-table');
			// 	let row = {};
			// 	let cell = {};
			// 	tableData.forEach((rowData) => {
			// 		row = table.insertRow(-1); // -1 is for safari
			// 		rowData.forEach((cellData) => {
			// 			cell = row.insertCell();
			// 			cell.textContent = cellData;
			// 		});
			// 	});
			// 	document.body.appendChild(table);
			// 	copyEl(table);
			// 	document.body.removeChild(table);
			// }

			// In case there are multiple selection ranges, we only want the first selection made
			const { top, left, bottom, right } = cellSelectionRanges[0];
			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(top, left, bottom, right, columns, rows);
			const copiedRows = rows
				.map((row) => {
					if (selectedRowIDs.includes(row.id)) {
						return selectedColumnIDs.map((selectedColumn) => row[selectedColumn]);
					}
					return null;
				})
				.filter((x) => x);
			const clipboardContents = copiedRows.map((row) => row.join('\t')).join('\n');
			navigator.clipboard
				.writeText(clipboardContents)
				.then(() => console.log('wrote to clipboard', clipboardContents))
				.catch((args) => console.error('did not copy to clipboard:', args));
			return { ...state };
		}
		case CREATE_COLUMNS: {
			const newColumns = Array(columnCount).fill(undefined).map((_, i) => {
				const id = createRandomLetterString();
				return { id, type: 'String', label: `Column ${state.columns.length + i + 1}` };
			});
			const columns = state.columns.concat(newColumns);
			return { ...state, columns };
		}

		case CREATE_ROWS: {
			const newRows = Array(rowCount).fill(undefined).map((_) => {
				return { id: createRandomID() };
			});
			return { ...state, rows: state.rows.concat(newRows) };
		}
		case 'ENABLE_SELECT': {
			return { ...state, selectDisabled: false };
		}
		case 'DISABLE_SELECT': {
			return { ...state, selectDisabled: true };
		}
		case DELETE_COLUMN: {
			const { rows } = state;
			const columnID = getCol(action.colName).id;
			const filteredColumns = state.columns.filter((col) => col.id !== columnID);
			for (let i = 0; i < rows.length; i++) {
				delete rows[i][columnID];
			}
			return {
				...state,
				columns: filteredColumns,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
				selectedRowIDs: [],
				activeCell: null,
			};
		}
		case DELETE_ROWS: {
			// const slicedRows = state.rows.slice(0, rowIndex).concat(state.rows.slice(rowIndex + 1));
			const filteredRows = state.rows.filter((row) => !state.uniqueRowIDs.includes(row.id));
			return {
				...state,
				rows: filteredRows,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
				selectedRowIDs: [],
				activeCell: null,
			};
		}
		case EXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows, rows } = state;
			return {
				...state,
				excludedRows: [ ...new Set(excludedRows.concat(generateUniqueRowIDs(cellSelectionRanges, rows))) ],
			};
		}
		case UNEXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows, rows } = state;
			return {
				...state,
				excludedRows: excludedRows.filter((row) => !generateUniqueRowIDs(cellSelectionRanges, rows).includes(row)),
			};
		}
		// EVENT: Paste
		case PASTE_VALUES: {
			function mapRows(rows, copiedValues, destinationColumns, destinationRows) {
				const indexOfFirstDestinationRow = rows.findIndex((row) => row.id === destinationRows[0]);
				// We create an updated copy of the rows that are to be changed as a result of the paste operation
				const newRowValues = [];
				for (let copiedValuesIndex = 0; copiedValuesIndex < copiedValues.length; copiedValuesIndex++) {
					const newRowValue = { ...rows[indexOfFirstDestinationRow + copiedValuesIndex] };
					for (let colIndex = 0; colIndex < destinationColumns.length; colIndex++) {
						newRowValue[destinationColumns[colIndex]] = copiedValues[copiedValuesIndex][colIndex];
					}
					newRowValues.push(newRowValue);
				}
				return rows
					.slice(0, indexOfFirstDestinationRow)
					.concat(newRowValues)
					.concat(rows.slice(indexOfFirstDestinationRow + newRowValues.length));
			}

			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
				action.top,
				action.left,
				action.top + action.height - 1,
				action.left + action.width - 1,
				state.columns,
				state.rows,
			);

			return {
				...state,
				uniqueColumnIDs: selectedColumnIDs,
				uniqueRowIDs: selectedRowIDs,
				cellSelectionRanges: [
					{
						top: action.top,
						left: action.left,
						bottom: action.top + action.height - 1,
						right: action.left + action.width - 1,
					},
				],
				rows: mapRows(state.rows, action.copiedValues2dArray, selectedColumnIDs, selectedRowIDs),
			};
		}
		// EVENT: Delete values
		case DELETE_VALUES: {
			console.log(state);
			const { cellSelectionRanges } = state;
			function removeKeyReducer(container, key) {
				const { [key]: value, ...rest } = container;
				return rest;
			}
			const newRows = cellSelectionRanges.reduce((rows, { top, left, bottom, right }) => {
				const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
					top,
					left,
					bottom,
					right,
					state.columns,
					state.rows,
				);
				return rows.map((row) => {
					if (selectedRowIDs.includes(row.id)) {
						return selectedColumnIDs.reduce(removeKeyReducer, row);
					} else {
						return row;
					}
				});
			}, state.rows);
			return { ...state, rows: newRows };
		}
		case MODIFY_CURRENT_SELECTION_CELL_RANGE: {
			const { lastSelection } = state;
			const currentCellSelectionRange = getRangeBoundaries({
				startRangeRow: lastSelection.row,
				startRangeColumn: lastSelection.column,
				endRangeRow,
				endRangeColumn,
			});
			const totalCellSelectionRanges = state.cellSelectionRanges.concat(currentCellSelectionRange);
			const uniqueRowIDs = generateUniqueRowIDs(totalCellSelectionRanges, state.rows);
			const uniqueColumnIDs = generateUniqueColumnIDs(totalCellSelectionRanges, state.columns);
			return state.currentCellSelectionRange
				? {
						...state,
						currentCellSelectionRange,
						uniqueRowIDs,
						uniqueColumnIDs,
					}
				: state;
		}
		// case MODIFY_CURRENT_SELECTION_ROW_RANGE: {
		// 	const { lastSelection } = state;
		// 	// Note: In this case I am checking the cellSelectionRanges directly instead of currentCellSelectionRange
		// 	return state.currentCellSelectionRange
		// 		? {
		// 				...state,
		// 				currentCellSelectionRange: getRangeBoundaries({
		// 					startRangeRow: lastSelection.row,
		// 					endRangeRow,
		// 					startRangeColumn: 1,
		// 					endRangeColumn: state.columns.length,
		// 				}),
		// 			}
		// 		: state;
		// }
		case REMOVE_SELECTED_CELLS: {
			return {
				...state,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
				uniqueRowIDs: [],
				uniqueColumnIDs: [],
				selectedRowIDs: [],
				activeCell: null,
			};
		}
		// EVENT: Select Cell
		case SELECT_CELL: {
			const { cellSelectionRanges = [] } = state;
			// track lastSelection to know where to begin range selection on drag
			const lastSelection = { row, column };
			const selectedCell = { top: row, bottom: row, left: column, right: column };
			const addSelectedCellToSelectionArray = cellSelectionRanges.concat(selectedCell);
			const currentRowIDs = selectionActive
				? !state.uniqueRowIDs.includes(action.rowId) ? state.uniqueRowIDs.concat(action.rowId) : state.uniqueRowIDs
				: [ action.rowId ];
			const currentColumnIDs = selectionActive ? state.uniqueColumnIDs.concat(action.columnId) : [ action.columnId ];
			// const currentColumnIDs = selectionActive ? state.uniqueColumnIDs.concat(action.columnId) : [ action.columnId ];
			// const totalCellSelectionRanges = selectionActive
			// 	? state.cellSelectionRanges.concat(selectedCell)
			// 	: [ selectedCell ];
			// const uniqueRowIDs = [ ...new Set(generateUniqueRowIDs(totalCellSelectionRanges, state.rows)) ];
			// AB: This kind of feels like unnecessary work to me
			// const addSelectedCellToSelectionArray = cellSelectionRanges.concat(
			// 	cellSelectionRanges.some((cell) => cell.top === selectedCell.top && cell.right === selectedCell.right)
			// 		? []
			// 		: selectedCell,
			// );
			return {
				...state,
				activeCell: null,
				lastSelection,
				currentRowIDs,
				// currentColumnIDs,
				cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [],
				currentCellSelectionRange: selectedCell,
				uniqueRowIDs: currentRowIDs,
				uniqueColumnIDs: currentColumnIDs,
			};
		}
		case SELECT_ROW: {
			const { cellSelectionRanges, columns } = state;
			const allCellsInRow = {
				top: rowIndex,
				left: 1,
				bottom: rowIndex,
				right: state.columns.length,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: allCellsInRow,
				cellSelectionRanges: selectionActive ? cellSelectionRanges.concat(allCellsInRow) : [ allCellsInRow ],
				lastSelection: { column: state.columns.length, row: rowIndex },
				uniqueRowIDs: [ action.rowId ],
				uniqueColumnIDs: columns.map((col) => col.id),
			};
		}
		// This is used when a rows array is supplied. Histogram bar clicks.
		case SELECT_CELLS: {
			const { cellSelectionRanges = [] } = state;
			const columnIndexOffset = 1;
			const computedColumnIndex = column + columnIndexOffset;
			const newSelectedCells = rows.map((rowIndex) => ({
				top: rowIndex,
				bottom: rowIndex,
				left: computedColumnIndex,
				right: computedColumnIndex,
			}));
			const newCellSelectionRanges = cellSelectionRanges.concat(newSelectedCells);
			return {
				...state,
				activeCell: null,
				cellSelectionRanges: newCellSelectionRanges,
			};
		}
		case SELECT_ALL_CELLS: {
			const allCells = {
				top: 0,
				left: 1,
				bottom: state.rows.length - 1,
				right: state.columns.length,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: null,
				cellSelectionRanges: [ allCells ],
				uniqueColumnIDs: state.columns.map((column) => column.id),
				uniqueRowIDs: state.rows.map((row) => row.id),
			};
		}
		case SELECT_COLUMN: {
			const { cellSelectionRanges, rows } = state;
			const allCellsInColumn = {
				top: 0,
				left: columnIndex + 1,
				bottom: state.rows.length - 1,
				right: columnIndex + 1,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: allCellsInColumn,
				cellSelectionRanges: selectionActive ? cellSelectionRanges.concat(allCellsInColumn) : [ allCellsInColumn ],
				uniqueColumnIDs: [ action.columnId ],
				uniqueRowIDs: rows.map((row) => row.id),
			};
		}
		// EVENT: Change layout
		case TOGGLE_LAYOUT: {
			return { ...state, layout };
		}
		// EVENT: Set grouped columns
		// case SET_GROUPED_COLUMNS: {
		// 	const matchColNameWithID = state.columns.find((col) => {
		// 		return col.label === setColName;
		// 	});

		// 	const groupByColumnID = matchColNameWithID && matchColNameWithID.id;
		// 	// Maybe we can make groupedColumns keep track of column properties such as label, etc
		// 	const groupedColumns = state.rows.reduce((acc, row) => {
		// 		const { [groupByColumnID]: _, ...restRow } = row;
		// 		return { ...acc, [row[groupByColumnID]]: (acc[row[groupByColumnID]] || []).concat(restRow) };
		// 	}, {});

		// 	const groupCount = Object.keys(groupedColumns).length;
		// 	const sortedNonGroupedColumns = state.columns.filter(({ id }) => id !== groupByColumnID).sort((colA, colB) => {
		// 		return state.columnPositions[colA.id] - state.columnPositions[colB.id];
		// 	});

		// 	// Given m logical columns and n different values in our group by column,
		// 	// we should have (m - 1) * n number of physical columns
		// 	const allPhysicalColumns = Array.from({ length: groupCount }).flatMap((_) => {
		// 		return sortedNonGroupedColumns.map((logicalColumn) => {
		// 			return { ...logicalColumn, id: createRandomID(), logicalColumn: logicalColumn.id };
		// 		});
		// 	});
		// 	const logicalRowGroups = Object.values(groupedColumns);
		// 	// the size of the largest group is the maximum number of physical rows
		// 	const physicalRowTotal = Math.max(...logicalRowGroups.map((group) => group.length));
		// 	// We have to translate the logical rows into physical rows
		// 	const physicalRows = state.rows.slice(0, physicalRowTotal).reduce((acc, _, index) => {
		// 		return acc.concat(
		// 			logicalRowGroups.reduce(
		// 				(physicalRow, group, groupIndex) => {
		// 					const logicalRow = group[index];
		// 					// If we have a valid logical row from our group, we then map the row values
		// 					// for all its logical column ids to refer to physical column ids
		// 					return logicalRow
		// 						? sortedNonGroupedColumns.reduce((acc, column, columnIndex, array) => {
		// 								// We compute the offset bvecause allPhysicalColumns is a flat list
		// 								const physicalColumn = allPhysicalColumns[columnIndex + groupIndex * array.length];
		// 								const result = { ...acc, [physicalColumn.id]: logicalRow[column.id] };
		// 								return result;
		// 							}, physicalRow)
		// 						: physicalRow;
		// 				},
		// 				{ id: createRandomID() },
		// 			),
		// 		);
		// 	}, []);

		// 	const physicalRowPositions = physicalRows.reduce((acc, row, index) => ({ ...acc, [row.id]: index }), {});
		// 	return {
		// 		...state,
		// 		setColName,
		// 		physicalRowPositions,
		// 		physicalRows,
		// 		groupedColumns,
		// 		groupByColumnID,
		// 		allPhysicalColumns,
		// 	};
		// }
		// EVENT: Context menu opened
		case OPEN_CONTEXT_MENU: {
			return {
				...state,
				colName,
				contextMenuOpen: true,
				contextMenuPosition,
				contextMenuType,
				contextMenuRowIndex: rowIndex,
			};
		}
		// EVENT: Context menu closed
		case CLOSE_CONTEXT_MENU: {
			return { ...state, contextMenuOpen: false };
		}
		// EVENT: Analysis Modal opened/closed
		case TOGGLE_ANALYSIS_MODAL: {
			return { ...state, analysisModalOpen, activeCell: null };
		}
		case TOGGLE_BAR_CHART_MODAL: {
			return { ...state, barChartModalOpen, activeCell: null };
		}
		// EVENT: Column Type Modal opened/closed
		case TOGGLE_COLUMN_TYPE_MODAL: {
			return {
				...state,
				activeCell: null,
				columnTypeModalOpen,
				selectedColumn: colName ? getCol(colName) : column,
				cellSelectionRanges: [],
				currentCellSelectionRange: [],
			};
		}
		// EVENT: Distribution Modal opened/closed
		case TOGGLE_DISTRIBUTION_MODAL: {
			return {
				...state,
				distributionModalOpen,
				activeCell: null,
				cellSelectionRanges: [],
				currentCellSelectionRange: [],
			};
		}
		// EVENT: Filter Modal opened/closed
		case TOGGLE_FILTER_MODAL: {
			return {
				...state,
				filterModalOpen,
				selectedColumn: null,
				activeCell: null,
				selectedColumns,
				filters: { numberFilters: [], stringFilters: [] },
			};
		}
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns };
		}
		// EVENT: Selected Cell translated
		case TRANSLATE_SELECTED_CELL: {
			const newCellSelectionRanges = [ { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex } ];
			return { ...state, cellSelectionRanges: newCellSelectionRanges, currentCellSelectionRange: null };
		}
		// EVENT: Cell updated
		case UPDATE_CELL: {
			const { activeCell, rows, columns } = state;
			// TODO: If active cell, use that, if selected cells, use top left corner of it
			if (!activeCell && !state.cellSelectionRanges.length > 0) return state;
			// row from action or last row from state
			const column = columns[columnIndex];
			const row = rows[rowIndex] || rows[rows.length - 1];
			const newRows = rows.slice();
			const { id: columnID } = column || columns[columns.length - 1];
			let rowCopy = Object.assign({}, row, { [columnID]: cellValue });

			const dependentColumns = columns.filter(({ type, formula }) => {
				return type === 'Formula' && formula.includes(columnID);
			});
			// If formula present
			if (dependentColumns.length) {
				const formulaParser = new Parser();
				formulaParser.on('callVariable', function(name, done) {
					const selectedColumn = columns.find((column) => column.id === name);
					if (selectedColumn) {
						done(rowCopy[selectedColumn.id]);
					}
				});
				rowCopy = dependentColumns.reduce((acc, column) => {
					return { ...acc, [column.id]: formulaParser.parse(column.formula).result };
				}, rowCopy);
			}

			const changedRows = newRows.map((newRow) => (newRow.id !== rowCopy.id ? newRow : rowCopy));
			return { ...state, rows: changedRows };
		}

		case SORT_COLUMN: {
			const columnID = getCol(action.colName).id;
			state.rows.sort(
				(a, b) => (action.descending ? [ b[columnID] ] - [ a[columnID] ] : [ a[columnID] ] - [ b[columnID] ]),
			);
			return { ...state };
		}
		case SET_FILTERS: {
			const stringFilterCopy = { ...state.filters.stringFilters, ...action.stringFilter };
			return {
				...state,
				selectedColumns: selectedColumns || state.selectedColumns,
				filters: {
					stringFilters: stringFilterCopy,
					numberFilters: action.numberFilters || state.filters.numberFilters,
				},
			};
		}
		case FILTER_COLUMN: {
			const filteredRowsByRange = filterRowsByColumnRange(state.filters.numberFilters, state.rows);
			const filteredRowsByString = () => {
				const newFilteredRowsByStringArray = [];
				state.rows.map((row) => {
					return Object.keys(state.filters.stringFilters).forEach((key) => {
						return state.filters.stringFilters[key].includes(row[key]) ? newFilteredRowsByStringArray.push(row) : null;
					});
				});
				return newFilteredRowsByStringArray;
			};
			const findIntersectionOfTwoArrays = (arr1 = [], arr2 = []) => {
				if (state.filters.numberFilters.length === 0) return arr1;
				if (state.filters.stringFilters.length === 0) return arr2;
				return arr1.filter((a) => arr2.some((b) => a.id === b.id));
			};
			const intersectionOfFilteredRows = findIntersectionOfTwoArrays(filteredRowsByString(), filteredRowsByRange);
			const selectedRangeRowIDs = intersectionOfFilteredRows.map((row) => row.id);
			const selectedStringRowIDs = filteredRowsByString().map((row) => row.id);
			const intersectionOfRowIDs = selectedRangeRowIDs.filter((rangeID) => selectedStringRowIDs.includes(rangeID));
			const selectedRowIndexes = intersectionOfFilteredRows.map((row) =>
				state.rows.findIndex((stateRow) => stateRow.id === row.id),
			);
			const selectedRowObjects = selectedRowIndexes.map((rowIndex) => {
				return {
					top: rowIndex,
					left: 1,
					bottom: rowIndex,
					right: state.columns.length,
				};
			});
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: selectedRowObjects,
				cellSelectionRanges: selectedRowObjects,
				uniqueRowIDs: intersectionOfRowIDs,
				uniqueColumnIDs: state.columns.map((col) => col.id),
			};
		}
		case UPDATE_COLUMN: {
			// TODO: Make it so a formula cannot refer to itself. Detect formula cycles. Use a stack?
			const columnHasFormula = updatedColumn.formula && updatedColumn.type === 'Formula';
			const columnCopy = Object.assign(
				{},
				updatedColumn,
				columnHasFormula ? { formula: translateLabelToID(state.columns, updatedColumn.formula) } : {},
			);
			const originalPosition = state.columns.findIndex((col) => col.id === columnCopy.id);
			const updatedColumns = state.columns
				.slice(0, originalPosition)
				.concat(columnCopy)
				.concat(state.columns.slice(originalPosition + 1));
			let rows = state.rows;
			if (columnHasFormula) {
				rows = rows.map((row) => {
					const formulaColumnsToUpdate = [ columnCopy ].concat(
						state.columns.filter(({ type, formula }) => {
							return type === 'Formula' && formula.includes(columnCopy.id);
						}),
					);
					const formulaParser = new Parser();
					// Not getting called
					formulaParser.on('callVariable', function(name, done) {
						const selectedColumn = state.columns.find((column) => column.id === name);
						if (selectedColumn) {
							done(row[selectedColumn.id]);
						}
					});
					return formulaColumnsToUpdate.reduce((acc, column) => {
						row = acc;
						const {
							result,
							// error
						} = formulaParser.parse(column.formula);
						return { ...acc, [column.id]: result };
					}, row);
				});
			}
			return { ...state, columns: updatedColumns, rows };
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}

export function useSpreadsheetState() {
	const context = React.useContext(SpreadsheetStateContext);
	if (context === undefined) {
		throw new Error('useCountState must be used within a CountProvider');
	}
	return context;
}
export function useSpreadsheetDispatch() {
	const context = React.useContext(SpreadsheetDispatchContext);
	if (context === undefined) {
		throw new Error('useCountDispatch must be used within a CountProvider');
	}
	return context;
}

export function SpreadsheetProvider({ eventBus, children }) {
	// dummy data
	const statsColumns = [
		{ id: '_abc1_', modelingType: 'Continuous', type: 'Number', label: 'Volume displaced (ml)' },
		{ id: '_abc2_', modelingType: 'Continuous', type: 'Number', label: 'Time (sec)' },
		{ id: '_abc3_', modelingType: 'Continuous', type: 'Number', label: 'Rate (ml/sec)' },
		{ id: '_abc4_', modelingType: 'Nominal', type: 'String', label: 'Catalase solution' },
	];

	// const startingColumn = [ { modelingType: 'Continuous', type: 'String', label: 'Column 1' } ];
	// Starting columns
	// const columns = statsColumns
	// 	.map((metadata) => ({ id: metadata.id || createRandomLetterString(), ...metadata }))
	// 	.map((column, _, array) => {
	// 		const { formula, ...rest } = column;
	// 		if (formula) {
	// 			const newFormula = array
	// 				.filter((someColumn) => formula.includes(someColumn.label))
	// 				.reduce((changedFormula, someColumn) => {
	// 					return changedFormula.replace(new RegExp(`\\b${someColumn.label}\\b`, 'g'), `${someColumn.id}`);
	// 				}, formula);
	// 			return { ...rest, formula: newFormula };
	// 		}
	// 		return column;
	// 	});

	const potatoLiverData = `35	3	1.0606060606	Liver
    32	5.9	5.4237288136	Liver
    36	4.9	7.3469387755	Liver
    40	4	10	Liver
    41	9	4.5555555556	Liver
    40	7.8	5.1282051282	Liver
    41	8.5	4.8235294118	Liver
    23	6.5	3.5384615385	Liver
    46	3.4	13.529411765	Liver
    45	3.1	14.516129032	Liver
    4	14.9	0.2684563758	Potato
    7	26.7	0.2621722846	Potato
    5	22.1	0.2262443439	Potato
    6	29.6	0.2027027027	Potato
    5	26.8	0.1865671642	Potato
    6	32.1	0.1869158879	Potato
    7	32.9	0.2127659574	Potato
    6	33.4	0.1796407186	Potato
    5	32.7	0.1529051988	Potato
    5	31.6	0.1582278481	Potato`;

	// quickly build rows out of copy/pasted data
	function createRows(table) {
		const tableRows = table.split('\n');
		const table2d = tableRows.map((row) => row.split('\t'));
		const rows = [];
		for (let i = 0; i < table2d.length; i++) {
			const obj = { id: createRandomID() };
			for (let j = 0; j < statsColumns.length; j++) {
				obj[statsColumns[j].id] = table2d[i][j];
			}
			rows.push(obj);
		}
		return rows;
	}

	const initialState = {
		eventBus,
		activeCell: null,
		analysisModalOpen: false,
		analysisWindowOpen: false,
		barChartModalOpen: false,
		cellSelectionRanges: [],
		columnTypeModalOpen: false,
		colHeaderContext: false,
		columns: statsColumns,
		colName: null,
		contextMenuOpen: false,
		contextMenuPosition: null,
		contextMenuRowIndex: null,
		currentCellSelectionRange: null,
		distributionModalOpen: false,
		excludedRows: [],
		filters: {
			stringFilters: [],
			numberFilters: [],
		},
		filterModalOpen: false,
		lastSelection: { row: 1, column: 1 },
		layout: true,
		rows: createRows(potatoLiverData),
		selectedColumns: [],
		selectDisabled: false,
		selectedRowIDs: [],
		totalSelectedRows: 0,
		uniqueRowIDs: [],
		uniqueColumnIDs: [],
	};
	const [ state, changeSpreadsheet ] = useReducer(spreadsheetReducer, initialState);
	return (
		<SpreadsheetStateContext.Provider value={state}>
			<SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>{children}</SpreadsheetDispatchContext.Provider>
		</SpreadsheetStateContext.Provider>
	);
}
