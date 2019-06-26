import React, { useReducer } from 'react';
import './App.css';

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();

function getRangeBoundaries({startRangeRow, startRangeColumn, endRangeRow, endRangeColumn}) {
  const top = Math.min(startRangeRow, endRangeRow);
  const bottom = Math.max(startRangeRow, endRangeRow);
  const left = Math.min(startRangeColumn, endRangeColumn);
  const right = Math.max(startRangeColumn, endRangeColumn);
  return {top, left, bottom, right};
}

function spreadsheetReducer(state, action) {
  const {type, activeCell, row, column, cellID, cellValue, endRangeRow, endRangeColumn} = action;
  // console.log('action:', action);
  switch (type) {
    case 'activateCell': {
      return {...state, activeCell, activeCellCoords: {row, column}, currentCellSelectionRange: {top: row, left: column}};
    }
    case 'setCellPosition': {
      const rowArray = state.cellPositions[row];
      const changedRow = rowArray.slice(0, column).concat(cellID).concat(rowArray.slice(column +  1));
      const newPositions = state.cellPositions.slice(0, row).concat([changedRow]).concat(state.cellPositions.slice(row + 1));
      return {...state, cellPositions: newPositions};
    }
    case 'createCell': {
      return {...state, cells: {...state.cells, [cellID]: {value: null}}};
    }
    case 'updateCell': {
      return  {...state, cells: {...state.cells, [cellID]: {value: cellValue}}};
    }
    case 'multi-cell-selection-started': {
      return {...state, multiCellSelectionIDs: [cellID]};
    }
    case 'add-cellID-to-cell-selection': {
      const {multiCellSelectionIDs} = state;
      const newCell = state.cellPositions[row][column];
      return {...state, multiCellSelectionIDs: multiCellSelectionIDs.concat(multiCellSelectionIDs.includes(newCell) ? [] : newCell)};
    }
    case 'add-current-selection-to-cell-selections': {
      const {currentCellSelectionRange, cellSelectionRanges} = state;
      return {...state, cellSelectionRanges: cellSelectionRanges.concat(currentCellSelectionRange), currentCellSelectionRange: null};
    }
    case 'modify-current-selection-cell-range': {
      const {currentCellSelectionRange, activeCellCoords} = state;
      return currentCellSelectionRange ? {
        ...state,
        currentCellSelectionRange: getRangeBoundaries({
          startRangeRow: activeCellCoords.row,
          startRangeColumn: activeCellCoords.column,
          endRangeRow,
          endRangeColumn,
          state
        })
      } : state;
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
  return context
}
export function useSpreadsheetDispatch() {
  const context = React.useContext(SpreadsheetDispatchContext)
  if (context === undefined) {
    throw new Error('useCountDispatch must be used within a CountProvider')
  }
  return context
}

export function SpreadsheetProvider({children, rowCount, colCount}) {
  const initialArray = Array(colCount).fill(undefined);
  const initialModel = Array(rowCount).fill(undefined).map(() => initialArray.slice());
  const [state, changeSpreadsheet] = useReducer(spreadsheetReducer, {
    cells: {}, activeCell: null, cellPositions: initialModel, multiCellSelectionIDs: [], cellSelectionRanges: [{
      top: 5, bottom: 10, left: 3, right: 6
    }], currentCellSelectionRange: null
  });
  return (
    <SpreadsheetStateContext.Provider value={state}>
      <SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>
        {children}
      </SpreadsheetDispatchContext.Provider>
    </SpreadsheetStateContext.Provider>
  )
}