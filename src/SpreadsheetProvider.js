import React, { useReducer } from 'react';
import './App.css';

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();

function spreadsheetReducer(state, action) {
  const {type, activeCell, row, column, cellID} = action;
  switch (type) {
    case 'activateCell': {
      return {...state, activeCell};
    }
    case 'setCellPosition': {
      const rowArray = state.cellPositions[row];
      const changedRow = rowArray.slice(0, column).concat(cellID).concat(rowArray.slice(column +  1));
      const newPositions = state.cellPositions.slice(0, row).concat([changedRow]).concat(state.cellPositions.slice(row + 1));
      return {...state, cellPositions: newPositions};
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

  const [state, changeSpreadsheet] = useReducer(spreadsheetReducer, {activeCell: null, cellPositions: initialModel})
  return (
    <SpreadsheetStateContext.Provider value={state}>
      <SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>
        {children}
      </SpreadsheetDispatchContext.Provider>
    </SpreadsheetStateContext.Provider>
  )
}

// export { SpreadsheetProvider, useSpreadsheetState, useSpreadsheetDispatch };
