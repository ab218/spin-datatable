/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'antd/dist/antd.css';
import 'react-virtualized/styles.css';

import {VIEW_NAME} from './constants';

function getTableID() {
  const queryString = window.location.search;
  const queryRegex = new RegExp('\\?tableId=([^&]*)');
  const documentIdMatches = queryRegex.exec(queryString);
  return documentIdMatches && decodeURIComponent(documentIdMatches[1]);
}

const artifactID = getTableID();

function openTable({configuration, dependencyKeys, dependencies, viewDisabled}) {
  // TODO: Use configuration in some way
  const openTableRequestOptions = {type: 'aggregate-event', eventName: 'open-table', event: {id: artifactID}};
  console.debug('sending open table request with options:', openTableRequestOptions);
  chrome.runtime.sendMessage(openTableRequestOptions, function renderTable(tableProperties) {
    if (chrome.runtime.lastError) {
      console.error('Something went wrong opening table:', chrome.runtime.lastError);
      alert(`Something went wrong opening table: ${chrome.runtime.lastError.message}`);
    } else {
      console.debug('open-table response:', tableProperties);
      ReactDOM.render(<App tableData={tableProperties}/>, document.getElementById('root'));
      // If you want your app to work offline and load faster, you can change
      // unregister() to register() below. Note this comes with some pitfalls.
      // Learn more about service workers: https://bit.ly/CRA-PWA
      serviceWorker.unregister();
    }
  });
}

if (artifactID) {
  chrome.runtime.sendMessage({type: 'view-configuration-request', viewName: VIEW_NAME}, openTable);
} else {
  alert('Cannot find table ID');
}