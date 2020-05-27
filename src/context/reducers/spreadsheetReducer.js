import {
	selectRowAndColumnIDs,
	getCol,
	generateUniqueRowIDs,
	filterRowsByColumnRange,
	filterRowsByString,
	returnIntersectionOrNonEmptyArray,
} from '../helpers';

import {
	CLOSE_CONTEXT_MENU,
	CLOSE_COLUMN_TYPE_MODAL,
	COPY_VALUES,
	DELETE_FILTER,
	EXCLUDE_ROWS,
	FILTER_COLUMN,
	OPEN_CONTEXT_MENU,
	SET_SELECTED_COLUMN,
	SET_FILTERS,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_BAR_CHART_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
	TOGGLE_LAYOUT,
	UNEXCLUDE_ROWS,
} from '../../constants';

export function spreadsheetReducer(state, action) {
	const {
		analysisModalOpen,
		barChartModalOpen,
		contextMenuPosition,
		contextMenuType,
		colName,
		column,
		columnTypeModalOpen,
		// copiedValues2dArray,
		distributionModalOpen,
		filters,
		filterModalOpen,
		layout,
		numberFilters,
		rowIndex,
		selectedColumns,
		stringFilter,
	} = action;
	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		case EXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows, rows } = state;
			return {
				...state,
				excludedRows: [ ...new Set(excludedRows.concat(generateUniqueRowIDs(cellSelectionRanges, rows))) ],
			};
		}
		case UNEXCLUDE_ROWS: {
			const { cellSelectionRanges, excludedRows, rows } = state;
			return {
				...state,
				excludedRows: excludedRows.filter((row) => !generateUniqueRowIDs(cellSelectionRanges, rows).includes(row)),
			};
		}
		// EVENT: Change layout
		case TOGGLE_LAYOUT: {
			return { ...state, layout };
		}
		// EVENT: Set grouped columns
		// case SET_GROUPED_COLUMNS: {
		// 	const matchColNameWithID = state.columns.find((col) => {
		// 		return col.label === setColName;
		// 	});

		// 	const groupByColumnID = matchColNameWithID && matchColNameWithID.id;
		// 	// Maybe we can make groupedColumns keep track of column properties such as label, etc
		// 	const groupedColumns = state.rows.reduce((acc, row) => {
		// 		const { [groupByColumnID]: _, ...restRow } = row;
		// 		return { ...acc, [row[groupByColumnID]]: (acc[row[groupByColumnID]] || []).concat(restRow) };
		// 	}, {});

		// 	const groupCount = Object.keys(groupedColumns).length;
		// 	const sortedNonGroupedColumns = state.columns.filter(({ id }) => id !== groupByColumnID).sort((colA, colB) => {
		// 		return state.columnPositions[colA.id] - state.columnPositions[colB.id];
		// 	});

		// 	// Given m logical columns and n different values in our group by column,
		// 	// we should have (m - 1) * n number of physical columns
		// 	const allPhysicalColumns = Array.from({ length: groupCount }).flatMap((_) => {
		// 		return sortedNonGroupedColumns.map((logicalColumn) => {
		// 			return { ...logicalColumn, id: createRandomID(), logicalColumn: logicalColumn.id };
		// 		});
		// 	});
		// 	const logicalRowGroups = Object.values(groupedColumns);
		// 	// the size of the largest group is the maximum number of physical rows
		// 	const physicalRowTotal = Math.max(...logicalRowGroups.map((group) => group.length));
		// 	// We have to translate the logical rows into physical rows
		// 	const physicalRows = state.rows.slice(0, physicalRowTotal).reduce((acc, _, index) => {
		// 		return acc.concat(
		// 			logicalRowGroups.reduce(
		// 				(physicalRow, group, groupIndex) => {
		// 					const logicalRow = group[index];
		// 					// If we have a valid logical row from our group, we then map the row values
		// 					// for all its logical column ids to refer to physical column ids
		// 					return logicalRow
		// 						? sortedNonGroupedColumns.reduce((acc, column, columnIndex, array) => {
		// 								// We compute the offset bvecause allPhysicalColumns is a flat list
		// 								const physicalColumn = allPhysicalColumns[columnIndex + groupIndex * array.length];
		// 								const result = { ...acc, [physicalColumn.id]: logicalRow[column.id] };
		// 								return result;
		// 							}, physicalRow)
		// 						: physicalRow;
		// 				},
		// 				{ id: createRandomID() },
		// 			),
		// 		);
		// 	}, []);

		// 	const physicalRowPositions = physicalRows.reduce((acc, row, index) => ({ ...acc, [row.id]: index }), {});
		// 	return {
		// 		...state,
		// 		setColName,
		// 		physicalRowPositions,
		// 		physicalRows,
		// 		groupedColumns,
		// 		groupByColumnID,
		// 		allPhysicalColumns,
		// 	};
		// }
		// EVENT: Context menu opened
		case OPEN_CONTEXT_MENU: {
			return {
				...state,
				colName,
				contextMenuOpen: true,
				contextMenuPosition,
				contextMenuType,
				contextMenuRowIndex: rowIndex,
			};
		}
		// EVENT: Context menu closed
		case CLOSE_CONTEXT_MENU: {
			return { ...state, contextMenuOpen: false };
		}
		// EVENT: Analysis Modal opened/closed
		case TOGGLE_ANALYSIS_MODAL: {
			return { ...state, analysisModalOpen, activeCell: null };
		}
		case TOGGLE_BAR_CHART_MODAL: {
			return { ...state, barChartModalOpen, activeCell: null };
		}
		// EVENT: Column Type Modal opened/closed
		case TOGGLE_COLUMN_TYPE_MODAL: {
			return {
				...state,
				activeCell: null,
				columnTypeModalOpen,
				selectedColumn: colName ? getCol(state.columns, colName) : column,
				cellSelectionRanges: [],
				currentCellSelectionRange: [],
				modalError: null,
			};
		}
		case CLOSE_COLUMN_TYPE_MODAL: {
			return {
				...state,
				columnTypeModalOpen: false,
				selectedColumn: null,
				modalError: null,
			};
		}
		// EVENT: Distribution Modal opened/closed
		case TOGGLE_DISTRIBUTION_MODAL: {
			return {
				...state,
				distributionModalOpen,
				activeCell: null,
				cellSelectionRanges: [],
				currentCellSelectionRange: [],
			};
		}
		// EVENT: Filter Modal opened/closed
		case TOGGLE_FILTER_MODAL: {
			return {
				...state,
				filterModalOpen,
				selectedColumn: null,
				activeCell: null,
				selectedColumns: [],
				filters: { numberFilters: [], stringFilters: [] },
			};
		}
		case SET_SELECTED_COLUMN: {
			return { ...state, selectedColumns };
		}
		case SET_FILTERS: {
			const stringFilterCopy = { ...state.filters.stringFilters, ...stringFilter };
			return {
				...state,
				selectedColumns: selectedColumns || state.selectedColumns,
				filters: {
					stringFilters: stringFilterCopy,
					numberFilters: numberFilters || state.filters.numberFilters,
				},
			};
		}
		case DELETE_FILTER: {
			return { ...state, filters, selectedColumns };
		}
		case FILTER_COLUMN: {
			const filteredRowsByRange = filterRowsByColumnRange(state.filters.numberFilters, state.rows);
			const filteredRowsByString = filterRowsByString(state.rows, state.filters);
			const filteredRows = returnIntersectionOrNonEmptyArray(filteredRowsByRange, filteredRowsByString);
			const filteredRowIDs = filteredRows.map((row) => row.id);
			const selectedRowIndexes = filteredRows.map((row) => state.rows.findIndex((stateRow) => stateRow.id === row.id));
			const selectedRowObjects = selectedRowIndexes.map((rowIndex) => {
				return {
					top: rowIndex,
					left: 1,
					bottom: rowIndex,
					right: state.columns.length,
				};
			});
			return {
				...state,
				activeCell: null,
				currentCellSelectionRange: selectedRowObjects,
				cellSelectionRanges: selectedRowObjects,
				uniqueRowIDs: filteredRowIDs,
				uniqueColumnIDs: state.columns.map((col) => col.id),
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
