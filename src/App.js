import React, {useState, useEffect} from 'react';
import {Parser} from 'hot-formula-parser';
import './App.css';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function createRandomID() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function createCell() {
  return {[createRandomID()]: {value: null}};
}

function App({eventBus}) {
  const [cells, setCells] = useState({
    xgi6v: {value: 1},
    dhsu6: {value: 1},
    h1rdx: {value: 1},
    paiov: {value: 1},
    y344s: {value: 1},
    xnnul: {value: 1},
    ohl7r: {value: 1},
    y8ol9: {value: 1},
    lkaq0: {value: 1},
    apq6f: {value: 1},
    isd8w: {value: 1},
    d7uj1: {value: 1},
    npdt9: {value: 1},
    tae9a: {value: 1},
    aj9fm: {value: '=A1+A2'},
  });

  const initialArray = Array(26).fill(undefined);
  const initialModel = Array(40).fill(undefined).map(() => initialArray.slice());
  console.log('initialModel:', initialModel);
  const [cellPositions, setCellPositions] = useState(initialModel
    /*[
    ['xgi6v', 'dhsu6', 'h1rdx', 'paiov', 'y344s'],
    ['xnnul', 'ohl7r', 'y8ol9', 'lkaq0', 'apq6f', undefined, 'qk0w8'],
    ['isd8w', 'd7uj1', 'npdt9', 'tae9a', 'aj9fm']
  ]*/);
  const [activeCell, setActiveCell] = useState(undefined);
  useEffect(() => {
    if (activeCell) {
      eventBus.fire('select-cell', activeCell);
    }
  }, [activeCell, eventBus]);
  useEffect(() => {
    console.log('cells updated:', cells);
  }, [cells]);
  useEffect(()  => {
    console.log('cell positions:', cellPositions);
  }, [cellPositions]);

  const formulaParser = new Parser();
  formulaParser.on('callCellValue', function(cellCoordinates, done) {
    done(cells[cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]].value);
  });

  const columnCount = Math.max(...(cellPositions.map((row) => row.length)));
  const headers = Array(columnCount).fill(undefined).map((_, index) => (<th>{String.fromCharCode(index + 'A'.charCodeAt(0))}</th>))
  const rows = cellPositions.map((row, index) => {
    const emptyCellCount = columnCount - row.length;
    // In case we have a shorter row of cells, create some padding to match the longest row
    const padding = Array(emptyCellCount).fill(null);
    return (<tr key={'row' + index}>{row.map((cell, cellIndex, originalCellArray) => {
      const rowArray = originalCellArray.concat(padding);
      let cellValue = cells[cell] && cells[cell].value;
      if (activeCell && activeCell === cell) {
        // Show a text field only in the active cell
        return (
          <td key={cell} style={{color: 'red'}}><input type="text" defaultValue={cellValue} onBlur={(event) => setCells({...cells, [cell]: {value: event.target.value}})}></input></td>
        )
      } else {
        if (isFormula(cellValue)) {
          const {error, result} = formulaParser.parse(cellValue.slice(1));
          cellValue = error || result;
        }
        return (<td key={cell} onClick={() => {
          if (cell) {
            setActiveCell(cell);
          } else {
            // If there is no cell at the current location, create one and add its position and then activate it
            const newCell = createCell();
            const id = Object.keys(newCell)[0];
            // Add new cell to cell container
            setCells({...cells, ...newCell});
            const changedRow = rowArray.slice(0, cellIndex).concat(id).concat(rowArray.slice(cellIndex +  1));
            const newPositions = cellPositions.slice(0, index).concat([changedRow]).concat(cellPositions.slice(index + 1));
            setCellPositions(newPositions);
            setActiveCell(id);
          }
        } }>{cellValue}</td>);
      }
    }).concat(padding.map((_, emptyIndex) => {
      const key = 'rowIndex' + index + '_extra' + emptyIndex;
      console.log('key:', key);
      return (<td key={key}>@</td>);
    }))}</tr>);
  });
  return (
    <div className="App">
        <table>
          <thead>{headers}</thead>
          <tbody>{rows}</tbody>
        </table>
    </div>
  );
}

export default App;
