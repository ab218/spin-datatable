import React, {useState, useEffect} from 'react';
import {Parser} from 'hot-formula-parser';
import './App.css';
import Row from './Row'

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

function Spreadsheet({eventBus}) {
  const [cells, setCells] = useState({});

  const initialArray = Array(26).fill(undefined);
  const initialModel = Array(40).fill(undefined).map(() => initialArray.slice());
  console.log('initialModel:', initialModel);
  const [cellPositions, setCellPositions] = useState(initialModel);
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
    const cellValue = cells[cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]].value;
    if (isFormula(cellValue)) {
      const {error, result} = formulaParser.parse(cellValue.slice(1));
      done(error || result);
    } else {
      done(cellValue);
    }
  });

  function changeActiveCell(row, column)  {
    const cell = cellPositions[row][column];
    console.log('changeActiveCell', arguments, 'cell:', cell);
    if (cell) {
      setActiveCell(cell);
    } else {
      // If there is no cell at the current location, create one and add its position and then activate it
      const newCell = createCell();
      const id = Object.keys(newCell)[0];
      // Add new cell to cell container
      setCells({...cells, ...newCell});
      const rowArray = cellPositions[row];
      const changedRow = rowArray.slice(0, column).concat(id).concat(rowArray.slice(column +  1));
      const newPositions = cellPositions.slice(0, row).concat([changedRow]).concat(cellPositions.slice(row + 1));
      setCellPositions(newPositions);
      setActiveCell(id);
    }
  }

  function updateCell(id, value) {
    setCells({...cells, [id]: {value}});
  }

  const columnCount = Math.max(...(cellPositions.map((row) => row.length)));
  const headers = Array(columnCount).fill(undefined).map((_, index) => (<th>{String.fromCharCode(index + 'A'.charCodeAt(0))}</th>))
  const rows = cellPositions.map((row, index) => {
    const emptyCellCount = columnCount - row.length;
    return (<Row row={row} rowIndex={index} emptyCellCount={emptyCellCount} cells={cells}
       activeCell={activeCell} setActiveCell={changeActiveCell} updateCell={updateCell} formulaParser={formulaParser}/>)
  });
  return (
    <div>
        <table>
          <thead>{headers}</thead>
          <tbody>{rows}</tbody>
        </table>
    </div>
  );
}

export default Spreadsheet;
