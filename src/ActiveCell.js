import React, { useRef, useEffect } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';

function ActiveCell({cell, value}) {
  const inputEl = useRef(null);
  useEffect(() => {
    inputEl.current.focus();
  })
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  return (<td style={{color: 'red'}}><input ref={inputEl} type="text" defaultValue={value} onBlur={(event) => dispatchSpreadsheetAction({type: 'updateCell', cellID: cell, cellValue: event.target.value})}></input></td>);
}

export default ActiveCell;