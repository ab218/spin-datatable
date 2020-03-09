import React from 'react';
import './App.css';
import Spreadsheet from './Spreadsheet';
import { SpreadsheetProvider } from './SpreadsheetProvider';
import eventBus from './EventBusSubscriptions.js';

function App({tableData = {}}) {
	const {columns = [], rows = [], excludedRows = [], ...rest} = tableData;
	return (
		<div style={{ height: '100%' }} className="App">
			<SpreadsheetProvider eventBus={eventBus} initialTable={{columns, rows, excludedRows, ...rest}}>
				<Spreadsheet />
			</SpreadsheetProvider>
		</div>
	);
}

export default App;
