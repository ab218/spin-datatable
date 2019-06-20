import React from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';

function ActiveCell({cell, value}) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  return (<td style={{color: 'red'}}><input type="text" defaultValue={value} onBlur={(event) => dispatchSpreadsheetAction({type: 'updateCell', cellID: cell, cellValue: event.target.value})}></input></td>);
}

export default ActiveCell;