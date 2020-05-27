import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	REMOVE_SELECTED_CELLS,
	SELECT_CELL,
	SELECT_CELLS,
	SELECT_ALL_CELLS,
	SELECT_ROW,
	SELECT_COLUMN,
	TRANSLATE_SELECTED_CELL,
} from '../../constants';

import { getRangeBoundaries } from '../helpers';

export function selectReducer(state, action) {
	const {
		column,
		columnID,
		columnIndex,
		endRangeRow,
		endRangeColumn,
		newInputCellValue,
		row,
		rowID,
		rowIndex,
		rows,
		selectionActive,
		// selectedText,
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
		case MODIFY_CURRENT_SELECTION_CELL_RANGE: {
			const { lastSelection } = state;
			const currentCellSelectionRange = getRangeBoundaries({
				startRangeRow: lastSelection.row,
				startRangeColumn: lastSelection.column,
				endRangeRow,
				endRangeColumn,
			});
			// const totalCellSelectionRanges = state.cellSelectionRanges.concat(currentCellSelectionRange);
			// const uniqueRowIDs = generateUniqueRowIDs(totalCellSelectionRanges, state.rows);
			// const uniqueColumnIDs = generateUniqueColumnIDs(totalCellSelectionRanges, state.columns);
			return state.currentCellSelectionRange
				? {
						...state,
						currentCellSelectionRange,
						// uniqueRowIDs,
						// uniqueColumnIDs,
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
				left: 1,
				bottom: rowIndex,
				right: action.columns.length,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: allCellsInRow,
				cellSelectionRanges: selectionActive ? cellSelectionRanges.concat(allCellsInRow) : [ allCellsInRow ],
				lastSelection: { column: action.columns.length, row: rowIndex },
				uniqueRowIDs: [ rowID ],
				uniqueColumnIDs: action.columns.map((col) => col.id),
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
				bottom: action.rows.length - 1,
				right: action.columns.length,
			};
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: null,
				cellSelectionRanges: [ allCells ],
				uniqueColumnIDs: action.columns.map((column) => column.id),
				uniqueRowIDs: action.rows.map((row) => row.id),
			};
		}
		case SELECT_COLUMN: {
			const { cellSelectionRanges } = state;
			const { rows } = action;
			const allCellsInColumn = {
				top: 0,
				left: columnIndex + 1,
				bottom: rows.length - 1,
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
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
