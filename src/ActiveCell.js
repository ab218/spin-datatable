import React from 'react';

function ActiveCell({updateCell, cell, value}) {
  return (<td style={{color: 'red'}}><input type="text" defaultValue={value} onBlur={(event) => updateCell(cell, event.target.value)}></input></td>);
}

export default ActiveCell;