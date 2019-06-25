import React, { useRef, useEffect } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';

function ActiveCell({cell, value, setActiveCell, row, col}) {
  const inputEl = useRef(null);
  useEffect(() => {
    inputEl.current.focus();
  })
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  function updateCell(event) {
    dispatchSpreadsheetAction({type: 'updateCell', cellID: cell, cellValue: event.target.value});
  }

  return (<td style={{color: 'red'}}><input ref={inputEl} type="text" defaultValue={value}
                                            onBlur={updateCell} onKeyDown={(event) => {
    switch (event.key) {
      case 'ArrowDown':
        updateCell(event);
        setActiveCell(row + 1, col);
        break;
      case 'ArrowUp':
        updateCell(event);
        setActiveCell(row - 1, col);
        break;
      case 'ArrowLeft':
        updateCell(event);
        setActiveCell(row, col - 1);
        break;
      case 'ArrowRight':
        updateCell(event);
        setActiveCell(row, col + 1);
        break;
      default:
        break;
    }
  }}></input></td>);
}

export default ActiveCell;