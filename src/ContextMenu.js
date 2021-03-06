import React, { useEffect } from "react";
import {
  useSpreadsheetState,
  useSpreadsheetDispatch,
  useSelectDispatch,
  useSelectState,
  useRowsDispatch,
  useRowsState,
} from "./context/SpreadsheetProvider";
import {
  CLOSE_CONTEXT_MENU,
  COPY_VALUES,
  DELETE_COLUMN,
  DELETE_ROWS,
  DELETE_VALUES,
  EXCLUDE_ROWS,
  FILTER_EXCLUDE_ROWS,
  FILTER_UNEXCLUDE_ROWS,
  INVERT_ROW_SELECTION,
  REMOVE_HIGHLIGHTED_FILTERED_ROWS,
  REMOVE_SELECTED_CELLS,
  REMOVE_SIDEBAR_FILTER,
  SET_FILTERS,
  SET_SELECTED_COLUMN,
  SORT_COLUMN,
  TOGGLE_COLUMN_TYPE_MODAL,
  TOGGLE_FILTER_MODAL,
} from "./constants";
import { Menu } from "antd";

const { SubMenu } = Menu;

export default function ContextMenu({ paste }) {
  const {
    contextMenuType,
    colName,
    contextMenuOpen,
    contextMenuPosition,
    contextMenuRowIndex,
    contextMenuData,
  } = useSpreadsheetState();
  const { cellSelectionRanges } = useSelectState();
  const { appliedFilterExclude, rows, columns } = useRowsState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const dispatchSelectAction = useSelectDispatch();
  const dispatchRowsAction = useRowsDispatch();

  const onClick = (e) => {
    if (contextMenuOpen) {
      dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
    }
  };

  useEffect(() => {
    const menu = document.querySelector(".menu");
    menu.style.display = contextMenuOpen ? "block" : "none";
    if (contextMenuPosition) {
      const { left, top } = contextMenuPosition;
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    }
  });
  // TODO FIX BUG WITH DELETE COLUMN. Residual text.
  if (contextMenuType === "column") {
    return (
      <div onClick={onClick} className="menu">
        <Menu selectable={false} style={{ width: 256 }} mode="vertical">
          <Menu.Item
            key="1"
            onClick={() => {
              dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
              dispatchSpreadsheetAction({
                type: TOGGLE_COLUMN_TYPE_MODAL,
                columnTypeModalOpen: true,
                colName,
                columns,
              });
            }}
          >
            Variable Note...
          </Menu.Item>
          <Menu.Item
            key="4"
            onClick={() => dispatchRowsAction({ type: DELETE_COLUMN, colName })}
          >
            Delete Column
          </Menu.Item>
          <SubMenu key="sub1" title="Sort">
            <Menu.Item
              key="4"
              onClick={() => {
                dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
                dispatchRowsAction({
                  type: SORT_COLUMN,
                  colName,
                  descending: true,
                });
              }}
            >
              Descending
            </Menu.Item>
            <Menu.Item
              key="5"
              onClick={() => {
                dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
                dispatchRowsAction({
                  type: SORT_COLUMN,
                  colName,
                  descending: false,
                });
              }}
            >
              Ascending
            </Menu.Item>
          </SubMenu>
        </Menu>
      </div>
    );
  } else if (contextMenuType === "row") {
    return (
      <div onClick={onClick} className="menu">
        <Menu selectable={false} style={{ width: 256 }} mode="vertical">
          <Menu.Item
            onClick={() => {
              dispatchRowsAction({
                type: DELETE_ROWS,
                rowIndex: contextMenuRowIndex,
                cellSelectionRanges,
              });
              dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
            }}
            key="19"
          >
            Delete Selected Cases
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              dispatchRowsAction({ type: EXCLUDE_ROWS, cellSelectionRanges });
            }}
            key="20"
          >
            Exclude/Unexclude Selected Cases(s)
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              dispatchSelectAction({
                type: INVERT_ROW_SELECTION,
                rows,
                columns,
              });
            }}
            key="21"
          >
            Invert Row Selection
          </Menu.Item>
        </Menu>
      </div>
    );
  } else if (contextMenuType === "cellSelectionRule") {
    const { filter } = contextMenuData;
    return (
      <div onClick={onClick} className="menu">
        <Menu selectable={false} style={{ width: 256 }} mode="vertical">
          <Menu.Item
            key="editSelectionRule"
            onClick={() => {
              const {
                selectedColumns,
                id,
                filterName,
                stringFilters,
                numberFilters,
                script,
              } = filter;
              dispatchSelectAction({
                type: SET_SELECTED_COLUMN,
                selectedColumns,
              });
              dispatchSpreadsheetAction({
                type: TOGGLE_FILTER_MODAL,
                filterModalOpen: true,
              });
              dispatchRowsAction({
                type: SET_FILTERS,
                selectedColumns,
                id,
                filterName,
                stringFilters,
                numberFilters,
                script,
              });
            }}
          >
            Edit Selection Rule
          </Menu.Item>
          <Menu.Item
            key="cloneSelectionRule"
            onClick={() => {
              const {
                selectedColumns,
                filterName,
                stringFilters,
                numberFilters,
                script,
              } = filter;
              dispatchSelectAction({
                type: SET_SELECTED_COLUMN,
                selectedColumns,
              });
              dispatchSpreadsheetAction({
                type: TOGGLE_FILTER_MODAL,
                filterModalOpen: true,
              });
              dispatchRowsAction({
                type: SET_FILTERS,
                selectedColumns,
                filterName,
                stringFilters,
                numberFilters,
                script,
              });
            }}
          >
            Clone Selection Rule
          </Menu.Item>
          <Menu.Item
            style={{ display: "flex", justifyContent: "space-between" }}
            onClick={(e) => {
              if (!appliedFilterExclude.includes(filter.id)) {
                dispatchRowsAction({
                  type: FILTER_EXCLUDE_ROWS,
                  filter,
                  rows,
                  columns,
                });
              } else {
                dispatchRowsAction({
                  type: FILTER_UNEXCLUDE_ROWS,
                  filter,
                  rows,
                  columns,
                });
              }
            }}
          >
            <span>Exclude these rows</span>
            <span>{appliedFilterExclude.includes(filter.id) ? "✓" : ""}</span>
          </Menu.Item>
          <Menu.Item
            onClick={(e) => {
              dispatchRowsAction({ type: REMOVE_SIDEBAR_FILTER, filter });
              dispatchRowsAction({ type: REMOVE_HIGHLIGHTED_FILTERED_ROWS });
              dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
            }}
          >
            Delete Filter
          </Menu.Item>
        </Menu>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="menu">
      <Menu selectable={false} style={{ width: 256 }} mode="vertical">
        <Menu.Item
          onClick={() => {
            dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges });
            dispatchRowsAction({ type: DELETE_VALUES, cellSelectionRanges });
          }}
          key="17"
        >
          Cut
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges })
          }
          key="18"
        >
          Copy
        </Menu.Item>
        <Menu.Item onClick={paste} key="19">
          Paste
        </Menu.Item>
        <Menu.Item disabled={true} key="analyzeSelection">
          Analyze Selection
        </Menu.Item>
      </Menu>
    </div>
  );
}
