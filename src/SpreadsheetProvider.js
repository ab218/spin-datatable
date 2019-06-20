import React, { useReducer } from 'react';
import './App.css';

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();

function spreadsheetReducer(state, action) {
  switch (action.type) {
    case 'activateCell': {
      return {...state, activeCell: action.activeCell}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
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

export function SpreadsheetProvider({children}) {
  const [state, activateCell] = useReducer(spreadsheetReducer, {activeCell: null})
  return (
    <SpreadsheetStateContext.Provider value={state}>
      <SpreadsheetDispatchContext.Provider value={activateCell}>
        {children}
      </SpreadsheetDispatchContext.Provider>
    </SpreadsheetStateContext.Provider>
  )
}

// export { SpreadsheetProvider, useSpreadsheetState, useSpreadsheetDispatch };
