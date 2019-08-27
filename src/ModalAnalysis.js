import React, { useState } from 'react';
import { Button, Card, Icon, Modal, Radio } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_ANALYSIS_MODAL, OPEN_ANALYSIS_WINDOW } from './constants';

export default function AnalysisModal() {
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedRightColumn, setSelectedRightColumn] = useState(null);
  const [xCol, setXCol] = useState([]);
  const [yCol, setYCol] = useState([]);
  const { analysisModalOpen, columns } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function handleClose() {
    dispatchSpreadsheetAction({type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: false });
  }

  function addColumnToList(col, setCol) {
    if (!selectedColumn || col.length > 0) return;
    setCol(prevState => prevState.concat(selectedColumn));
  }

  function removeColumnFromList(setCol) {
    if (!selectedRightColumn) return;
    setCol(prevState => prevState.filter(col => col !== selectedRightColumn));
    setSelectedRightColumn(null);
  }

  function openAnalysisWindow() {
    dispatchSpreadsheetAction({type: OPEN_ANALYSIS_WINDOW, xColData: xCol[0], yColData: yCol[0], analysisWindowOpen: true})
  }

  return (
    <div>
      <Modal
        className="ant-modal"
        // destroyOnClose
        onCancel={handleClose}
        onOk={openAnalysisWindow}
        title="Fit Y by X"
        visible={analysisModalOpen}
        width={600}
        bodyStyle={{background: '#ECECEC'}}
      >
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>Select Column <em>({columns.length} columns)</em>
            <Card bordered style={{ width: 200, marginTop: 20, border: '1px solid lightgray' }}>
              <Radio.Group style={{display: 'flex', flexDirection: 'column', textAlign: 'center' }} buttonStyle='solid'>
                {columns.map(column => <Radio.Button key={column.id} onClick={() => setSelectedColumn(column)} value={column}>{column.label}</Radio.Button>)}
              </Radio.Group>
            </Card>
          </div>
          <div style={{width: 300}}>Cast Selected Columns into Roles
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, marginTop: 20 }}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <Button onClick={() => addColumnToList(yCol, setYCol)}>Y
                  <Icon type="right" />
                </Button>
                {yCol.length !== 0 &&
                <Button onClick={() => removeColumnFromList(setYCol)}>Y
                  <Icon type="left" />
                </Button>
                }
              </div>
              <Card bordered style={{border: '1px solid lightgray', width: 200, minHeight: 100}}>
                <Radio.Group style={{display: 'flex', flexDirection: 'column', textAlign: 'center' }} buttonStyle='solid'>
                  {yCol.map((y, i) => <Radio.Button key={i} onClick={() => setSelectedRightColumn(y)} value={y}>{y.label}</Radio.Button>)}
                </Radio.Group>
              </Card>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between' }}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <Button onClick={() => addColumnToList(xCol, setXCol)}>X
                  <Icon type="right" />
                </Button>
                {xCol.length !== 0 &&
                <Button onClick={() => removeColumnFromList(setXCol)}>X
                  <Icon type="left" />
                </Button>
                }
              </div>
              <Card bordered style={{border: '1px solid lightgray', width: 200, minHeight: 100}}>
                <Radio.Group style={{display: 'flex', flexDirection: 'column', textAlign: 'center' }} buttonStyle='solid'>
                  {xCol.map((x, i) => <Radio.Button key={i} onClick={() => setSelectedRightColumn(x)} value={x}>{x.label}</Radio.Button>)}
                </Radio.Group>
              </Card>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
};