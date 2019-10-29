// TODO: Combine this component with Analysis Modal
import React, { useState } from 'react';
import { Card, Modal, Radio, Input } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_DISTRIBUTION_MODAL, SELECT_CELLS, REMOVE_SELECTED_CELLS } from './constants';
import { performDistributionAnalysis } from './Analyses';

const styles = {
  cardWithBorder: {
    border: '1px solid lightgray',
    width: 200,
    minHeight: 100
},
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: 100

  },
  flexSpaced: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  radioButton: {
    fontSize: 14,
    padding: 0,
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
    border: '1px solid lightgray'
  },
  radioGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    borderRadius: 0,
    padding: 0,
    margin: 0,
  },
}

export function SelectColumn({columns, setSelectedColumn}) {
  return <Card bordered style={{ marginTop: 20, ...styles.cardWithBorder}}>
    <Radio.Group style={styles.radioGroup} buttonStyle='solid'>
      {/* only map columns with labels */}
      {columns.filter(a=>a.label).map(column => <Radio.Button style={styles.radioButton} key={column.id} onClick={() => setSelectedColumn(column)} value={column}>{column.label}</Radio.Button>)}
    </Radio.Group>
  </Card>
  }

export default function DistributionModal() {
  const { distributionModalOpen, columns, rows } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const [error, setError] = useState(false);
  const [numberOfBins, setNumberOfBins] = useState(10);
  const [yColData, setYColData] = useState([]);

  function handleModalClose() {
    dispatchSpreadsheetAction({type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: false });
  }

  async function performAnalysis() {
    if (!yColData) {
      setError(true);
      return;
    }
    // TODO: Better error handling here
    const colVals = rows.map(row => row[yColData.id]).filter(x=>x);
    if (colVals.length === 0) {
      setError(true);
      return;
    };
    const results = await performDistributionAnalysis(yColData, rows, numberOfBins);
    function receiveMessage(event) {
      if (event.data === 'ready') {
        popup.postMessage(results, '*');
        window.removeEventListener("message", receiveMessage);
      }
    }

    function removeTargetClickEvent(event) {
      if (event.data === 'closed') {
        console.log('target closed')
        window.removeEventListener("message", targetClickEvent);
      }
    }

    function targetClickEvent(event) {
      if (event.data.message === "clicked") {
        const selectedColumn = yColData;
        const columnIndex = columns.findIndex((col) => col.id === selectedColumn.id);
        if (!event.data.metaKeyPressed) {
          dispatchSpreadsheetAction({type: REMOVE_SELECTED_CELLS});
        }

        const rowIndices = rows.reduce((acc, row, rowIndex) => {
          // TODO Shouldn't be using Number here?
          return event.data.vals.includes(Number(row[selectedColumn.id])) ? acc.concat(rowIndex) : acc;
        }, []);
        console.log(rows,rowIndices)
        dispatchSpreadsheetAction({type: SELECT_CELLS, rows: rowIndices, column: columnIndex});
      }
    }

    const popup = window.open(window.location.href + "distribution.html", "", "left=9999,top=100,width=450,height=850");
    // set event listener and wait for target to be ready
    window.addEventListener("message", receiveMessage, false);
    window.addEventListener("message", targetClickEvent);
    window.addEventListener("message", removeTargetClickEvent);
    dispatchSpreadsheetAction({type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: false });
  }

  function onChangeBinInput(e) {
    e.preventDefault();
    if (isNaN(e.target.value)) {
      return setNumberOfBins(0);
    }
    return setNumberOfBins(e.target.value);
  }

  return (
    <div>
      <Modal
        className="ant-modal"
        onCancel={handleModalClose}
        onOk={performAnalysis}
        title="Distribution"
        visible={distributionModalOpen}
        width={450}
        bodyStyle={{background: '#ECECEC'}}
      >
        <div style={{...styles.flexSpaced}}>
          <div>Select Column
            <SelectColumn
              columns={columns}
              setSelectedColumn={setYColData}
            />
          </div>
          <div style={{display: 'flex'}}>
              <div style={{width: 100}}>Number of Bins</div>
              <Input onChange={(e) => onChangeBinInput(e)} value={numberOfBins} style={{ marginLeft: 10, width: '40%' }} />
          </div>
        </div>
        <h5 style={{display: error ? 'flex' : 'none', position: 'absolute', color: 'red'}}>Please add a valid column</h5>
      </Modal>
    </div>
  )
};