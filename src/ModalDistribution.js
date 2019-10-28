// TODO: Combine this component with Analysis Modal
import React, { useState } from 'react';
import { Button, Card, Modal, Radio, Input } from 'antd';
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
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedRightColumn, setSelectedRightColumn] = useState(null);
  const [yColData, setYColData] = useState([]);
  const [error, setError] = useState(false);
  const [numberOfBins, setNumberOfBins] = useState(10);
  const { distributionModalOpen, columns, rows } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function handleModalClose() {
    dispatchSpreadsheetAction({type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: false });
  }

  function addColumnToList(col, setCol) {
    if (!selectedColumn || col.length > 0) return;
    setSelectedRightColumn(selectedColumn);
    setCol(prevState => prevState.concat(selectedColumn));
  }

  function removeColumnFromList(setCol) {
    if (!selectedRightColumn) return;
    setSelectedRightColumn(null);
    setCol(prevState => prevState.filter(col => col !== selectedRightColumn));
  }

  async function performAnalysis() {
    if (!yColData[0]) {
      setError(true);
      return;
    }
    const results = await performDistributionAnalysis(yColData[0], rows, numberOfBins);
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
        const selectedColumn = yColData[0];
        const columnIndex = columns.findIndex((col) => col.id === selectedColumn.id);
        if (!event.data.metaKeyPressed) {
          dispatchSpreadsheetAction({type: REMOVE_SELECTED_CELLS});
        }

        const rowIndices = rows.reduce((acc, row, rowIndex) => {
          return event.data.vals.includes(row[selectedColumn.id]) ? acc.concat(rowIndex) : acc;
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

  function RadioGroup({data, setData, styleProps}) {
    return (
      <Card bordered style={{...styles.cardWithBorder, ...styleProps}}>
        <Radio.Group style={styles.radioGroup} buttonStyle='solid'>
          {data.length === 0 ? <em>Required</em> : <></>}
          {data.map(column => <Radio.Button style={styles.radioButton} key={column.id} onClick={() => setData(column)} value={column}>{column.label}</Radio.Button>)}
        </Radio.Group>
      </Card>
    )
  }

  function CaratButtons({data, setData, axis}) {
    return (
      <div style={styles.flexColumn}>
        <Button disabled={data.length !== 0} style={{marginBottom: 5}}onClick={() => addColumnToList(data, setData)}>Add {axis}
        </Button>
        {data.length !== 0 &&
          <Button onClick={() => removeColumnFromList(setData)}>Remove {axis}
          </Button>
        }
      </div>
    )
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
        width={600}
        bodyStyle={{background: '#ECECEC'}}
      >
        <div style={styles.flexSpaced}>
          <div>Select Column
            <SelectColumn
              columns={columns}
              setSelectedColumn={setSelectedColumn}
            />
          </div>
          <div style={{width: 310}}>Cast Selected Columns into Roles
            <div style={{marginBottom: 20, marginTop: 20, ...styles.flexSpaced }}>
              <CaratButtons data={yColData} setData={setYColData} axis='Y' />
              <RadioGroup data={yColData} setData={setSelectedRightColumn} />
            </div>
            <div style={{marginBottom: 20, marginTop: 20, display: 'flex'}}>
              <div style={{width: 100}}>Number of Bins</div>
              <Input onChange={(e) => onChangeBinInput(e)} value={numberOfBins} style={{ marginLeft: 10, width: '20%' }} />
            </div>
          </div>
        </div>
        <h5 style={{display: error ? 'flex' : 'none', position: 'absolute', color: 'red'}}>Please add required column and try again</h5>
      </Modal>
    </div>
  )
};