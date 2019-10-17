import React from 'react';
import './App.css';
import Spreadsheet from './Spreadsheet';
import {SpreadsheetProvider} from './SpreadsheetProvider';
import EventBus from './eventbus.js';

const eventBus = new EventBus('spreadsheet-events', console.debug);
eventBus.subscribe('select-cell', function handlingCellSelection() {
});


function App() {
  return (
    <div className="App">
      <SpreadsheetProvider>
        <Spreadsheet eventBus={eventBus}/>
      </SpreadsheetProvider>
    </div>
  );
}

export default App;
