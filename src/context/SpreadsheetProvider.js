import React, { useReducer } from 'react';
import { selectReducer } from './reducers/selectReducer';
import { spreadsheetReducer } from './reducers/spreadsheetReducer';
import { rowsReducer } from './reducers/rowsReducer';
import { createRows } from './helpers';
import { statsColumns, potatoLiverData } from './dummyData';

const SpreadsheetStateContext = React.createContext();
const SpreadsheetDispatchContext = React.createContext();
const SelectStateContext = React.createContext();
const SelectDispatchContext = React.createContext();
const RowsStateContext = React.createContext();
const RowsDispatchContext = React.createContext();

export function useRowsState() {
	const context = React.useContext(RowsStateContext);
	if (context === undefined) {
		throw new Error('useRowsState must be used within a SpreadsheetProvider');
	}
	return context;
}
export function useRowsDispatch() {
	const context = React.useContext(RowsDispatchContext);
	if (context === undefined) {
		throw new Error('useRowsDispatch must be used within a SpreadsheetProvider');
	}
	return context;
}

export function useSpreadsheetState() {
	const context = React.useContext(SpreadsheetStateContext);
	if (context === undefined) {
		throw new Error('useSpreadsheetState must be used within a SpreadsheetProvider');
	}
	return context;
}
export function useSpreadsheetDispatch() {
	const context = React.useContext(SpreadsheetDispatchContext);
	if (context === undefined) {
		throw new Error('useSpreadsheetDispatch must be used within a SpreadsheetProvider');
	}
	return context;
}

export function useSelectState() {
	const context = React.useContext(SelectStateContext);
	if (context === undefined) {
		throw new Error('useSpreadsheetState must be used within a SpreadsheetProvider');
	}
	return context;
}
export function useSelectDispatch() {
	const context = React.useContext(SelectDispatchContext);
	if (context === undefined) {
		throw new Error('useSpreadsheetDispatch must be used within a SpreadsheetProvider');
	}
	return context;
}

export function SpreadsheetProvider({ children }) {
	const initialState = {
		// activeCell: null,
		analysisModalOpen: false,
		analysisWindowOpen: false,
		barChartModalOpen: false,
		// First column created will be "Column 2"
		columnCounter: 1,
		valuesColumnsCounter: 0,
		columnTypeModalOpen: false,
		colHeaderContext: false,
		columns: statsColumns,
		colName: null,
		contextMenuOpen: false,
		contextMenuPosition: null,
		contextMenuRowIndex: null,
		distributionModalOpen: false,
		excludedRows: [],
		filters: {
			stringFilters: [],
			numberFilters: [],
		},
		filterModalOpen: false,
		// lastSelection: { row: 1, column: 1 },
		layout: true,
		mappedColumns: {},
		modalError: false,
		rows: createRows(potatoLiverData, statsColumns),
		totalSelectedRows: 0,
		uniqueRowIDs: [],
		uniqueColumnIDs: [],
	};

	const initialSelectState = {
		activeCell: null,
		cellSelectionRanges: [],
		currentCellSelectionRange: null,
		lastSelection: { row: 1, column: 1 },
		selectedColumns: [],
		selectDisabled: false,
		selectedRowIDs: [],
	};

	const initialRowsState = {
		columns: statsColumns,
		rows: createRows(potatoLiverData, statsColumns),
		inverseDependencyMap: {
			_abc1_: [ '_abc3_' ],
			_abc2_: [ '_abc3_' ],
		},
	};

	const [ state, changeSpreadsheet ] = useReducer(spreadsheetReducer, initialState);
	const [ selectState, changeSelectState ] = useReducer(selectReducer, initialSelectState);
	const [ rowsState, changeRowsState ] = useReducer(rowsReducer, initialRowsState);
	return (
		<SpreadsheetStateContext.Provider value={state}>
			<SpreadsheetDispatchContext.Provider value={changeSpreadsheet}>
				<RowsStateContext.Provider value={rowsState}>
					<RowsDispatchContext.Provider value={changeRowsState}>
						<SelectDispatchContext.Provider value={changeSelectState}>
							<SelectStateContext.Provider value={selectState}>{children}</SelectStateContext.Provider>
						</SelectDispatchContext.Provider>
					</RowsDispatchContext.Provider>
				</RowsStateContext.Provider>
			</SpreadsheetDispatchContext.Provider>
		</SpreadsheetStateContext.Provider>
	);
}
