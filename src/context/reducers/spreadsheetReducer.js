import { getCol } from "../helpers";

import {
  CLOSE_CONTEXT_MENU,
  CLOSE_COLUMN_TYPE_MODAL,
  OPEN_CONTEXT_MENU,
  TOGGLE_ANALYSIS_MODAL,
  TOGGLE_BAR_CHART_MODAL,
  TOGGLE_COLUMN_TYPE_MODAL,
  TOGGLE_DISTRIBUTION_MODAL,
  TOGGLE_FILTER_MODAL,
} from "../../constants";

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
    rowIndex,
  } = action;
  const { type } = action;
  switch (type) {
    // EVENT: Context menu opened
    case OPEN_CONTEXT_MENU: {
      const { filter } = action;
      return {
        ...state,
        colName,
        contextMenuOpen: true,
        contextMenuPosition,
        contextMenuType,
        contextMenuRowIndex: rowIndex,
        contextMenuData: { filter },
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
    // EVENT: Bar Chart Modal opened/closed
    case TOGGLE_BAR_CHART_MODAL: {
      return { ...state, barChartModalOpen };
    }
    // EVENT: Column Type Modal opened/closed
    case TOGGLE_COLUMN_TYPE_MODAL: {
      return {
        ...state,
        columnTypeModalOpen,
        selectedColumn: colName ? getCol(action.columns, colName) : column,
      };
    }
    case CLOSE_COLUMN_TYPE_MODAL: {
      return {
        ...state,
        columnTypeModalOpen: false,
        selectedColumn: null,
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
        filters: { numberFilters: [], stringFilters: {} },
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
}
