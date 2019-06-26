import React, { useRef, useEffect } from 'react';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';

const cursorKeyToRowColMapper = {
  ArrowUp: function (row, column) {
    return {row: row - 1, column};
  },
  ArrowDown: function (row, column) {
    return {row: row + 1, column};
  },
  ArrowLeft: function (row, column) {
    return {row, column: column - 1};
  },
  ArrowRight: function (row, column) {
    return {row, column: column + 1};
  }
};

function ActiveCell({cell, value, setActiveCell, row: someRow, col: someColumn}) {
  const inputEl = useRef(null);
  useEffect(() => {
    inputEl.current.focus();
  })
  const {multiCellSelectionIDs} = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  function updateCell(event) {
    dispatchSpreadsheetAction({type: 'updateCell', cellID: cell, cellValue: event.target.value});
  }

  return (<td style={{color: 'red'}}><input ref={inputEl} type="text" defaultValue={value}
  onBlur={updateCell} onKeyDown={(event) => {
    console.log('event key:', event.key);
  switch (event.key) {
    case 'Meta':
    case 'Shift':
      dispatchSpreadsheetAction({type: 'multi-cell-selection-started', cellID: cell});
      break;
    case 'ArrowDown':
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'ArrowRight':
      const {row, column} = cursorKeyToRowColMapper[event.key](someRow, someColumn);
      setActiveCell(row, column, event.ctrlKey || event.shiftKey || event.metaKey);
      if (multiCellSelectionIDs && multiCellSelectionIDs.length) {
        dispatchSpreadsheetAction({type: 'add-cellID-to-cell-selection', row, column});
      } else {
        updateCell(event);
      }
      break;
    default:
      break;
  }
}}/></td>);
}

export default ActiveCell;