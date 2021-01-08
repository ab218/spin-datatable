import {
  ACTIVATE_CELL,
  ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
  FILTER_SELECT_ROWS,
  INVERT_ROW_SELECTION,
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
} from "../../constants";

import {
  getRangeBoundaries,
  getUniqueListBy,
  selectRowsFromRowIDs,
  flattenCellSelectionRanges,
  shiftSelect,
} from "../helpers";

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
    metaKeyPressed,
    shiftKeyPressed,
  } = action;
  const { type } = action;
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
        cellSelectionRanges: cellSelectionRanges.concat(
          currentCellSelectionRange || [],
        ),
        currentCellSelectionRange: null,
      };
    }

    case FILTER_SELECT_ROWS: {
      const { filters, rows, columns } = action;
      const mergedRowIDs = filters.flatMap((filter) => filter.filteredRowIDs);
      const mappedRows = selectRowsFromRowIDs(mergedRowIDs, rows, columns);
      const uniques = getUniqueListBy(mappedRows, "top");

      return {
        ...state,
        cellSelectionRanges: uniques,
        currentCellSelectionRange: uniques,
      };
    }
    case INVERT_ROW_SELECTION: {
      const { rows, columns } = action;
      const { cellSelectionRanges, currentCellSelectionRange } = state;

      const flattenedCellSelectionRanges = flattenCellSelectionRanges(
        cellSelectionRanges,
        currentCellSelectionRange,
      ).sort((a, b) => a.top - b.top);

      const invertedTopRanges = flattenedCellSelectionRanges
        .map((range, i) => {
          if (i === 0 && range.top !== 0) {
            return {
              top: 0,
              bottom: flattenedCellSelectionRanges[i].top - 1,
              left: 0,
              right: columns.length - 1,
            };
          }
          if (i !== 0) {
            return {
              top: flattenedCellSelectionRanges[i - 1].bottom + 1,
              bottom: flattenedCellSelectionRanges[i].top - 1,
              left: 0,
              right: columns.length - 1,
            };
          }
          return null;
        })
        .filter(Boolean);

      const bottomRangeEndsOnLastRow =
        flattenedCellSelectionRanges[flattenedCellSelectionRanges.length - 1]
          .bottom ===
        rows.length - 1;

      const invertedRanges = bottomRangeEndsOnLastRow
        ? invertedTopRanges
        : invertedTopRanges.concat({
            top:
              flattenedCellSelectionRanges[
                flattenedCellSelectionRanges.length - 1
              ].bottom + 1,
            bottom: rows.length - 1,
            left: 0,
            right: columns.length - 1,
          });

      return { ...state, cellSelectionRanges: invertedRanges };
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
      const selectedCell = {
        top: rowIndex,
        bottom: rowIndex,
        left: columnIndex,
        right: columnIndex,
      };
      const metaCellSelection =
        metaKeyPressed && !shiftKeyPressed ? cellSelectionRanges : [];
      const shiftCellSelection = shiftKeyPressed
        ? shiftSelect(state.lastSelection, lastSelection)
        : selectedCell;

      return {
        ...state,
        activeCell: null,
        lastSelection: shiftKeyPressed ? state.lastSelection : lastSelection,
        cellSelectionRanges: metaCellSelection,
        currentCellSelectionRange: shiftCellSelection,
      };
    }
    case SELECT_COLUMN: {
      const { cellSelectionRanges } = state;
      const { rows } = action;
      const lastSelection = { column: columnIndex, row: 0 };
      const allCellsInColumn = {
        top: 0,
        left: columnIndex,
        bottom: rows.length - 1,
        right: columnIndex,
      };
      const shiftCellSelection = shiftKeyPressed
        ? shiftSelect(
            // last selection chooses first row, new selection chooses last row
            { column: state.lastSelection.column, row: 0 },
            {
              column: columnIndex,
              row: rows.length - 1,
            },
          )
        : allCellsInColumn;

      const metaKeySelection = metaKeyPressed
        ? cellSelectionRanges.concat(allCellsInColumn)
        : [allCellsInColumn];

      return {
        ...state,
        activeCell: null,
        currentCellSelectionRange: shiftCellSelection,
        cellSelectionRanges: metaKeySelection,
        lastSelection: shiftKeyPressed ? state.lastSelection : lastSelection,
      };
    }
    case SELECT_ROW: {
      const { cellSelectionRanges } = state;
      const lastSelection = { column: columns.length - 1, row: rowIndex };
      const allCellsInRow = {
        top: rowIndex,
        left: 0,
        bottom: rowIndex,
        right: columns.length - 1,
      };
      const metaCellSelection = metaKeyPressed
        ? cellSelectionRanges.concat(allCellsInRow)
        : [allCellsInRow];
      const shiftCellSelection = shiftKeyPressed
        ? shiftSelect(
            // last selection chooses first column, new selection chooses last column
            { column: 0, row: state.lastSelection.row },
            {
              column: columns.length - 1,
              row: rowIndex,
            },
          )
        : allCellsInRow;

      return {
        ...state,
        activeCell: null,
        currentCellSelectionRange: shiftCellSelection,
        cellSelectionRanges: metaCellSelection,
        lastSelection: shiftKeyPressed ? state.lastSelection : lastSelection,
      };
    }
    // This is used when a rows array is supplied. Histogram bar clicks.
    case SELECT_CELLS_BY_IDS: {
      const { cellSelectionRanges = [] } = state;
      const { rowIDs, columnID, rows, columns } = action;
      const rowIndexes = rowIDs.map((rowID) =>
        rows.findIndex((row) => row.id === rowID),
      );
      const columnIndex = columns.findIndex((column) => column.id === columnID);
      const newSelectedCells = rowIndexes.map((rowIndex) => ({
        top: rowIndex,
        bottom: rowIndex,
        left: columnIndex,
        right: columnIndex,
      }));
      const newCellSelectionRanges = cellSelectionRanges.concat(
        newSelectedCells,
      );
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
        cellSelectionRanges: [allCells],
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
      const newCellSelectionRanges = [
        {
          top: rowIndex,
          bottom: rowIndex,
          left: columnIndex,
          right: columnIndex,
        },
      ];
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
