import React, { useRef, useEffect } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';

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

  const onKeyDown = (event) => {
    console.log('event key:', event.key);
    switch (event.key) {
      // TODO: implement key shortcuts from: https://www.ddmcomputing.com/excel/keys/xlsk05.html
      case 'ArrowDown':
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        const {row, column} = cursorKeyToRowColMapper[event.key](someRow, someColumn);
        setActiveCell(row, column, event.ctrlKey || event.shiftKey || event.metaKey);
        if (event.shiftKey) {
          dispatchSpreadsheetAction({type: 'add-cellID-to-cell-selection', row, column});
        } else {
          updateCell(event);
        }
        break;
      case 'Backspace':
        dispatchSpreadsheetAction({type: 'delete-values'})
        break;
      default:
        break;
    }
  }

  const inputEl = useRef(null);
  useEffect(() => {
    inputEl.current.focus();
  })
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  function updateCell(event) {
    dispatchSpreadsheetAction({type: 'updateCell', cellID: cell, cellValue: event.target.value});
  }

  return (<td style={{color: 'red'}}><input ref={inputEl} type="text" defaultValue={value} onInput={updateCell} onKeyDown={onKeyDown}/></td>);
}

export default ActiveCell;