import React, { useState } from 'react';
import { Button, Card, Modal, Radio } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_ANALYSIS_MODAL, PERFORM_ANALYSIS } from './constants';

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

export default function AnalysisModal() {
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedRightColumn, setSelectedRightColumn] = useState(null);
  const [xColData, setXColData] = useState([]);
  const [yColData, setYColData] = useState([]);
  const [error, setError] = useState(false);
  const { analysisModalOpen, columns } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function handleModalClose() {
    dispatchSpreadsheetAction({type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
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

  function performAnalysis() {
    if (!yColData[0] || !xColData[0]) {
      setError(true);
      return;
    };
    dispatchSpreadsheetAction({type: PERFORM_ANALYSIS, xColData: xColData[0], yColData: yColData[0] })
    dispatchSpreadsheetAction({type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
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
        <Button disabled={data.length !== 0} style={{marginBottom: 5}} onClick={() => addColumnToList(data, setData)}>Add {axis}
        </Button>
        {data.length !== 0 &&
          <Button onClick={() => removeColumnFromList(setData)}>Remove {axis}
          </Button>
        }
      </div>
    )
  }

  return (
    <div>
      <Modal
        className="ant-modal"
        // destroyOnClose
        onCancel={handleModalClose}
        onOk={performAnalysis}
        title="Fit Y by X"
        visible={analysisModalOpen}
        width={600}
        bodyStyle={{background: '#ECECEC'}}
      >
        <div style={styles.flexSpaced}>
          <div>Select Column
            <SelectColumn
              columns={columns}
              setSelectedColumn={setSelectedColumn}
            />
            {/* <RadioGroup data={columns} setData={setSelectedColumn} /> */}
          </div>
          <div style={{width: 310}}>Cast Selected Columns into Roles
            <div style={{marginBottom: 20, marginTop: 20, ...styles.flexSpaced }}>
              <CaratButtons data={yColData} setData={setYColData} axis='Y' />
              <RadioGroup data={yColData} setData={setSelectedRightColumn} />
            </div>
            <div style={styles.flexSpaced}>
              <CaratButtons data={xColData} setData={setXColData} axis='X' />
              <RadioGroup data={xColData} setData={setSelectedRightColumn} />
            </div>
          </div>
        </div>
        <h5 style={{display: error ? 'flex' : 'none', position: 'absolute', color: 'red'}}>Please add all required columns and try again</h5>
      </Modal>
    </div>
  )
};