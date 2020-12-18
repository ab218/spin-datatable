/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StopOutlined } from "@ant-design/icons";
import { Divider, Input } from "antd";
import {
  FILTER_SELECT_ROWS,
  HIGHLIGHT_FILTERED_ROWS,
  OPEN_CONTEXT_MENU,
  REMOVE_HIGHLIGHTED_FILTERED_ROWS,
  REMOVE_SELECTED_CELLS,
  SELECT_COLUMN,
  SET_FILTERS,
  SET_SELECTED_COLUMN,
  SET_TABLE_NAME,
  TOGGLE_FILTER_MODAL,
} from "./constants";
import {
  useSelectDispatch,
  useSelectState,
  useRowsState,
  useRowsDispatch,
  useSpreadsheetDispatch,
  useSpreadsheetState,
} from "./context/SpreadsheetProvider";
import { flattenCellSelectionRanges } from "./context/helpers.js";
import { createModelingTypeIcon } from "./Modals/ModalShared";
import { analyzeData } from "./analysis-output/Analysis";

const SelectedRowsCounter = React.memo(function () {
  const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
  const [selectedRowsTotal, setSelectedRowsTotal] = useState(0);

  useEffect(() => {
    const flattenedCellSelectionRanges = flattenCellSelectionRanges(
      cellSelectionRanges,
      currentCellSelectionRange,
    );
    const rowCount = flattenedCellSelectionRanges.reduce((sum, range) => {
      return sum + (range.bottom - range.top) + 1;
    }, 0);
    setSelectedRowsTotal(rowCount);
  }, [cellSelectionRanges, currentCellSelectionRange]);
  return (
    <tr>
      <td style={{ width: "80%" }}>Selected</td>
      <td style={{ width: "20%" }}>{selectedRowsTotal}</td>
    </tr>
  );
});

const SidebarColumn = React.memo(function ({ column, columnIndex, rows }) {
  const dispatchSelectAction = useSelectDispatch();
  const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
  const [selected, setSelected] = useState();

  useEffect(() => {
    const inCurrentCellSelection =
      currentCellSelectionRange &&
      columnIndex >= currentCellSelectionRange.left &&
      columnIndex <= currentCellSelectionRange.right;
    const inCellSelectionRanges = cellSelectionRanges.some(
      (range) => columnIndex >= range.left && columnIndex <= range.right,
    );
    setSelected(inCurrentCellSelection || inCellSelectionRanges);
  }, [cellSelectionRanges, currentCellSelectionRange]);

  return (
    <tr
      onClick={(e) => {
        dispatchSelectAction({
          type: SELECT_COLUMN,
          rows: rows,
          columnID: column.id,
          columnIndex,
          metaKeyPressed: e.ctrlKey || e.metaKey,
          shiftKeyPressed: e.shiftKey,
        });
      }}
    >
      <td className={selected ? "sidebar-column-selected" : ""}>
        {createModelingTypeIcon(column.modelingType)}
        <span>{column.label}</span>
      </td>
    </tr>
  );
});

const ExcludedRowsCounter = React.memo(function () {
  const { excludedRows } = useRowsState();
  return (
    <tr>
      <td style={{ width: "80%" }}>Excluded</td>
      <td style={{ width: "20%" }}>{excludedRows.length}</td>
    </tr>
  );
});

const SidebarAnalyses = React.memo(function ({ setPopup }) {
  const { savedAnalyses } = useRowsState();
  return (
    savedAnalyses.length > 0 && (
      <React.Fragment>
        <table
          style={{ userSelect: "none", marginLeft: "10px", width: "100%" }}
        >
          <tbody>
            <tr>
              <td style={{ width: "80%", fontWeight: "bold" }}>
                Saved Analyses
              </td>
              <td style={{ width: "20%", fontWeight: "bold" }} />
            </tr>
            {savedAnalyses.map((savedAnalysis) => (
              <SidebarAnalysis
                setPopup={setPopup}
                key={savedAnalysis.id}
                savedAnalysis={savedAnalysis}
              />
            ))}
          </tbody>
        </table>
        <Divider />
      </React.Fragment>
    )
  );
});

const SidebarAnalysis = React.memo(function ({ savedAnalysis, setPopup }) {
  return (
    <React.Fragment>
      <tr onClick={() => analyzeData(savedAnalysis, setPopup)}>
        <td>{savedAnalysis.title || "Analysis"}</td>
      </tr>
      <tr style={{ height: "10px" }} />
    </React.Fragment>
  );
});

const SidebarFilters = React.memo(function () {
  const { columns, rows, savedFilters } = useRowsState();
  const dispatchSelectAction = useSelectDispatch();
  const [filterClicked, setFilterClicked] = useState(null);

  useEffect(() => {
    if (filterClicked) {
      dispatchSelectAction({
        type: FILTER_SELECT_ROWS,
        filters: [filterClicked],
        rows,
        columns,
      });
    } else {
      dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
    }
  }, [filterClicked]);

  return (
    savedFilters.length > 0 && (
      <React.Fragment>
        <table
          style={{ userSelect: "none", marginLeft: "10px", width: "100%" }}
        >
          <tbody>
            <tr>
              <td style={{ width: "80%", fontWeight: "bold" }}>Filters</td>
              <td style={{ width: "20%", fontWeight: "bold" }} />
            </tr>
            {savedFilters.map((filter) => (
              <SidebarFilter
                key={filter.id}
                filterClicked={filterClicked}
                filter={filter}
                setFilterClicked={setFilterClicked}
              />
            ))}
          </tbody>
        </table>
        <Divider />
      </React.Fragment>
    )
  );
});

const SidebarFilter = React.memo(function ({
  filter,
  filterClicked,
  setFilterClicked,
}) {
  const { appliedFilterExclude } = useRowsState();
  const { filterModalOpen } = useSpreadsheetState();
  const dispatchSelectAction = useSelectDispatch();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const dispatchRowsAction = useRowsDispatch();
  const {
    filteredRowIDs,
    filterName,
    id,
    numberFilters,
    selectedColumns,
    script,
    stringFilters,
  } = filter;
  const checked = filterClicked && filterClicked.id === id;
  return (
    <React.Fragment key={id}>
      <tr
        className={checked ? "sidebar-column-selected" : ""}
        onClick={() => {
          setFilterClicked(() => (checked ? null : filter));
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatchSpreadsheetAction({
            type: OPEN_CONTEXT_MENU,
            contextMenuType: "cellSelectionRule",
            contextMenuPosition: { left: e.pageX, top: e.pageY },
            filter,
          });
        }}
        onMouseOver={() => {
          dispatchRowsAction({
            type: HIGHLIGHT_FILTERED_ROWS,
            filteredRowIDs,
          });
        }}
        onMouseOut={() => {
          if (!filterModalOpen) {
            dispatchRowsAction({
              type: REMOVE_HIGHLIGHTED_FILTERED_ROWS,
            });
          }
        }}
        onDoubleClick={() => {
          dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns });
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
        <td>{filterName || script || "Filter"}</td>
        <td>
          {appliedFilterExclude === filter.id ? (
            <StopOutlined style={{ color: "red", marginRight: 20 }} />
          ) : null}
        </td>
      </tr>
      <tr style={{ height: "10px" }} />
    </React.Fragment>
  );
});

const SidebarColumns = React.memo(function () {
  const { columns, rows } = useRowsState();
  return (
    <table
      style={{
        userSelect: "none",
        marginTop: "100px",
        marginLeft: "10px",
        width: "100%",
      }}
    >
      <tbody>
        <tr>
          <td style={{ fontWeight: "bold" }}>Variables</td>
        </tr>
        {columns &&
          columns.map((column, columnIndex) => (
            <SidebarColumn
              key={columnIndex}
              column={column}
              columnIndex={columnIndex}
              rows={rows}
            />
          ))}
      </tbody>
    </table>
  );
});

const SidebarRows = React.memo(function () {
  const { rows } = useRowsState();
  return (
    <table style={{ userSelect: "none", marginLeft: "10px", width: "100%" }}>
      <tbody>
        <tr>
          <td style={{ width: "80%", fontWeight: "bold" }}>Cases</td>
          <td style={{ width: "20%", fontWeight: "bold" }} />
        </tr>
        <tr>
          <td style={{ width: "80%" }}>All Cases</td>
          <td style={{ width: "20%" }}>{rows.length}</td>
        </tr>
        <SelectedRowsCounter />
        <ExcludedRowsCounter />
      </tbody>
    </table>
  );
});

const SidebarTableName = React.memo(function () {
  const { dataTableName } = useRowsState();
  const dispatchSelectAction = useSelectDispatch();
  const dispatchRowsAction = useRowsDispatch();
  return (
    <Input
      style={{
        borderLeft: "none",
        borderTop: "none",
        borderRight: "none",
        borderRadius: 0,
      }}
      size="large"
      placeholder="Untitled Data Table"
      defaultValue={dataTableName}
      onClick={(e) => {
        dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      onBlur={(e) => {
        dispatchRowsAction({
          type: SET_TABLE_NAME,
          dataTableName: e.target.value,
        });
      }}
    />
  );
});

export default function Sidebar({ setPopup }) {
  return (
    <div
      style={{
        height: "100%",
        width: "95%",
      }}
    >
      <SidebarTableName />
      <SidebarColumns />
      <Divider />
      <SidebarRows />
      <Divider />
      <SidebarFilters />
      <SidebarAnalyses setPopup={setPopup} />
    </div>
  );
}
