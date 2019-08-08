import React, { useReducer } from 'react';
import './App.css';
import {
  ACTIVATE_CELL,
  ADD_CELL_TO_SELECTIONS,
  ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
  CREATE_COLUMNS,
  CREATE_ROWS,
  DELETE_VALUES,
  MODIFY_CURRENT_SELECTION_CELL_RANGE,
  SET_ROW_POSITION,
  SELECT_CELL,
  TRANSLATE_SELECTED_CELL,
  UPDATE_CELL
} from './constants'

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();

function getRangeBoundaries({startRangeRow, startRangeColumn, endRangeRow, endRangeColumn}) {
  const top = Math.min(startRangeRow, endRangeRow);
  const bottom = Math.max(startRangeRow, endRangeRow);
  const left = Math.min(startRangeColumn, endRangeColumn);
  const right = Math.max(startRangeColumn, endRangeColumn);
  return {top, left, bottom, right};
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
  return Array(10).fill(undefined).map((_) => alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join('');
}

function spreadsheetReducer(state, action) {
  const {
    cellValue,
    column,
    columnCount,
    columnIndex,
    endRangeRow,
    endRangeColumn,
    row,
    rowIndex,
    rowCount,
    selectionActive,
    type,
   } = action;
  console.log('dispatched:', type, 'with action:', action);
  switch (type) {
    // On text input of a selected cell, value is cleared, cell gets new value and cell is activated
    case ACTIVATE_CELL: {
      const activeCell = {row, column};
      return {...state, activeCell, cellSelectionRanges: [] }
    }
    case ADD_CELL_TO_SELECTIONS: {
      const {cellSelectionRanges = []} = state;
      const newSelection = {top: row, bottom: row, left: column, right: column};
      return {...state, cellSelectionRanges: cellSelectionRanges.concat(cellSelectionRanges.some(cell => (cell.top === newSelection.top) && (cell.left === newSelection.left)) ? [] : newSelection)};
    }
    case ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS: {
      const {currentCellSelectionRange, cellSelectionRanges} = state;
      return {...state, cellSelectionRanges: cellSelectionRanges.concat(currentCellSelectionRange || []), currentCellSelectionRange: null};
    }
    case CREATE_COLUMNS: {
      const newColumns = Array(columnCount).fill(undefined).map(_ => {
        const id = createRandomID();
        return {id, type: 'String', label: `Column ${id}`};
      });
      const columns = state.columns.concat(newColumns);
      const columnPositions = newColumns.reduce((acc, {id}, offset) => {
        return {...acc, [id]: state.columns.length + offset};
      }, state.columnPositions);
      return {...state, columns, columnPositions};
    }
    case CREATE_ROWS: {
      const newRows = Array(rowCount).fill(undefined).map(_ => {
        return {id: createRandomID()};
      });
      const newRowPositions = newRows.reduce((acc, {id}, offset) => {
        return {...acc, [id]: state.rows.length + offset};
      }, state.rowPositions);
      return {...state, rows: state.rows.concat(newRows), rowPositions: newRowPositions};
    }
    case DELETE_VALUES: {
      const { cellSelectionRanges, columnPositions, rowPositions } = state;
      console.log(state)

      function removeKeyReducer(container, key) {
        const {[key]: value, ...rest} = container;
        return rest;
      }
      const newRows = cellSelectionRanges.reduce((rows, {top, left, bottom, right}) => {
        const selectedColumnPositions = Object.entries(columnPositions).filter(([_, position]) => {
          // Subtract one because of header column
          return position >= (left - 1) && position <= (right - 1);
        });
        const selectedColumnIDs = selectedColumnPositions.map(([id]) => id);
        const selectedRowPositions = Object.entries(rowPositions).filter(([_, position]) => {
          return position >= top && position <= bottom;
        });
        const selectedRowIDs = selectedRowPositions.map(([id]) => id);
        return rows.map((row) => {
          if (selectedRowIDs.includes(row.id)) {
            return selectedColumnIDs.reduce(removeKeyReducer, row);
          } else {
            return row;
          }
        });
      }, state.rows);
      return {...state, rows: newRows };
    }
    case MODIFY_CURRENT_SELECTION_CELL_RANGE: {
      const {currentCellSelectionRange, lastSelection} = state;
      return currentCellSelectionRange ? {
        ...state,
        currentCellSelectionRange: getRangeBoundaries({
          startRangeRow: lastSelection.row,
          startRangeColumn: lastSelection.column,
          endRangeRow,
          endRangeColumn,
          state
        })
      } : state;
    }
    case SELECT_CELL: {
      const {cellSelectionRanges = []} = state;
      // track lastSelection to know where to begin range selection on drag
      const lastSelection = {row, column};
      const selectedCell = {top: row, bottom: row, left: column, right: column};
      const addSelectedCellToSelectionArray = cellSelectionRanges.concat(cellSelectionRanges.some(cell => (cell.top === selectedCell.top) && (cell.right === selectedCell.right)) ? [] : selectedCell);
      return {...state, activeCell: null, lastSelection, cellSelectionRanges: selectionActive ? addSelectedCellToSelectionArray : [], currentCellSelectionRange: selectedCell }
    }
    case SET_ROW_POSITION: {
      return {...state, rowPositions: {...state.rowPositions, [action.rowID]: action.row} };
    }
    case TRANSLATE_SELECTED_CELL: {
      const newCellSelectionRanges = [{top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex}];
      return {...state, cellSelectionRanges: newCellSelectionRanges, currentCellSelectionRange: null}
    }
    case UPDATE_CELL: {
      const { rows, columns } = state;
      const newRows = rows.slice();
      const {id: columnID} = column || columns[columns.length - 1];
      const rowCopy = Object.assign({}, row || rows[rows.length - 1], {[columnID]: cellValue});
      const changedRows = newRows.filter(newRow => newRow.id !== rowCopy.id).concat(rowCopy);

      return  {...state, rows: changedRows };
    }
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
}

export function useSpreadsheetState() {
  const context = React.useContext(SpreadsheetStateContext)
  if (context === undefined) {
    throw new Error('useCountState must be used within a CountProvider')
  }
  return context;
}
export function useSpreadsheetDispatch() {
  const context = React.useContext(SpreadsheetDispatchContext)
  if (context === undefined) {
    throw new Error('useCountDispatch must be used within a CountProvider')
  }
  return context;
}

export function SpreadsheetProvider({children}) {
  const columns = [{
    type: 'String', label: 'Name'
  }, {
    type: 'Number', label: 'Age'
  }, {
    type: 'String', label: 'Gender'
  }, {
    type: 'Formula', label: 'FormulaColumn', formula: 'Age + 20'
  }].map((metadata) => ({id: createRandomLetterString(), ...metadata})).map((column, _, array) => {
    const {formula, ...rest} = column;
    if (formula) {
      const newFormula = array.filter((someColumn) => formula.includes(someColumn.label)).reduce((changedFormula, someColumn) => {
        return changedFormula.replace(new RegExp(someColumn.label), someColumn.id);
      }, formula);
      return {...rest, formula: newFormula};
    } else {
      return column;
    }
    // return formula ? {...rest, formula: } : column;
  });
  const columnPositions = columns.reduce((acc, column, index) => ({...acc, [column.id]: index}), {});
  const rows = [['John Smith', 25, 'M', ''], ['Jane Smith', 24, 'F', '']].map((tuple) => ({
    id: createRandomID(), ...tuple.reduce((acc, value, index) => ({...acc, [columns[index].id]: value}), {})
  }));
  const rowPositions = rows.reduce((acc, row, index) => ({...acc, [row.id]: index}), {});

  const initialState = {
    activeCell: null,
    cellSelectionRanges: [{
      top: 1, bottom: 1, left: 1, right: 1
    }],
    currentCellSelectionRange: null,
    columns,
    columnPositions,
    lastSelection: {row: 1, column: 1},
    rowPositions,
    rows,
  };
  console.log('initialState:', initialState);
  const [state, changeSpreadsheet] = useReducer(spreadsheetReducer, initialState);
  return (
    <SpreadsheetStateContext.Provider value={state}>
      <SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>
        {children}
      </SpreadsheetDispatchContext.Provider>
    </SpreadsheetStateContext.Provider>
  )
}