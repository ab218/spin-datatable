// import {
// generateUniqueRowIDs,
// filterRowsByColumnRange,
// filterRowsByString,
// returnIntersectionOrNonEmptyArray,
// } from '../helpers';

// import { DELETE_FILTER, FILTER_COLUMN, FILTER_EXCLUDE_ROWS, SAVE_FILTER, SET_FILTERS } from '../../constants';

export function filterReducer(state, action) {
	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		// case FILTER_COLUMN: {
		// 	const { rows, columns } = action;
		// 	const filteredRowsByRange = filterRowsByColumnRange(state.filters.numberFilters, rows);
		// 	const filteredRowsByString = filterRowsByString(rows, state.filters);
		// 	const intersection = returnIntersectionOrNonEmptyArray(filteredRowsByRange, filteredRowsByString);
		// 	const filteredRowIDs = intersection.map((row) => row.id);
		// 	const selectedRowIndexes = intersection.map((row) => rows.findIndex((stateRow) => stateRow.id === row.id));
		// 	const selectedRowObjects = selectedRowIndexes.map((rowIndex) => {
		// 		return {
		// 			top: rowIndex,
		// 			left: 0,
		// 			bottom: rowIndex,
		// 			right: columns.length - 1,
		// 		};
		// 	});
		// 	return {
		// 		...state,
		// 		activeCell: null,
		// 		filteredRows: selectedRowObjects,
		// 		filteredRowIDs,
		// 		filteredColumnIDs: columns.map((col) => col.id),
		// 	};
		// }
		// case SET_FILTERS: {
		// 	const { selectedColumns, numberFilters, stringFilters } = action;
		// 	const stringFilterCopy = { ...state.filters.stringFilters, ...stringFilter };
		// 	return {
		// 		...state,
		// 		filters: {
		// 			selectedColumns: selectedColumns || state.selectedColumns,
		// 			stringFilters: stringFilterCopy,
		// 			numberFilters: numberFilters || state.filters.numberFilters,
		// 		},
		// 	};
		// }
		// case FILTER_EXCLUDE_ROWS: {
		// 	const { rows } = state;
		// 	const { filteredRows } = action;
		// 	return { ...state, excludedRows: generateUniqueRowIDs(filteredRows, rows) };
		// }
		// case SAVE_FILTER: {
		// 	const { filters, filterName, includeRows, selectRows } = action;
		// 	const newFilter = { ...filters, filterName, includeRows, selectRows };
		// 	return { ...state, savedFilters: state.savedFilters.concat(newFilter) };
		// }
		// case DELETE_FILTER: {
		// 	const { filters } = action;
		// 	return { ...state, filters };
		// }
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
