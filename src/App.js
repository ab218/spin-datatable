import React from 'react';
import './App.css';
import Spreadsheet from './Spreadsheet';
import {SpreadsheetProvider} from './SpreadsheetProvider';

function App({eventBus}) {
  return (
    <div className="App">
      <SpreadsheetProvider>
        <Spreadsheet eventBus={eventBus}/>
      </SpreadsheetProvider>
    </div>
  );
}

export default App;
