// import React, {useEffect, useState} from 'react';
// import axios from 'axios';
// import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';

// export default function PerformDistributionAnalysis({colY, setPerformDistributionAnalysis}) {
//   const { columns, rows } = useSpreadsheetState();
//   const [data, setData] = useState([]);
//   // const dispatchSpreadsheetAction = useSpreadsheetDispatch();
//   function receiveMessage(event) {
//     const popup = window.open(window.location.href + "distribution.html", "", "left=9999,top=100,width=450,height=850");
//     if (event.data === 'ready') {
//       popup.postMessage(outputData, '*');
//       window.removeEventListener("message", receiveMessage);
//     }
//   }

//   function removeTargetClickEvent(event) {
//     if (event.data === 'closed') {
//       console.log('closed')
//       window.removeEventListener("message", targetClickEvent);
//     }
//   }

//   function targetClickEvent(event) {
//     if (event.data.message === "clicked") {
//       console.log(event.data);
//     }
//   }

//   const colYLabel = colY.label;
//   function mapColumnValues(colID) { return rows.map(row => Number(row[colID])).filter(x=>x) }
//   const colB = mapColumnValues(colY.id);
//   async function fetchData() {
//     // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
//     const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
//     const result = await axios.post(gcloud, {
//       y: colB
//     }, {
//       crossDomain: true,
//     })
//     console.log(result.data) // gcloud
//     // console.log(result.data.body); // Lambda
//     setData(result.data);
//   }
//   useEffect(() => {
//     console.log('mounted');
//     setPerformDistributionAnalysis(false);
//     fetchData();
//     // set event listener and wait for target to be ready
//     window.addEventListener("message", receiveMessage, false);
//     window.addEventListener("message", targetClickEvent);
//     window.addEventListener("message", removeTargetClickEvent);

//     return (() => {
//       window.removeEventListener("message", receiveMessage, false);
//       window.removeEventListener("message", targetClickEvent);
//       window.removeEventListener("message", removeTargetClickEvent);
//     })
//   })
//   const { mean_y, std_y, count, quantiles, histogram } = data
//   const outputData = {
//       count,
//       colYLabel,
//       colBMean: mean_y,
//       colBStdev: std_y,
//       colB,
//       boxPlotData: quantiles,
//       histogram
//   }
//   return null;
// }