import React, { useReducer } from "react";
import { selectReducer } from "./reducers/selectReducer";
import { spreadsheetReducer } from "./reducers/spreadsheetReducer";
import { columnWidthReducer } from "./reducers/columnWidthReducer";
import { rowsReducer } from "./reducers/rowsReducer";
import { potatoLiverData, statsColumns } from "./dummyData";
import { createRows } from "./helpers";

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();
const SelectStateContext = React.createContext();
const SelectDispatchContext = React.createContext();
const RowsStateContext = React.createContext();
const RowsDispatchContext = React.createContext();
const ColumnWidthStateContext = React.createContext();
const ColumnWidthDispatchContext = React.createContext();

export function useColumnWidthState() {
  const context = React.useContext(ColumnWidthStateContext);
  if (context === undefined) {
    throw new Error(
      "useColumnWidthState must be used within a SpreadsheetProvider",
    );
  }
  return context;
}
export function useColumnWidthDispatch() {
  const context = React.useContext(ColumnWidthDispatchContext);
  if (context === undefined) {
    throw new Error(
      "ColumnWidthDispatchContext must be used within a SpreadsheetProvider",
    );
  }
  return context;
}

export function useRowsState() {
  const context = React.useContext(RowsStateContext);
  if (context === undefined) {
    throw new Error("useRowsState must be used within a SpreadsheetProvider");
  }
  return context;
}
export function useRowsDispatch() {
  const context = React.useContext(RowsDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useRowsDispatch must be used within a SpreadsheetProvider",
    );
  }
  return context;
}

export function useSpreadsheetState() {
  const context = React.useContext(SpreadsheetStateContext);
  if (context === undefined) {
    throw new Error(
      "useSpreadsheetState must be used within a SpreadsheetProvider",
    );
  }
  return context;
}
export function useSpreadsheetDispatch() {
  const context = React.useContext(SpreadsheetDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useSpreadsheetDispatch must be used within a SpreadsheetProvider",
    );
  }
  return context;
}

export function useSelectState() {
  const context = React.useContext(SelectStateContext);
  if (context === undefined) {
    throw new Error(
      "useSpreadsheetState must be used within a SpreadsheetProvider",
    );
  }
  return context;
}
export function useSelectDispatch() {
  const context = React.useContext(SelectDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useSpreadsheetDispatch must be used within a SpreadsheetProvider",
    );
  }
  return context;
}

export function SpreadsheetProvider({ children }) {
  const initialState = {
    analysisModalOpen: false,
    analysisWindowOpen: false,
    barChartModalOpen: false,
    // First column created will be "Column 2"
    columnCounter: 1,
    columnTypeModalOpen: false,
    colName: null,
    contextMenuOpen: false,
    contextMenuPosition: null,
    contextMenuRowIndex: null,
    distributionModalOpen: false,
    filterModalOpen: false,
  };

  const initialSelectState = {
    activeCell: null,
    cellSelectionRanges: [],
    currentCellSelectionRange: [],
    lastSelection: { row: 1, column: 1 },
    selectDisabled: false,
    selectedColumns: [],
    // cellSelectionObject: [],
  };

  const initialRowsState = {
    // columns: startingColumn,
    // rows: [],
    // inverseDependencyMap: {},
    dataTableName: null,
    columns: statsColumns,
    rows: createRows(potatoLiverData, statsColumns),
    inverseDependencyMap: {
      _abc1_: ["_abc3_"],
      _abc2_: ["_abc3_"],
    },
    excludedRows: [],
    modalError: null,
    history: [],
    redoHistory: [],
    savedAnalyses: [],
    savedFilters: [],
    valuesColumnsCounter: 0,
    filters: {
      selectedColumns: [],
      stringFilters: {},
      numberFilters: [],
    },
    appliedFilterExclude: [],
    filteredRows: [],
    filteredRowIDs: [],
    filteredColumnIDs: [],
  };

  const [state, changeSpreadsheet] = useReducer(
    spreadsheetReducer,
    initialState,
  );
  const [selectState, changeSelectState] = useReducer(
    selectReducer,
    initialSelectState,
  );
  const [rowsState, changeRowsState] = useReducer(
    rowsReducer,
    initialRowsState,
  );
  const [
    columnWidthState,
    changeColumnWidthState,
  ] = useReducer(columnWidthReducer, { widths: {} });
  return (
    <ColumnWidthDispatchContext.Provider value={changeColumnWidthState}>
      <ColumnWidthStateContext.Provider value={columnWidthState}>
        <SpreadsheetStateContext.Provider value={state}>
          <SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>
            <RowsStateContext.Provider value={rowsState}>
              <RowsDispatchContext.Provider value={changeRowsState}>
                <SelectStateContext.Provider value={selectState}>
                  <SelectDispatchContext.Provider value={changeSelectState}>
                    {children}
                  </SelectDispatchContext.Provider>
                </SelectStateContext.Provider>
              </RowsDispatchContext.Provider>
            </RowsStateContext.Provider>
          </SpreadsheetDispatchContext.Provider>
        </SpreadsheetStateContext.Provider>
      </ColumnWidthStateContext.Provider>
    </ColumnWidthDispatchContext.Provider>
  );
}
