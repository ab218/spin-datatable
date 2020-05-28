import { getCol } from '../helpers';

import {
	CLOSE_CONTEXT_MENU,
	CLOSE_COLUMN_TYPE_MODAL,
	OPEN_CONTEXT_MENU,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_BAR_CHART_MODAL,
	TOGGLE_COLUMN_TYPE_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
	TOGGLE_LAYOUT,
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
		distributionModalOpen,
		filterModalOpen,
		layout,
		rowIndex,
	} = action;
	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);

	switch (type) {
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
			return { ...state, analysisModalOpen };
		}
		case TOGGLE_BAR_CHART_MODAL: {
			return { ...state, barChartModalOpen };
		}
		// EVENT: Column Type Modal opened/closed
		case TOGGLE_COLUMN_TYPE_MODAL: {
			return {
				...state,
				columnTypeModalOpen,
				selectedColumn: colName ? getCol(action.columns, colName) : column,
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
			};
		}
		// EVENT: Filter Modal opened/closed
		case TOGGLE_FILTER_MODAL: {
			return {
				...state,
				filterModalOpen,
				filters: { numberFilters: [], stringFilters: [] },
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
