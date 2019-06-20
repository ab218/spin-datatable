import React from 'react';
import ActiveCell from './ActiveCell';
import Cell from './Cell';
import './App.css';


function Row({row, rowIndex, emptyCellCount, cells, activeCell, setActiveCell, formulaParser}) {
    // In case we have a shorter row of cells, create some padding to match the longest row
    const padding = Array(emptyCellCount).fill(null);
    const rowHeader = (<td>{rowIndex + 1}</td>);
    return (<tr key={'row' + rowIndex}>{[rowHeader].concat(row.map((cell, cellIndex) => {
      let cellValue = cells[cell] && cells[cell].value;
      if (activeCell && activeCell === cell) {
        // Show a text field only in the active cell
        return (<ActiveCell key={cell} value={cellValue} cell={cell}/>);
      } else {
        return (<Cell key={cell} setActiveCell={setActiveCell} row={rowIndex} col={cellIndex} value={cellValue} formulaParser={formulaParser}/>);
      }
    }).concat(padding.map((_, emptyIndex) => {
      const key = 'rowIndex' + rowIndex + '_extra' + emptyIndex;
      console.log('key:', key);
      return (<td key={key}>@</td>);
    })))}</tr>);
}

export default Row;
