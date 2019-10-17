// TODO: Combine this component with Analysis Modal
import React, { useState } from 'react';
import { Button, Card, Modal, Radio } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_DISTRIBUTION_MODAL, PERFORM_DISTRIBUTION_ANALYSIS } from './constants';

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
  // const [xColData, setXColData] = useState([]);
  const [yColData, setYColData] = useState([]);
  const { distributionModalOpen, columns } = useSpreadsheetState();
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

  function performDistributionAnalysis() {
    dispatchSpreadsheetAction({type: PERFORM_DISTRIBUTION_ANALYSIS, yColData: yColData[0] })
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

  return (
    <div>
      <Modal
        className="ant-modal"
        onCancel={handleModalClose}
        onOk={performDistributionAnalysis}
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
          </div>
        </div>
      </Modal>
    </div>
  )
};