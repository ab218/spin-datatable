import React, { useReducer } from 'react';
import { Parser } from 'hot-formula-parser';
import './App.css';
import { pondEcologyRows } from './dummyData.js';
import {
	ACTIVATE_CELL,
	ADD_CELL_TO_SELECTIONS,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	DELETE_VALUES,
	FILTER_COLUMN,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	PASTE_VALUES,
	REMOVE_SELECTED_CELLS,
	SET_GROUPED_COLUMNS,
	SET_ROW_POSITION,
	SET_SELECTED_COLUMN,
	SELECT_CELL,
	SELECT_CELLS,
	SORT_COLUMN,
	OPEN_CONTEXT_MENU,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
	TOGGLE_LAYOUT,
	TRANSLATE_SELECTED_CELL,
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

function selectRowAndColumnIDs(top, left, bottom, right, columnPositions, rowPositions) {
	const selectedColumnPositions = Object.entries(columnPositions).filter(([ _, position ]) => {
		// Subtract one because of header column
		return position >= left - 1 && position <= right - 1;
	});
	const selectedColumnIDs = selectedColumnPositions.map(([ id ]) => id);
	const selectedRowPositions = Object.entries(rowPositions).filter(([ _, position ]) => {
		return position >= top && position <= bottom;
	});
	const selectedRowIDs = selectedRowPositions.map(([ id ]) => id);
	return { selectedColumnIDs, selectedRowIDs };
}

function spreadsheetReducer(state, action) {
	const {
		analysisModalOpen,
		cellValue,
		contextMenuPosition,
		colHeaderContext,
		colName,
		column,
		columnCount,
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
		setColName,
		type,
		updatedColumn,
	} = action;
	function getCol(colName) {
		return state.columns.find((col) => col.label === colName);
	}
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		// On text input of a selected cell, value is cleared, cell gets new value and cell is activated
		case ACTIVATE_CELL: {
			const activeCell = { row, column };
			return { ...state, activeCell, cellSelectionRanges: [], selectedRowIDs: [] };
		}
		case ADD_CELL_TO_SELECTIONS: {
			const { cellSelectionRanges = [] } = state;
			const newSelection = { top: row, bottom: row, left: column, right: column };
			return {
				...state,
				cellSelectionRanges: cellSelectionRanges.concat(
					cellSelectionRanges.some((cell) => cell.top === newSelection.top && cell.left === newSelection.left)
						? []
						: newSelection,
				),
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
		case CREATE_COLUMNS: {
			const newColumns = Array(columnCount).fill(undefined).map((_, i) => {
				const id = createRandomLetterString();
				return { id, type: 'String', label: `Column ${state.columns.length + i + 1}` };
			});
			const columns = state.columns.concat(newColumns);
			const columnPositions = newColumns.reduce((acc, { id }, offset) => {
				return { ...acc, [id]: state.columns.length + offset };
			}, state.columnPositions);
			return { ...state, columns, columnPositions };
		}
		case CREATE_ROWS: {
			const newRows = Array(rowCount).fill(undefined).map((_) => {
				return { id: createRandomID() };
			});
			const newRowPositions = newRows.reduce((acc, { id }, offset) => {
				return { ...acc, [id]: state.rows.length + offset };
			}, state.rowPositions);
			return { ...state, rows: state.rows.concat(newRows), rowPositions: newRowPositions };
		}
		case 'ENABLE_SELECT': {
			return { ...state, selectDisabled: false };
		}
		case 'DISABLE_SELECT': {
			return { ...state, selectDisabled: true };
		}
		case PASTE_VALUES: {
			function mapRows(rows, copiedValues, destinationColumns, destinationRows) {
				const indexOfFirstDestinationRow = rows.findIndex((row) => row.id === destinationRows[0]);
				// We create a new object with its keys being the indices of the destination rows
				// and the values being dictionaries mapping the new column ids to the copied values
				const newRows = copiedValues.reduce((newRowAcc, rowValues, rowIndex) => {
					return {
						...newRowAcc,
						[indexOfFirstDestinationRow + rowIndex]: rowValues.reduce((acc, copiedCellValue, colIndex) => {
							return { ...acc, [destinationColumns[colIndex]]: copiedCellValue };
						}, {}),
					};
				}, {});
				// Merge the two entries together
				Object.entries(newRows).forEach(([ rowIndex, rowSplice ]) => {
					rows[rowIndex] = { ...rows[rowIndex], ...rowSplice };
				});
				return rows;
			}

			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
				action.top,
				action.left,
				action.top + action.height - 1,
				action.left + action.width - 1,
				state.columnPositions,
				state.rowPositions,
			);
			return { ...state, rows: mapRows(state.rows, action.copiedValues2dArray, selectedColumnIDs, selectedRowIDs) };
		}
		case COPY_VALUES: {
			// TODO: There should be a line break if the row is undefined values
			// TODO: There should be no line break for the first row when you copy
			const { cellSelectionRanges, columnPositions, rowPositions } = state;
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
			// 		console.log(sel, range);
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
			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
				top,
				left,
				bottom,
				right,
				columnPositions,
				rowPositions,
			);
			const copiedRows = state.rows
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
		case DELETE_VALUES: {
			console.log(state);
			const { cellSelectionRanges, columnPositions, rowPositions } = state;
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
					columnPositions,
					rowPositions,
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
							state,
						}),
					}
				: state;
		}
		case REMOVE_SELECTED_CELLS: {
			return { ...state, cellSelectionRanges: [], selectedRowIDs: [], activeCell: null };
		}
		case SELECT_CELL: {
			const { cellSelectionRanges = [] } = state;
			// track lastSelection to know where to begin range selection on drag
			const lastSelection = { row, column };
			const selectedCell = { top: row, bottom: row, left: column, right: column };
			const addSelectedCellToSelectionArray = cellSelectionRanges.concat(
				cellSelectionRanges.some((cell) => cell.top === selectedCell.top && cell.right === selectedCell.right)
					? []
					: selectedCell,
			);
			return {
				...state,
				activeCell: null,
				lastSelection,
				selectedRowIDs: selectionActive ? addSelectedCellToSelectionArray : [],
				cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [],
				currentCellSelectionRange: selectedCell,
			};
		}
		// TODO: Rename this action to be REPLACE_CELL_SELECTION??
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
				selectedRowIDs: newCellSelectionRanges,
				cellSelectionRanges: newCellSelectionRanges,
			};
		}
		case SET_ROW_POSITION: {
			return { ...state, rowPositions: { ...state.rowPositions, [action.rowID]: action.row } };
		}
		case TOGGLE_LAYOUT: {
			return { ...state, layout };
		}
		case SET_GROUPED_COLUMNS: {
			const matchColNameWithID = state.columns.find((col) => {
				return col.label === setColName;
			});

			const groupByColumnID = matchColNameWithID && matchColNameWithID.id;
			// Maybe we can make groupedColumns keep track of column properties such as label, etc
			const groupedColumns = state.rows.reduce((acc, row) => {
				const { [groupByColumnID]: _, ...restRow } = row;
				return { ...acc, [row[groupByColumnID]]: (acc[row[groupByColumnID]] || []).concat(restRow) };
			}, {});

			const groupCount = Object.keys(groupedColumns).length;
			const sortedNonGroupedColumns = state.columns.filter(({ id }) => id !== groupByColumnID).sort((colA, colB) => {
				return state.columnPositions[colA.id] - state.columnPositions[colB.id];
			});

			// Given m logical columns and n different values in our group by column,
			// we should have (m - 1) * n number of physical columns
			const allPhysicalColumns = Array.from({ length: groupCount }).flatMap((_) => {
				return sortedNonGroupedColumns.map((logicalColumn) => {
					return { ...logicalColumn, id: createRandomID(), logicalColumn: logicalColumn.id };
				});
			});
			const logicalRowGroups = Object.values(groupedColumns);
			// the size of the largest group is the maximum number of physical rows
			const physicalRowTotal = Math.max(...logicalRowGroups.map((group) => group.length));
			// We have to translate the logical rows into physical rows
			const physicalRows = state.rows.slice(0, physicalRowTotal).reduce((acc, _, index) => {
				return acc.concat(
					logicalRowGroups.reduce(
						(physicalRow, group, groupIndex) => {
							const logicalRow = group[index];
							// If we have a valid logical row from our group, we then map the row values
							// for all its logical column ids to refer to physical column ids
							return logicalRow
								? sortedNonGroupedColumns.reduce((acc, column, columnIndex, array) => {
										// We compute the offset bvecause allPhysicalColumns is a flat list
										const physicalColumn = allPhysicalColumns[columnIndex + groupIndex * array.length];
										const result = { ...acc, [physicalColumn.id]: logicalRow[column.id] };
										return result;
									}, physicalRow)
								: physicalRow;
						},
						{ id: createRandomID() },
					),
				);
			}, []);

			const physicalRowPositions = physicalRows.reduce((acc, row, index) => ({ ...acc, [row.id]: index }), {});
			return {
				...state,
				setColName,
				physicalRowPositions,
				physicalRows,
				groupedColumns,
				groupByColumnID,
				allPhysicalColumns,
			};
		}
		case OPEN_CONTEXT_MENU: {
			return { ...state, colName, contextMenuOpen: true, contextMenuPosition, colHeaderContext };
		}
		case CLOSE_CONTEXT_MENU: {
			return { ...state, contextMenuOpen: false };
		}
		case TOGGLE_ANALYSIS_MODAL: {
			return { ...state, analysisModalOpen, activeCell: null };
		}
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
		case TOGGLE_FILTER_MODAL: {
			return { ...state, filterModalOpen, selectedColumn: null, activeCell: null, selectedColumns };
		}
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns: action.selectedColumns };
		}
		case TRANSLATE_SELECTED_CELL: {
			const newCellSelectionRanges = [ { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex } ];
			return { ...state, cellSelectionRanges: newCellSelectionRanges, currentCellSelectionRange: null };
		}
		case UPDATE_CELL: {
			const { rows, columns } = state;
			// row from action or last row from state
			const originalRow = row || rows[rows.length - 1];
			const newRows = rows.slice();
			const column = columns.find((col) => action.columnId === col.id);
			const { id: columnID } = column || columns[columns.length - 1];
			const dependentColumns = columns.filter(({ type, formula }) => {
				return type === 'Formula' && formula.includes(columnID);
			});
			let rowCopy = Object.assign({}, originalRow, { [columnID]: cellValue });
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
			const sortedRows = state.rows.sort(
				(a, b) => (action.descending ? [ b[columnID] ] - [ a[columnID] ] : [ a[columnID] ] - [ b[columnID] ]),
			);
			const sortedPositions = sortedRows.reduce((obj, item, i) => Object.assign(obj, { [item.id]: i }), {});
			return { ...state, rowPositions: sortedPositions };
		}
		case FILTER_COLUMN: {
			const selectedRowIDs = filterRowsByColumnRange(action.selectedColumns, state.rows).map(({ id }) => id);
			return { ...state, selectedRowIDs, selectedColumns: action.selectedColumns };
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
							console.log('type', type, 'formula', formula);
							return type === 'Formula' && formula.includes(columnCopy.id);
						}),
					);
					console.log('formulaColumnsToUpdate', formulaColumnsToUpdate);
					const formulaParser = new Parser();
					// Not getting called
					formulaParser.on('callVariable', function(name, done) {
						console.log(name, 'name');
						const selectedColumn = state.columns.find((column) => column.id === name);
						console.log('selectedColumn', selectedColumn);
						if (selectedColumn) {
							console.log(row[selectedColumn.id]);
							done(row[selectedColumn.id]);
						}
					});
					return formulaColumnsToUpdate.reduce((acc, column) => {
						console.log(column);
						row = acc;
						const {
							result,
							// error
						} = formulaParser.parse(column.formula);
						console.log('result', result);
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

export function SpreadsheetProvider({ children }) {
	// dummy data
	const statsColumns = [
		{ modelingType: 'Continuous', type: 'Number', label: 'Distance' },
		{ modelingType: 'Nominal', type: 'Number', label: 'Trial' },
		{ modelingType: 'Continuous', type: 'Number', label: 'Bubbles' },
		{ modelingType: 'Continuous', type: 'Number', label: 'Time' },
		{ modelingType: 'Nominal', type: 'Number', label: 'Date' },

		// {modelingType: 'Continuous', type: 'Formula', label: 'Trial * Bubbles', formula: 'Trial * Bubbles'},
	];

	const startingColumn = [ { modelingType: 'Continuous', type: 'String', label: 'Column 1' } ];
	// Starting columns
	const columns = startingColumn
		.map((metadata) => ({ id: metadata.id || createRandomLetterString(), ...metadata }))
		.map((column, _, array) => {
			const { formula, ...rest } = column;
			if (formula) {
				const newFormula = array
					.filter((someColumn) => formula.includes(someColumn.label))
					.reduce((changedFormula, someColumn) => {
						return changedFormula.replace(new RegExp(`\\b${someColumn.label}\\b`, 'g'), `${someColumn.id}`);
					}, formula);
				return { ...rest, formula: newFormula };
			}
			return column;
		});

	// normal starting condition

	// const dummyRows = [ ...Array(1000) ].map((e) => Array(10).fill(Math.random() * 10));

	const columnPositions = columns.reduce((acc, column, index) => ({ ...acc, [column.id]: index }), {});

	const startingRow = [ [] ];
	const rows = startingRow
		.map((tuple) => ({
			id: createRandomID(),
			...tuple.reduce((acc, value, index) => ({ ...acc, [columns[index].id]: value }), {}),
		}))
		.map((originalRow) => {
			const formulaColumns = columns.filter(({ type }) => type === 'Formula');
			let rowCopy = Object.assign({}, originalRow);
			if (formulaColumns.length) {
				const formulaParser = new Parser();
				formulaParser.on('callVariable', function(name, done) {
					const selectedColumn = columns.find((column) => column.id === name);
					if (selectedColumn) {
						done(originalRow[selectedColumn.id]);
					}
				});
				rowCopy = formulaColumns.reduce((acc, column) => {
					return { ...acc, [column.id]: formulaParser.parse(column.formula).result };
				}, rowCopy);
			}

			return rowCopy;
		});

	const rowPositions = {};
	for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
		const rowID = rows[rowIndex].id;
		rowPositions[rowID] = rowIndex;
	}

	const initialState = {
		analysisModalOpen: false,
		analysisWindowOpen: false,
		columnTypeModalOpen: false,
		activeCell: null,
		cellSelectionRanges: [],
		contextMenuPosition: null,
		currentCellSelectionRange: null,
		colHeaderContext: false,
		columns,
		columnPositions,
		colName: null,
		contextMenuOpen: false,
		distributionModalOpen: false,
		filterModalOpen: false,
		layout: true,
		selectedColumns: [],
		selectDisabled: false,
		xColData: null,
		yColData: null,
		lastSelection: { row: 1, column: 1 },
		rowPositions,
		rows,
	};
	const [ state, changeSpreadsheet ] = useReducer(spreadsheetReducer, initialState);
	return (
		<SpreadsheetStateContext.Provider value={state}>
			<SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>{children}</SpreadsheetDispatchContext.Provider>
		</SpreadsheetStateContext.Provider>
	);
}
