import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	FILTER_SELECT_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	REMOVE_SELECTED_CELLS,
	SELECT_CELL,
	SELECT_CELLS_BY_IDS,
	SELECT_ALL_CELLS,
	SELECT_ROW,
	SELECT_BLOCK_OF_CELLS,
	SELECT_COLUMN,
	SET_SELECTED_COLUMN,
	TRANSLATE_SELECTED_CELL,
} from '../../constants';

import { getRangeBoundaries, getUniqueListBy } from '../helpers';

export function selectReducer(state, action) {
	const {
		column,
		columns,
		columnID,
		columnIndex,
		cellSelectionRanges,
		endRangeRow,
		endRangeColumn,
		selectedColumns,
		newInputCellValue,
		row,
		rowIndex,
		selectionActive,
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
		case FILTER_SELECT_ROWS: {
			const { filters, rows, columns } = action;
			const mergedRowIDs = filters.flatMap((filter) => filter.filteredRowIDs);
			const mappedRows = rows
				.map((row, i) => {
					if (mergedRowIDs.includes(row.id)) {
						return { top: i, bottom: i, left: 0, right: columns.length };
					}
					return null;
				})
				.filter((x) => x);
			const uniques = getUniqueListBy(mappedRows, 'top');

			return {
				...state,
				cellSelectionRanges: uniques,
				currentCellSelectionRange: uniques,
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
			return state.currentCellSelectionRange
				? {
						...state,
						currentCellSelectionRange,
						// cellSelectionObject,
					}
				: state;
		}
		case REMOVE_SELECTED_CELLS: {
			return {
				...state,
				currentCellSelectionRange: null,
				cellSelectionRanges: [],
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
			return {
				...state,
				activeCell: null,
				lastSelection,
				cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [],
				currentCellSelectionRange: selectedCell,
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
			};
		}
		// This is used when a rows array is supplied. Histogram bar clicks.
		case SELECT_CELLS_BY_IDS: {
			const { cellSelectionRanges = [] } = state;
			const { rowIDs, columnID, rows, columns } = action;
			const rowIndexes = rowIDs.map((rowID) => rows.findIndex((row) => row.id === rowID));
			const columnIndex = columns.findIndex((column) => column.id === columnID);
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
			};
		}
		case SELECT_ALL_CELLS: {
			const { rows, columns } = action;
			const allColumns = columns.map((column) => column.id);
			let rowsObject = {};
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				rowsObject[row.id] = allColumns;
			}
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
				// cellSelectionObject: rowsObject,
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
			};
		}
		case SELECT_BLOCK_OF_CELLS: {
			return { ...state, cellSelectionRanges };
		}
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns };
		}
		// EVENT: Selected Cell translated
		case TRANSLATE_SELECTED_CELL: {
			const newCellSelectionRanges = [ { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex } ];
			return {
				...state,
				cellSelectionRanges: newCellSelectionRanges,
				currentCellSelectionRange: null,
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
