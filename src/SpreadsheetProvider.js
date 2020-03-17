import React, { useReducer } from 'react';
import nerdamer from 'nerdamer';
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
	DELETE_FILTER,
	DELETE_VALUES,
	EXCLUDE_ROWS,
	FILTER_COLUMN,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	OPEN_CONTEXT_MENU,
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
	SET_MODAL_ERROR,
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
	CONTINUOUS,
	NOMINAL,
	STRING,
	FORMULA,
	NUMBER,
} from './constants';

function updateRow(row, columnID, columns, dependencyMap) {
	const columnIDtoIndexMap = columns.reduce((acc, { id }, index) => {
		return { ...acc, [id]: index };
	}, {});
	const getDependentColumns = (column) => {
		return column ? [ column ].concat((dependencyMap[column] || []).map(getDependentColumns)) : [];
	};
	const dependencyList = [ columnID ].map(getDependentColumns).flat(Infinity);
	try {
		const updatedRow = dependencyList.reduce((rowSoFar, columnID) => {
			const columnIndex = columnIDtoIndexMap[columnID];
			const columnFormula = columns[columnIndex].formula.expression;
			const updatedFormula = swapIDsForValuesInRow(columnFormula, rowSoFar, columns);
			const containsLetters = (input) => /[A-Za-z]/.test(input);
			if (updatedFormula === 'REFERROR') {
				return {
					...rowSoFar,
					[columnID]: { error: '#REF', errorMessage: 'Variable referenced in formula is invalid' },
				};
			}
			if (containsLetters(updatedFormula)) {
				return {
					...rowSoFar,
					[columnID]: { error: '#FORMERR', errorMessage: 'There is a problem with the formula' },
				};
			}
			return {
				...rowSoFar,
				[columnID]: nerdamer(updatedFormula).text('decimals'),
			};
		}, row);
		return updatedRow;
	} catch (e) {
		console.log('could not create row', e);
		return { ...row, [columnID]: { error: e.name, errorMessage: e.message } };
	}
}

function updateRows(rows, columnID, columns, dependencyMap) {
	return rows
		.map((row) => {
			return updateRow(row, columnID, columns, dependencyMap);
		})
		.filter((x) => x);
}

function findCyclicDependencies(definitions, identifier) {
	const stack = [];

	// Internal search function.
	const internalSearch = function(currentIdentifier) {
		if (stack.indexOf(currentIdentifier) !== -1) {
			return currentIdentifier === identifier;
		}
		stack.push(currentIdentifier);

		// Check all of the child nodes to see if they contain the node we are looking for.
		const found = definitions[currentIdentifier] && definitions[currentIdentifier].some(internalSearch);

		// Remove the current node from the stack if it's children do not contain the node we are looking for.
		if (!found) {
			stack.splice(stack.indexOf(currentIdentifier), 1);
		}
		return found;
	};

	// If there isn't a cyclic dependency then we return an empty array, otherwise we return the stack.
	return internalSearch(identifier) ? stack.concat(identifier) : [];
}

function swapIDsForValuesInRow(oldExpression, row, columns) {
	let newExpression = '';
	Object.keys(row).forEach((rowKey) => {
		// console.log(oldExpression, rowKey);
		if (newExpression.includes(rowKey) || oldExpression.includes(rowKey)) {
			newExpression = newExpression
				? newExpression.split(rowKey).join(row[rowKey])
				: oldExpression.split(rowKey).join(row[rowKey]);
		}
	});
	columns.forEach((col) => {
		if (newExpression.includes(col.id)) {
			newExpression = 'REFERROR';
		}
	});
	return newExpression || oldExpression;
}

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

function filterRowsByString(rows, filters) {
	const newFilteredRowsByStringArray = [];
	rows.map((row) => {
		return Object.keys(filters.stringFilters).forEach((key) => {
			return filters.stringFilters[key].includes(row[key]) ? newFilteredRowsByStringArray.push(row) : null;
		});
	});
	return newFilteredRowsByStringArray;
}
function findIntersectionOfTwoArrays(arr1, arr2) {
	return arr2.filter((a) => arr1.some((b) => a === b));
}

function returnIntersectionOrNonEmptyArray(arr1, arr2) {
	const intersectionOfArr1AndArr2 = findIntersectionOfTwoArrays(arr1, arr2);
	if (arr1.length !== 0 && arr2.length !== 0) {
		return intersectionOfArr1AndArr2;
	} else if (arr1.length === 0) {
		return arr2;
	} else if (arr2.length === 0) {
		return arr1;
	}
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
		columnID,
		columnIndex,
		columnTypeModalOpen,
		copiedValues2dArray,
		newInputCellValue,
		descending,
		distributionModalOpen,
		endRangeRow,
		endRangeColumn,
		filters,
		filterModalOpen,
		layout,
		modalError,
		numberFilters,
		row,
		rowCount,
		rowID,
		rowIndex,
		rows,
		selectionActive,
		selectedColumns,
		selectedText,
		stringFilter,
		updatedColumn,
		top,
		left,
		height,
		width,
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
			const activeCell = { row, column, columnID };
			return {
				...state,
				activeCell,
				cellSelectionRanges: [],
				newInputCellValue,
				uniqueRowIDs: [],
				uniqueColumnIDs: [],
				selectedText,
			};
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
			let columnCounter = state.columnCounter || state.columns.length;
			const newColumns = Array(columnCount).fill(undefined).map((_, i) => {
				const id = createRandomLetterString();
				columnCounter++;
				return { id, modelingType: CONTINUOUS, type: NUMBER, label: `Column ${columnCounter}` };
			});
			const columns = state.columns.concat(newColumns);
			return { ...state, columns, columnCounter };
		}
		case CREATE_ROWS: {
			const newRows = Array(rowCount).fill(undefined).map((_) => {
				return { id: createRandomID() };
			});
			return { ...state, rows: state.rows.concat(newRows) };
		}
		case DELETE_COLUMN: {
			const { rows } = state;
			const column = getCol(colName);
			const columnID = column.id;
			const filteredColumns = state.columns.filter((col) => col.id !== columnID);

			const newRows = rows.reduce((acc, currentRow) => {
				const { [columnID]: value, ...rest } = currentRow;
				return [ ...acc, rest ];
			}, []);

			const updatedFormulaRows = newRows.map((row) => {
				let rowCopy = { ...row };
				if (Array.isArray(state.inverseDependencyMap[columnID])) {
					for (const dependencyColumnID of state.inverseDependencyMap[columnID]) {
						rowCopy = updateRow(rowCopy, dependencyColumnID, state.columns, state.inverseDependencyMap);
					}
				}
				return rowCopy;
			});
			return {
				...state,
				rows: updatedFormulaRows,
				columns: filteredColumns,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
				selectedRowIDs: [],
				activeCell: null,
			};
		}
		case DELETE_ROWS: {
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
				top,
				left,
				top + height - 1,
				left + width - 1,
				state.columns,
				state.rows,
			);

			return {
				...state,
				uniqueColumnIDs: selectedColumnIDs,
				uniqueRowIDs: selectedRowIDs,
				cellSelectionRanges: [
					{
						top: top,
						left: left,
						bottom: top + height - 1,
						right: left + width - 1,
					},
				],
				rows: mapRows(state.rows, copiedValues2dArray, selectedColumnIDs, selectedRowIDs),
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
					let rowCopy = { ...row };
					if (selectedRowIDs.includes(rowCopy.id)) {
						const rowWithKeysRemoved = selectedColumnIDs.reduce(removeKeyReducer, rowCopy);
						return selectedColumnIDs.reduce((newRow, colID) => {
							if (Array.isArray(state.inverseDependencyMap[colID])) {
								for (const dependencyColumnID of state.inverseDependencyMap[colID]) {
									return (rowCopy = updateRow(
										rowWithKeysRemoved,
										dependencyColumnID,
										state.columns,
										state.inverseDependencyMap,
									));
								}
							}
							return newRow;
						}, rowWithKeysRemoved);
					} else {
						return rowCopy;
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
				? !state.uniqueRowIDs.includes(rowID) ? state.uniqueRowIDs.concat(rowID) : state.uniqueRowIDs
				: [ rowID ];
			const currentColumnIDs = selectionActive ? state.uniqueColumnIDs.concat(columnID) : [ columnID ];
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
				uniqueRowIDs: [ rowID ],
				uniqueColumnIDs: columns.map((col) => col.id),
			};
		}
		// This is used when a rows array is supplied. Histogram bar clicks.
		case SELECT_CELLS: {
			const { cellSelectionRanges = [] } = state;
			const columnIndexOffset = 1;
			const computedColumnIndex = column + columnIndexOffset;
			const rowIDs = rows.map((row) => state.rows[row].id);
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
				uniqueRowIDs: rowIDs,
				uniqueColumnIDs: [ state.columns[column].id ],
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
				uniqueColumnIDs: [ columnID ],
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
				modalError: null,
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
				selectedColumns: [],
				filters: { numberFilters: [], stringFilters: [] },
			};
		}
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns };
		}
		// EVENT: Selected Cell translated
		case TRANSLATE_SELECTED_CELL: {
			const newCellSelectionRanges = [ { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex } ];
			const rowID = state.rows[rowIndex].id;
			const columnID = state.columns[columnIndex - 1].id;
			return {
				...state,
				cellSelectionRanges: newCellSelectionRanges,
				currentCellSelectionRange: null,
				uniqueColumnIDs: [ columnID ],
				uniqueRowIDs: [ rowID ],
			};
		}
		// EVENT: Cell updated
		case UPDATE_CELL: {
			const { rows, columns } = state;
			// TODO: If active cell, use that, if selected cells, use top left corner of it
			// row from action or last row from state
			const column = columns[columnIndex];
			const row = rows[rowIndex] || rows[rows.length - 1];
			const newRows = rows.slice();
			const { id: columnID } = column || columns[columns.length - 1];
			let rowCopy = { ...row, [columnID]: cellValue };
			if (Array.isArray(state.inverseDependencyMap[columnID])) {
				for (const dependencyColumnID of state.inverseDependencyMap[columnID]) {
					rowCopy = updateRow(rowCopy, dependencyColumnID, state.columns, state.inverseDependencyMap);
				}
			}

			const changedRows = Object.assign(newRows, { [rowIndex]: rowCopy });
			return { ...state, rows: changedRows };
		}

		case SORT_COLUMN: {
			const columnID = getCol(colName).id;
			state.rows.sort((a, b) => (descending ? [ b[columnID] ] - [ a[columnID] ] : [ a[columnID] ] - [ b[columnID] ]));
			return { ...state };
		}
		case SET_FILTERS: {
			const stringFilterCopy = { ...state.filters.stringFilters, ...stringFilter };
			return {
				...state,
				selectedColumns: selectedColumns || state.selectedColumns,
				filters: {
					stringFilters: stringFilterCopy,
					numberFilters: numberFilters || state.filters.numberFilters,
				},
			};
		}
		case DELETE_FILTER: {
			return { ...state, filters, selectedColumns };
		}
		case FILTER_COLUMN: {
			const filteredRowsByRange = filterRowsByColumnRange(state.filters.numberFilters, state.rows);
			const filteredRowsByString = filterRowsByString(state.rows, state.filters);
			const filteredRows = returnIntersectionOrNonEmptyArray(filteredRowsByRange, filteredRowsByString);
			const filteredRowIDs = filteredRows.map((row) => row.id);
			const selectedRowIndexes = filteredRows.map((row) => state.rows.findIndex((stateRow) => stateRow.id === row.id));
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
				uniqueRowIDs: filteredRowIDs,
				uniqueColumnIDs: state.columns.map((col) => col.id),
			};
		}
		case SET_MODAL_ERROR: {
			return { ...state, modalError };
		}
		case UPDATE_COLUMN: {
			const columnCopy = { ...updatedColumn };
			const originalPosition = state.columns.findIndex((col) => col.id === columnCopy.id);
			const updatedColumns = state.columns
				.slice(0, originalPosition)
				.concat(columnCopy)
				.concat(state.columns.slice(originalPosition + 1));

			if (columnCopy.formula && columnCopy.formula.expression && columnCopy.formula.expression.trim()) {
				const formulaColumns = updatedColumns.filter(({ type }) => {
					return type === FORMULA;
				});
				const inverseDependencyMap = formulaColumns.reduce((invDepMap, formulaColumn) => {
					return (
						formulaColumn.formula &&
						formulaColumn.formula.IDs.reduce((acc, dependentColumnID) => {
							return { ...acc, [dependentColumnID]: (acc[dependentColumnID] || []).concat(formulaColumn.id) };
						}, invDepMap)
					);
				}, {});

				const cycles = findCyclicDependencies(inverseDependencyMap, columnCopy.id);
				if (cycles.length > 0) {
					console.log('cycle detected. stack: ', cycles);
					return { ...state, modalError: 'Reference Error - Infinite cycle detected' };
				}

				const updatedRows = updateRows(state.rows, columnCopy.id, updatedColumns, inverseDependencyMap);

				if (updatedRows.length === 0) {
					return {
						...state,
						modalError: 'Invalid formula entered',
					};
				}

				return {
					...state,
					columns: updatedColumns,
					columnTypeModalOpen: false,
					selectedColumn: null,
					rows: updatedRows.length > 0 ? updatedRows : state.rows,
					modalError: null,
					inverseDependencyMap,
				};
			}

			return {
				...state,
				columns: updatedColumns,
				columnTypeModalOpen: false,
				modalError: null,
				selectedColumn: null,
			};
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
		{ id: '_abc1_', modelingType: CONTINUOUS, type: NUMBER, units: 'ml', label: 'Volume Displaced' },
		{ id: '_abc2_', modelingType: NOMINAL, type: NUMBER, units: 'sec', label: 'Time' },
		{
			id: '_abc3_',
			modelingType: CONTINUOUS,
			formula: { expression: '_abc1_/_abc2_', IDs: [ '_abc1_, _abc2_' ] },
			type: FORMULA,
			units: 'ml/sec',
			label: 'Rate',
		},
		{ id: '_abc4_', modelingType: NOMINAL, type: STRING, units: '', label: 'Catalase Solution' },
	];

	const startingColumn = [
		{
			id: '_abc1_',
			modelingType: CONTINUOUS,
			type: NUMBER,
			units: '',
			label: 'Column 1',
		},
	];

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
		// First column created will be "Column 2"
		columnCounter: 1,
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
		inverseDependencyMap: {},
		lastSelection: { row: 1, column: 1 },
		layout: true,
		mappedColumns: {},
		modalError: false,
		rows: createRows(potatoLiverData),
		selectedColumns: [],
		selectedText: false,
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
