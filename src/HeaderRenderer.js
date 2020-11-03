/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import {
  useSpreadsheetState,
  useSpreadsheetDispatch,
  useSelectDispatch,
  useRowsState,
  useRowsDispatch,
  useSelectState,
  useColumnWidthDispatch,
} from "./context/SpreadsheetProvider";
import Draggable from "react-draggable";
import {
  ADD_COLUMN_WIDTH,
  CREATE_COLUMNS,
  CLOSE_CONTEXT_MENU,
  OPEN_CONTEXT_MENU,
  RESIZE_COLUMN,
  REMOVE_SELECTED_CELLS,
  SELECT_COLUMN,
  TOGGLE_COLUMN_TYPE_MODAL,
} from "./constants";

export default React.memo(function HeaderRenderer({
  dataKey,
  label,
  units,
  columnIndex,
}) {
  const { contextMenuOpen } = useSpreadsheetState();
  const { columns, rows } = useRowsState();
  const { cellSelectionRanges, currentCellSelectionRange } = useSelectState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const dispatchSelectAction = useSelectDispatch();
  const dispatchRowsAction = useRowsDispatch();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const inCurrent =
      currentCellSelectionRange &&
      currentCellSelectionRange.left <= columnIndex &&
      currentCellSelectionRange.right >= columnIndex;
    const inRanges = cellSelectionRanges.find(
      (cellRange) =>
        cellRange.left <= columnIndex && cellRange.right >= columnIndex,
    );
    setSelected(inCurrent || inRanges);
  }, [currentCellSelectionRange, cellSelectionRanges]);

  function createNewColumns(columnCount) {
    dispatchRowsAction({ type: CREATE_COLUMNS, columnCount });
  }
  function openModal(e) {
    if (!dataKey) {
      if (columnIndex >= columns.length - 1) {
        createNewColumns(columnIndex + 1 - columns.length);
        return;
      }
    }
    dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
    dispatchSpreadsheetAction({
      type: TOGGLE_COLUMN_TYPE_MODAL,
      columnTypeModalOpen: true,
      column: columns.find((col) => col.id === dataKey),
    });
  }

  return (
    <React.Fragment key={dataKey}>
      <div
        className={
          selected
            ? "ReactVirtualized__Table__headerTruncatedText column-header-selected"
            : "ReactVirtualized__Table__headerTruncatedText"
        }
        style={{
          position: "sticky",
          top: 0,
          userSelect: "none",
        }}
        onClick={(e) => {
          if (columnIndex < columns.length) {
            if (contextMenuOpen) {
              dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
            }
            dispatchSelectAction({
              type: SELECT_COLUMN,
              rows,
              columnID: dataKey,
              columnIndex,
              metaKeyPressed: e.ctrlKey || e.metaKey,
              shiftKeyPressed: e.shiftKey,
            });
          }
        }}
        onDoubleClick={openModal}
        onContextMenu={(e) => {
          if (columnIndex < columns.length) {
            e.preventDefault();
            dispatchSelectAction({
              type: SELECT_COLUMN,
              rows,
              columnID: dataKey,
              columnIndex,
              metaKeyPressed: e.ctrlKey || e.metaKey,
              shiftKeyPressed: e.shiftKey,
            });
            dispatchSpreadsheetAction({
              type: OPEN_CONTEXT_MENU,
              colName: label,
              contextMenuType: "column",
              contextMenuPosition: { left: e.pageX, top: e.pageY },
            });
          }
        }}
      >
        {label}
        {units ? ` (${units})` : ""}
      </div>
      <DraggableHeader dataKey={dataKey} selected={selected} />
    </React.Fragment>
  );
});

const DraggableHeader = React.memo(function DraggableHeader({
  dataKey,
  selected,
}) {
  const dispatchColumnWidthAction = useColumnWidthDispatch();
  useEffect(() => {
    dispatchColumnWidthAction({ type: ADD_COLUMN_WIDTH, dataKey });
  }, []);
  const resizeColumn = useCallback(
    (_, { deltaX }) => {
      dispatchColumnWidthAction({ type: RESIZE_COLUMN, dataKey, deltaX });
    },
    [dataKey],
  );
  return (
    <Draggable
      axis="x"
      defaultClassName="DragHandle"
      defaultClassNameDragging="DragHandleActive"
      onDrag={resizeColumn}
      position={{ x: 0 }}
      zIndex={10}
    >
      <span
        style={{ userSelect: "none" }}
        className={selected ? "DragHandleIcon-selected" : "DragHandleIcon"}
      >
        ⋮
      </span>
    </Draggable>
  );
});
