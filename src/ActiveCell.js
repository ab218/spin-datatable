import React, { useRef, useEffect } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import {
  ADD_CELL_TO_SELECTIONS,
} from './constants'

const cursorKeyToRowColMapper = {
  ArrowUp: function (row, column) {
    // rows should never go less than index 0 (top row header)
    return {row: Math.max(row - 1, 0), column};
  },
  ArrowDown: function (row, column, numberOfRows) {
    return {row: Math.min(row + 1, numberOfRows), column};
  },
  Enter: function (row, column, numberOfRows) {
    return {row: Math.min(row + 1, numberOfRows), column};
  },
  // ArrowLeft: function (row, column) {
  //   // Column should be minimum of 1 due to side row header
  //   return {row, column: Math.max(column - 1, 1)};
  // },
  // ArrowRight: function (row, column) {
  //   return {row, column: column + 1};
  // }
};

function ActiveCell({
  changeActiveCell,
  columnIndex,
  numberOfRows,
  rowIndex,
  updateCell,
  value,
}) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  const onKeyDown = (event) => {
    console.log('event key:', event.key);
    switch (event.key) {
      // TODO: implement key shortcuts from: https://www.ddmcomputing.com/excel/keys/xlsk05.html
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
        event.preventDefault();
        const { row, column } = cursorKeyToRowColMapper[event.key](rowIndex, columnIndex, numberOfRows);
        if (event.shiftKey) {
          dispatchSpreadsheetAction({type: ADD_CELL_TO_SELECTIONS, row, column});
        }
        changeActiveCell(row, column, event.ctrlKey || event.shiftKey || event.metaKey);
        break;

      default:
        break;
    }
  }

  const inputEl = useRef(null);
  useEffect(() => {
    inputEl.current.focus();
  })

  return (
  <td>
    <input
      ref={inputEl}
      type="text"
      value={value}
      onKeyDown={onKeyDown}
      onChange={updateCell}
    />
  </td>
  );
}

export default ActiveCell;