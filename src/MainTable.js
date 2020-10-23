/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import { Column, Table, WindowScroller } from "react-virtualized";
import {
  useRowsState,
  useColumnWidthState,
} from "./context/SpreadsheetProvider";
import CellRenderer from "./CellRenderer";
import RowHeaders from "./RowHeaders";
import HeaderRenderer from "./HeaderRenderer";
import useEventListener from "./useEventListener";
import Toolbar from "./Toolbar";

export const checkIfValidNumber = (str) => {
  if (str.match(/^-?\d*\.?\d*$/)) {
    return false;
  }
  return str;
};

export default React.memo(function TableView() {
  const { rows, columns } = useRowsState();
  const { widths } = useColumnWidthState();
  const [visibleColumns, setVisibleColumns] = useState(1);
  const [visibleRows, setVisibleRows] = useState(1);
  const [tableWidth, setTableWidth] = useState(1000);

  const blankColumnWidth = 100;
  const rowHeaderWidth = 100;

  useEffect(() => {
    setVisibleColumns(
      Math.max(columns.length + 3, Math.ceil(window.innerWidth / 100)),
    );
    setVisibleRows(
      Math.max(rows.length + 5, Math.ceil(window.innerHeight / 30)),
    );
  }, [window.innerWidth, window.innerHeight, rows, columns]);

  const columnsDiff = visibleColumns - columns.length;

  useEffect(() => {
    function sumOfColumnWidths(columns) {
      let total = 0;
      for (let i = 0; i < columns.length; i++) {
        total += columns[i];
      }
      return total;
    }
    setTableWidth(
      sumOfColumnWidths(Object.values(widths)) + columnsDiff * blankColumnWidth,
    );
  }, [widths]);

  const emptyRow = {};

  let timer = null;
  let intensity = null;

  // I adjust the window scrolling in response to the given mousemove event.
  const handleMousemove = useCallback(({ buttons, clientX, clientY }) => {
    // TODO: Reexplore more performant ways of handling this
    // CAUTION: The viewport and document dimensions can all be CACHED and then
    // recalculated on window-resize events (for the most part).

    const edgeSize = 25;
    // Get the viewport-relative coordinates of the mousemove event.
    const viewportX = clientX;
    const viewportY = clientY;

    // Get the viewport dimensions.
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Next, we need to determine if the mouse is within the "edge" of the
    // viewport, which may require scrolling the window. To do this, we need to
    // calculate the boundaries of the edge in the viewport (these coordinates
    // are relative to the viewport grid system).
    const edgeTop = 50;
    const edgeLeft = edgeSize;
    const edgeBottom = viewportHeight - edgeSize;
    const edgeRight = viewportWidth - edgeSize;

    const isInLeftEdge = viewportX < edgeLeft;
    const isInRightEdge = viewportX > edgeRight;
    // prevent scrolling up when column headers clicked
    const isInTopEdge = (viewportY < 60 && viewportY > 30) || viewportY < 0;
    const isInBottomEdge = viewportY > edgeBottom;

    // If the mouse is not in the viewport edge, there's no need to calculate
    // anything else.
    if (!(isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge)) {
      clearTimeout(timer);
      return;
    }
    // Get the document dimensions.
    // NOTE: The various property reads here are for cross-browser compatibility
    // as outlined in the JavaScript.info site (link provided above).
    const documentWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.body.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth,
    );
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.body.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight,
    );

    // Calculate the maximum scroll offset in each direction. Since you can only
    // scroll the overflow portion of the document, the maximum represents the
    // length of the document that is NOT in the viewport.
    const maxScrollX = documentWidth - viewportWidth;
    const maxScrollY = documentHeight - viewportHeight;

    // As we examine the mousemove event, we want to adjust the window scroll in
    // immediate response to the event; but, we also want to continue adjusting
    // the window scroll if the user rests their mouse in the edge boundary. To
    // do this, we'll invoke the adjustment logic immediately. Then, we'll setup
    // a timer that continues to invoke the adjustment logic while the window can
    // still be scrolled in a particular direction.
    // --
    (function checkForWindowScroll() {
      // console.log('fire', buttons);
      clearTimeout(timer);

      if (adjustWindowScroll()) {
        timer = setTimeout(checkForWindowScroll, 100);
      }
    })();

    // Adjust the window scroll based on the user's mouse position. Returns True
    // or False depending on whether or not the window scroll was changed.
    function adjustWindowScroll() {
      if (buttons !== 1) return;
      // Get the current scroll position of the document.
      const currentScrollX = window.pageXOffset;
      const currentScrollY = window.pageYOffset;

      // Determine if the window can be scrolled in any particular direction.
      const canScrollUp = currentScrollY > 0;
      const canScrollDown = currentScrollY < maxScrollY;
      const canScrollLeft = currentScrollX > 0;
      const canScrollRight = currentScrollX < maxScrollX;

      // Since we can potentially scroll in two directions at the same time,
      // let's keep track of the next scroll, starting with the current scroll.
      // Each of these values can then be adjusted independently in the logic
      // below.
      let nextScrollX = currentScrollX;
      let nextScrollY = currentScrollY;

      // As we examine the mouse position within the edge, we want to make the
      // incremental scroll changes more "intense" the closer that the user
      // gets the viewport edge. As such, we'll calculate the percentage that
      // the user has made it "through the edge" when calculating the delta.
      // Then, that use that percentage to back-off from the "max" step value.
      const maxStep = 50;

      // Should we scroll left?
      if (isInLeftEdge && canScrollLeft) {
        intensity = (edgeLeft - viewportX) / edgeSize;
        nextScrollX = nextScrollX - maxStep * intensity;

        // Should we scroll right?
      } else if (isInRightEdge && canScrollRight) {
        intensity = (viewportX - edgeRight) / edgeSize;
        nextScrollX = nextScrollX + maxStep * intensity;
      }

      // Should we scroll up?
      if (isInTopEdge && canScrollUp) {
        // prevent page from scrolling down at the top (-intensity)
        intensity = (Math.max(edgeTop - viewportY), 10) / edgeSize;
        nextScrollY = nextScrollY - maxStep * intensity;

        // Should we scroll down?
      } else if (isInBottomEdge && canScrollDown) {
        intensity = (viewportY - edgeBottom) / edgeSize;
        nextScrollY = nextScrollY + maxStep * intensity;
      }

      // Sanitize invalid maximums. An invalid scroll offset won't break the
      // subsequent .scrollTo() call; however, it will make it harder to
      // determine if the .scrollTo() method should have been called in the
      // first place.
      nextScrollX = Math.max(0, Math.min(maxScrollX, nextScrollX));
      nextScrollY = Math.max(0, Math.min(maxScrollY, nextScrollY));

      if (nextScrollX !== currentScrollX || nextScrollY !== currentScrollY) {
        window.scrollTo(nextScrollX, nextScrollY);
        return true;
      } else {
        return false;
      }
    }
  }, []);

  useEventListener("mousemove", handleMousemove);

  const cellRendererCallback = useCallback((column) => (props) => {
    // rowData = rowID, dataKey = columnID
    const { dataKey: columnID, rowData } = props;
    const rowID = rowData.id;
    return (
      <CellRenderer
        {...props}
        column={column}
        columnID={columnID}
        rowsLength={rows.length}
        rowID={rowID}
      />
    );
  });

  return (
    <React.Fragment>
      <Toolbar />
      <WindowScroller>
        {({ height, scrollTop, onScroll }) => (
          <div
            style={{
              display: "flex",
              marginTop: "60px",
              left: "20vw",
              zIndex: 3,
            }}
          >
            <div>
              {/* Row header column */}
              <Table
                autoheight
                height={height}
                scrollTop={scrollTop}
                onScroll={onScroll}
                overscanRowCount={0}
                width={rowHeaderWidth}
                headerHeight={25}
                rowHeight={30}
                rowGetter={({ index }) => rows[index] || emptyRow}
                rowCount={visibleRows}
                rowStyle={{ alignItems: "stretch" }}
              >
                <Column
                  width={100}
                  label={""}
                  dataKey={"rowHeaderColumn"}
                  headerRenderer={() => (
                    <div style={{ cursor: "default" }}></div>
                  )}
                  cellRenderer={(props) => <RowHeaders {...props} />}
                  style={{ margin: 0 }}
                />
              </Table>
            </div>
            <div style={{ display: "flex" }}>
              <Table
                autoHeight
                height={height}
                scrollTop={scrollTop}
                onScroll={onScroll}
                overscanRowCount={0}
                width={tableWidth}
                headerHeight={25}
                rowHeight={30}
                rowCount={visibleRows}
                rowGetter={({ index }) => rows[index] || emptyRow}
                rowStyle={{ alignItems: "stretch" }}
              >
                {renderColumns(columns, cellRendererCallback, widths)}
                {visibleColumns &&
                  renderBlankColumns(
                    visibleColumns,
                    columns,
                    blankColumnWidth,
                    cellRendererCallback,
                  )}
              </Table>
            </div>
          </div>
        )}
      </WindowScroller>
    </React.Fragment>
  );
});

function renderColumns(columns, cellRendererCallback, widths) {
  return columns.map((column, columnIndex) => {
    return (
      <Column
        key={columnIndex}
        cellRenderer={cellRendererCallback(column)}
        columnIndex={columnIndex}
        dataKey={(column && column.id) || ""}
        headerRenderer={(props) => (
          <HeaderRenderer
            {...props}
            column={column}
            columnIndex={columnIndex}
            units={column && column.units}
          />
        )}
        label={(column && column.label) || ""}
        width={widths[column.id] || 100}
        style={{
          border: "1px solid #ddd",
          borderLeft: columnIndex === 0 ? "1 px solid #ddd" : "none",
          margin: 0,
        }}
      />
    );
  });
}

function renderBlankColumns(
  totalColumnCount,
  columns,
  blankColumnWidth,
  cellRendererCallback,
) {
  const columnContainer = [];
  for (
    let columnIndex = columns.length - 1;
    columnIndex < totalColumnCount;
    columnIndex++
  ) {
    columnContainer.push(
      <Column
        key={columnIndex}
        cellRenderer={cellRendererCallback(null)}
        columnIndex={columnIndex}
        dataKey={""}
        headerRenderer={(props) => (
          <HeaderRenderer {...props} columnIndex={columnIndex + 1} />
        )}
        label={""}
        width={blankColumnWidth}
        style={{
          border: "1px solid #ddd",
          borderLeft: columnIndex === 0 ? "1 px solid #ddd" : "none",
          margin: 0,
        }}
      />,
    );
  }
  return columnContainer;
}
