import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	FILTER_COLUMN,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	REMOVE_SELECTED_CELLS,
	SELECT_CELL,
	SELECT_CELLS,
	SELECT_ALL_CELLS,
	SELECT_ROW,
	SELECT_BLOCK_OF_CELLS,
	SELECT_COLUMN,
	SET_FILTERS,
	SET_SELECTED_COLUMN,
	DELETE_FILTER,
	TRANSLATE_SELECTED_CELL,
} from '../../constants';

import {
	getRangeBoundaries,
	generateUniqueRowIDs,
	generateUniqueColumnIDs,
	filterRowsByColumnRange,
	filterRowsByString,
	returnIntersectionOrNonEmptyArray,
} from '../helpers';

export function selectReducer(state, action) {
	const {
		column,
		columns,
		columnID,
		columnIndex,
		cellSelectionRanges,
		endRangeRow,
		endRangeColumn,
		filters,
		selectedColumns,
		stringFilter,
		numberFilters,
		newInputCellValue,
		row,
		rowID,
		rowIndex,
		rowIndexes,
		rows,
		selectionActive,
		selectedRowIDs,
		uniqueColumnIDs,
	} = action;

	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		case ACTIVATE_CELL: {
			const activeCell = { row, column, columnID };
			return {
				...state,
				activeCell,
				cellSelectionRanges: [],
				newInputCellValue,
				uniqueRowIDs: [],
				uniqueColumnIDs: [],
				// selectedText,
			};
		}
		// On text input of a selected cell, value is cleared, cell gets new value and cell is activated
		case ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS: {
			const { currentCellSelectionRange, cellSelectionRanges } = state;
			return {
				...state,
				cellSelectionRanges: cellSelectionRanges.concat(currentCellSelectionRange || []),
				currentCellSelectionRange: null,
			};
		}
		case DELETE_FILTER: {
			return { ...state, filters, selectedColumns };
		}
		case FILTER_COLUMN: {
			const filteredRowsByRange = filterRowsByColumnRange(state.filters.numberFilters, rows);
			const filteredRowsByString = filterRowsByString(rows, state.filters);
			const filteredRows = returnIntersectionOrNonEmptyArray(filteredRowsByRange, filteredRowsByString);
			const filteredRowIDs = filteredRows.map((row) => row.id);
			const selectedRowIndexes = filteredRows.map((row) => rows.findIndex((stateRow) => stateRow.id === row.id));
			const selectedRowObjects = selectedRowIndexes.map((rowIndex) => {
				return {
					top: rowIndex,
					left: 0,
					bottom: rowIndex,
					right: columns.length - 1,
				};
			});
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: selectedRowObjects,
				cellSelectionRanges: selectedRowObjects,
				uniqueRowIDs: filteredRowIDs,
				uniqueColumnIDs: columns.map((col) => col.id),
			};
		}
		case MODIFY_CURRENT_SELECTION_CELL_RANGE: {
			const { lastSelection } = state;
			const currentCellSelectionRange = getRangeBoundaries({
				startRangeRow: lastSelection.row,
				startRangeColumn: lastSelection.column,
				endRangeRow,
				endRangeColumn: endRangeColumn,
			});
			const totalCellSelectionRanges = state.cellSelectionRanges.concat(currentCellSelectionRange);
			const uniqueRowIDs = generateUniqueRowIDs(totalCellSelectionRanges, rows);
			const uniqueColumnIDs = generateUniqueColumnIDs(totalCellSelectionRanges, columns);
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
			const lastSelection = { row: rowIndex, column: columnIndex };
			const selectedCell = { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex };
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
				cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [],
				currentCellSelectionRange: selectedCell,
				uniqueRowIDs: currentRowIDs,
				uniqueColumnIDs: currentColumnIDs,
			};
		}
		case SELECT_ROW: {
			const { cellSelectionRanges } = state;
			const allCellsInRow = {
				top: rowIndex,
				left: 0,
				bottom: rowIndex,
				right: columns.length - 1,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: allCellsInRow,
				cellSelectionRanges: selectionActive ? cellSelectionRanges.concat(allCellsInRow) : [ allCellsInRow ],
				lastSelection: { column: columns.length - 1, row: rowIndex },
				uniqueRowIDs: [ rowID ],
				uniqueColumnIDs: columns.map((col) => col.id),
			};
		}
		// This is used when a rows array is supplied. Histogram bar clicks.
		case SELECT_CELLS: {
			const { cellSelectionRanges = [] } = state;
			// const columnIndexOffset = 1;
			// const computedColumnIndex = columnIndex + columnIndexOffset;
			const rowIDs = rowIndexes.map((row) => rows[row].id);
			const newSelectedCells = rowIndexes.map((rowIndex) => ({
				top: rowIndex,
				bottom: rowIndex,
				left: columnIndex,
				right: columnIndex,
			}));
			const newCellSelectionRanges = cellSelectionRanges.concat(newSelectedCells);
			return {
				...state,
				activeCell: null,
				cellSelectionRanges: newCellSelectionRanges,
				uniqueRowIDs: rowIDs,
				uniqueColumnIDs: [ columns[columnIndex].id ],
			};
		}
		case SELECT_ALL_CELLS: {
			const allCells = {
				top: 0,
				left: 0,
				bottom: rows.length - 1,
				right: columns.length - 1,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: null,
				cellSelectionRanges: [ allCells ],
				uniqueColumnIDs: columns.map((column) => column.id),
				uniqueRowIDs: rows.map((row) => row.id),
			};
		}
		case SELECT_COLUMN: {
			const { cellSelectionRanges } = state;
			const { rows } = action;
			const allCellsInColumn = {
				top: 0,
				left: columnIndex,
				bottom: rows.length - 1,
				right: columnIndex,
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
		case SELECT_BLOCK_OF_CELLS: {
			return { ...state, cellSelectionRanges, uniqueColumnIDs, selectedRowIDs };
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
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns };
		}
		// EVENT: Selected Cell translated
		case TRANSLATE_SELECTED_CELL: {
			const newCellSelectionRanges = [ { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex } ];
			const rowID = rows[rowIndex].id;
			const columnID = columns[columnIndex].id;
			return {
				...state,
				cellSelectionRanges: newCellSelectionRanges,
				currentCellSelectionRange: null,
				uniqueColumnIDs: [ columnID ],
				uniqueRowIDs: [ rowID ],
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
