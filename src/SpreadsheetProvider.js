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
	DELETE_ROW,
	DELETE_COLUMN,
	DELETE_VALUES,
	EXCLUDE_ROWS,
	FILTER_COLUMN,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	MODIFY_CURRENT_SELECTION_ROW_RANGE,
	PASTE_VALUES,
	REMOVE_SELECTED_CELLS,
	SET_SELECTED_COLUMN,
	SELECT_CELL,
	SELECT_CELLS,
	SELECT_ALL_CELLS,
	SELECT_ROW,
	SELECT_COLUMN,
	SORT_COLUMN,
	OPEN_CONTEXT_MENU,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
	TOGGLE_LAYOUT,
	TRANSLATE_SELECTED_CELL,
	UNEXCLUDE_ROWS,
	UPDATE_CELL,
	UPDATE_COLUMN,
} from './constants';

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
			return { ...state, activeCell, cellSelectionRanges: [], selectedRowIDs: [] };
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
		case DELETE_ROW: {
			const slicedRows = state.rows.slice(0, rowIndex).concat(state.rows.slice(rowIndex + 1));
			return {
				...state,
				rows: slicedRows,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
				selectedRowIDs: [],
				activeCell: null,
			};
		}
		case EXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows } = state;
			const range = (start, end) => Array(end - start + 1).fill().map((_, idx) => start + idx);
			const selectedRows = cellSelectionRanges.map((row) => range(row.top, row.bottom));
			const flattenedUniqueRowIndexes = [ ...new Set(selectedRows.flat()) ];
			const excludedRowIDs = state.rows
				.map((row, i) => flattenedUniqueRowIndexes.includes(i) && row.id)
				.filter((x) => x);
			return {
				...state,
				excludedRows: excludedRows.concat(excludedRowIDs),
			};
		}
		case UNEXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows } = state;
			const range = (start, end) => Array(end - start + 1).fill().map((_, idx) => start + idx);
			const selectedRows = cellSelectionRanges.map((row) => range(row.top, row.bottom));
			const flattenedUniqueRowIndexes = [ ...new Set(selectedRows.flat()) ];
			return {
				...state,
				excludedRows: excludedRows.filter((row) => !flattenedUniqueRowIndexes.includes(row)),
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
			const { currentCellSelectionRange, lastSelection } = state;
			return currentCellSelectionRange
				? {
						...state,
						currentCellSelectionRange: getRangeBoundaries({
							startRangeRow: lastSelection.row,
							startRangeColumn: lastSelection.column,
							endRangeRow,
							endRangeColumn,
						}),
					}
				: state;
		}
		case MODIFY_CURRENT_SELECTION_ROW_RANGE: {
			const { lastSelection } = state;
			// Note: In this case I am checking the cellSelectionRanges directly instead of currentCellSelectionRange
			return state.cellSelectionRanges
				? {
						...state,
						currentCellSelectionRange: getRangeBoundaries({
							startRangeRow: lastSelection.row,
							endRangeRow,
							startRangeColumn: 1,
							endRangeColumn: state.columns.length,
						}),
					}
				: state;
		}
		case REMOVE_SELECTED_CELLS: {
			return {
				...state,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
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
				selectedRowIDs: selectionActive ? addSelectedCellToSelectionArray : [],
				cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [],
				currentCellSelectionRange: selectedCell,
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
			return { ...state, activeCell: null, currentCellSelectionRange: null, cellSelectionRanges: [ allCells ] };
		}
		case SELECT_ROW: {
			const { cellSelectionRanges } = state;
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
				lastSelection: { row: rowIndex },
			};
		}
		case SELECT_COLUMN: {
			const { cellSelectionRanges } = state;
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
		// EVENT: Column Type Modal opened/closed
		case TOGGLE_COLUMN_TYPE_MODAL: {
			return {
				...state,
				activeCell: null,
				columnTypeModalOpen,
				selectedColumn: colName ? getCol(colName) : column,
				cellSelectionRanges: [],
				selectedRowIDs: [],
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
				selectedRowIDs: [],
				currentCellSelectionRange: [],
			};
		}
		// EVENT: Filter Modal opened/closed
		case TOGGLE_FILTER_MODAL: {
			return { ...state, filterModalOpen, selectedColumn: null, activeCell: null, selectedColumns };
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

		case FILTER_COLUMN: {
			const selectedRowIndexes = filterRowsByColumnRange(selectedColumns, state.rows).map((row) =>
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
				selectedColumns,
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
		{ id: '_abc1_', modelingType: 'Continuous', type: 'String', label: 'Distance' },
		{ id: '_abc2_', modelingType: 'Nominal', type: 'String', label: 'Trial' },
		{ id: '_abc3_', modelingType: 'Continuous', type: 'String', label: 'Bubbles' },
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

	// const rows = [
	// 	{ id: 'TAuW6mThoE', _abc1_: 10, _abc2_: 1, _abc3_: 12 },
	// 	{ id: 'M8nnC1HOtZ', _abc1_: 20, _abc2_: 1, _abc3_: 10 },
	// 	{ id: '40M1CkzXjf', _abc1_: 30, _abc2_: 1, _abc3_: 7 },
	// 	{ id: 'k4iHEVoqwH', _abc1_: 40, _abc2_: 1, _abc3_: 6 },
	// 	{ id: 'ClJ3vuN1sm', _abc1_: 50, _abc2_: 1, _abc3_: 2 },
	// 	{ id: 'P8QKAfq0p3', _abc1_: 10, _abc2_: 2, _abc3_: 10 },
	// 	{ id: 'BwbMIyqR02', _abc1_: 20, _abc2_: 2, _abc3_: 9 },
	// 	{ id: '1jQEPLCQG5', _abc1_: 30, _abc2_: 2, _abc3_: 6 },
	// 	{ id: 'CpbYoyqKLu', _abc1_: 40, _abc2_: 2, _abc3_: 4 },
	// 	{ id: '6aqCyUXGCz', _abc1_: 50, _abc2_: 2, _abc3_: 4 },
	// 	{ id: 'v8CTMPmxTH', _abc1_: 10, _abc2_: 3, _abc3_: 12 },
	// 	{ id: 'BurrXxh2Hr', _abc1_: 20, _abc2_: 3, _abc3_: 9 },
	// 	{ id: 'Sncc15wqAZ', _abc1_: 30, _abc2_: 3, _abc3_: 8 },
	// 	{ id: 'HQyQ6fNRr4', _abc1_: 40, _abc2_: 3, _abc3_: 5 },
	// 	{ id: 'E6C3iDxM6x', _abc1_: 50, _abc2_: 3, _abc3_: 3 },
	// 	{ id: 'fhcDfTfBN6', _abc1_: 10, _abc2_: 4, _abc3_: 11 },
	// 	{ id: '20c5IrknI5', _abc1_: 20, _abc2_: 4, _abc3_: 8 },
	// 	{ id: 'mqvjLZ3FNy', _abc1_: 30, _abc2_: 4, _abc3_: 7 },
	// 	{ id: 'vroRsjPJxn', _abc1_: 40, _abc2_: 4, _abc3_: 6 },
	// 	{ id: '5B0FbggMZw', _abc1_: 50, _abc2_: 4, _abc3_: 2 },
	// 	{ id: 'vsLMcp9h1V', _abc1_: 10, _abc2_: 5, _abc3_: 11 },
	// 	{ id: 'fX5eXO2VrP', _abc1_: 20, _abc2_: 5, _abc3_: 10 },
	// 	{ id: 'MxrCy4Ssa0', _abc1_: 30, _abc2_: 5, _abc3_: 7 },
	// 	{ id: 'cgFBU9cf2i', _abc1_: 40, _abc2_: 5, _abc3_: 5 },
	// 	{ id: 'AaD3W8solA', _abc1_: 50, _abc2_: 5, _abc3_: 3 },
	// ];

	const rows = [
		{ id: 'TAuW6mThoE', _abc1_: 37, _abc2_: 48, _abc3_: 1 },
		{ id: 'M8nnC1HOtZ', _abc1_: 46, _abc2_: 56, _abc3_: 1 },
		{ id: '40M1CkzXjf', _abc1_: 36, _abc2_: 44, _abc3_: 2 },
		{ id: 'k4iHEVoqwH', _abc1_: 41, _abc2_: 82, _abc3_: 2 },
		{ id: 'ClJ3vuN1sm', _abc1_: 40, _abc2_: 62, _abc3_: 1 },
		{ id: 'P8QKAfq0p3', _abc1_: 39, _abc2_: 79, _abc3_: 2 },
		{ id: 'BwbMIyqR02', _abc1_: 38, _abc2_: 64, _abc3_: 2 },
		{ id: '1jQEPLCQG5', _abc1_: 44, _abc2_: 51, _abc3_: 1 },
		{ id: 'CpbYoyqKLu', _abc1_: 42, _abc2_: 48, _abc3_: 1 },
		{ id: '6aqCyUXGCz', _abc1_: 38, _abc2_: 51, _abc3_: 1 },
		{ id: 'v8CTMPmxTH', _abc1_: 37, _abc2_: 75, _abc3_: 1 },
		{ id: 'BurrXxh2Hr', _abc1_: 26, _abc2_: 53, _abc3_: 2 },
		{ id: 'Sncc15wqAZ', _abc1_: 39, _abc2_: 65, _abc3_: 2 },
		{ id: 'HQyQ6fNRr4', _abc1_: 34, _abc2_: 83, _abc3_: 2 },
		{ id: 'E6C3iDxM6x', _abc1_: 33, _abc2_: 44, _abc3_: 2 },
		{ id: 'fhcDfTfBN6', _abc1_: 42, _abc2_: 42, _abc3_: 2 },
		{ id: '20c5IrknI5', _abc1_: 38, _abc2_: 78, _abc3_: 1 },
		{ id: 'mqvjLZ3FNy', _abc1_: 45, _abc2_: 64, _abc3_: 1 },
		{ id: 'vroRsjPJxn', _abc1_: 33, _abc2_: 33, _abc3_: 2 },
		{ id: '5B0FbggMZw', _abc1_: 43, _abc2_: 87, _abc3_: 1 },
		{ id: 'vsLMcp9h1V', _abc1_: 36, _abc2_: 75, _abc3_: 1 },
		{ id: 'fX5eXO2VrP', _abc1_: 36, _abc2_: 84, _abc3_: 1 },
		{ id: 'MxrCy4Ssa0', _abc1_: 39, _abc2_: 57, _abc3_: 2 },
		{ id: 'cgFBU9cf2i', _abc1_: 49, _abc2_: 79, _abc3_: 2 },
		{ id: 'AaD3W8solA', _abc1_: 45, _abc2_: 55, _abc3_: 2 },
		//
		// { id: 'AAuW6mThoE', _abc1_: 37, _abc2_: 48, _abc3_: 1 },
		// { id: 'B8nnC1HOtZ', _abc1_: 46, _abc2_: 56, _abc3_: 1 },
		// { id: 'C0M1CkzXjf', _abc1_: 36, _abc2_: 44, _abc3_: 2 },
		// { id: 'D4iHEVoqwH', _abc1_: 41, _abc2_: 82, _abc3_: 2 },
		// { id: 'ElJ3vuN1sm', _abc1_: 40, _abc2_: 62, _abc3_: 1 },
		// { id: 'F8QKAfq0p3', _abc1_: 39, _abc2_: 79, _abc3_: 2 },
		// { id: 'GwbMIyqR02', _abc1_: 38, _abc2_: 64, _abc3_: 2 },
		// { id: 'HjQEPLCQG5', _abc1_: 44, _abc2_: 51, _abc3_: 1 },
		// { id: 'IpbYoyqKLu', _abc1_: 42, _abc2_: 48, _abc3_: 1 },
		// { id: 'JaqCyUXGCz', _abc1_: 38, _abc2_: 51, _abc3_: 1 },
		// { id: 'K8CTMPmxTH', _abc1_: 37, _abc2_: 75, _abc3_: 1 },
		// { id: 'LurrXxh2Hr', _abc1_: 26, _abc2_: 53, _abc3_: 2 },
		// { id: 'Mncc15wqAZ', _abc1_: 39, _abc2_: 65, _abc3_: 2 },
		// { id: 'NQyQ6fNRr4', _abc1_: 34, _abc2_: 83, _abc3_: 2 },
		// { id: 'O6C3iDxM6x', _abc1_: 33, _abc2_: 44, _abc3_: 2 },
		// { id: 'PhcDfTfBN6', _abc1_: 42, _abc2_: 42, _abc3_: 2 },
		// { id: 'Q0c5IrknI5', _abc1_: 38, _abc2_: 78, _abc3_: 1 },
		// { id: 'RqvjLZ3FNy', _abc1_: 45, _abc2_: 64, _abc3_: 1 },
		// { id: 'SroRsjPJxn', _abc1_: 33, _abc2_: 33, _abc3_: 2 },
		// { id: 'TB0FbggMZw', _abc1_: 43, _abc2_: 87, _abc3_: 1 },
		// { id: 'UsLMcp9h1V', _abc1_: 36, _abc2_: 75, _abc3_: 1 },
		// { id: 'VX5eXO2VrP', _abc1_: 36, _abc2_: 84, _abc3_: 1 },
		// { id: 'WxrCy4Ssa0', _abc1_: 39, _abc2_: 57, _abc3_: 2 },
		// { id: 'XgFBU9cf2i', _abc1_: 49, _abc2_: 79, _abc3_: 2 },
		// { id: 'YaD3W8solA', _abc1_: 45, _abc2_: 55, _abc3_: 2 },
	];

	const initialState = {
		eventBus,
		activeCell: null,
		analysisModalOpen: false,
		analysisWindowOpen: false,
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
		excludedRows: [ 'P8QKAfq0p3' ],
		filterModalOpen: false,
		lastSelection: { row: 1, column: 1 },
		layout: true,
		rows,
		selectedColumns: [],
		selectDisabled: false,
		selectedRowIDs: [],
	};
	const [ state, changeSpreadsheet ] = useReducer(spreadsheetReducer, initialState);
	return (
		<SpreadsheetStateContext.Provider value={state}>
			<SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>{children}</SpreadsheetDispatchContext.Provider>
		</SpreadsheetStateContext.Provider>
	);
}
