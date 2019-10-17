import React, { useState } from 'react';
import { Input, Modal } from 'antd';
import Dropdown from './Dropdown';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, UPDATE_COLUMN } from './constants';

export default function AntModal({selectedColumn}) {

  const [columnName, setColumnName] = useState(selectedColumn.label);
  const [columnType, setColumnType] = useState(selectedColumn.type);
  const [columnModelingType, setColumnModelingType] = useState(selectedColumn.modelingType);
  const [columnFormula, setColumnFormula] = useState(selectedColumn.formula);
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const { columns, columnTypeModalOpen } = useSpreadsheetState();

  function handleClose() {
    dispatchSpreadsheetAction({
      type: UPDATE_COLUMN,
      updatedColumn: {
        label: columnName,
        modelingType: columnModelingType,
        type: columnType,
        formula: columnFormula,
        id: selectedColumn.id
       }
    })
    dispatchSpreadsheetAction({type: TOGGLE_COLUMN_TYPE_MODAL, modalOpen: false, selectedColumn: null})
  }

  function translateIDToLabel(formula) {
    if (!formula) return;
    return columns.filter((someColumn) => formula.includes(someColumn.id)).reduce((changedFormula, someColumn) => {
      return changedFormula.replace(new RegExp(`\\b${someColumn.id}\\b`, 'g'), `${someColumn.label}`);
    }, formula);
  }

  return  (
    <div>
      <Modal
        className="ant-modal"
        destroyOnClose
        onCancel={handleClose}
        onOk={handleClose}
        title={columnName}
        visible={columnTypeModalOpen}
      >
        <span className="modal-span">
          <h4>Column Name</h4>
          <Input style={{width: 200}} value={columnName} onChange={e => setColumnName(e.target.value)} />
        </span>
        <span className="modal-span">
          <h4>Type</h4>
          <Dropdown menuItems={['Number', 'String', 'Formula']} setColumnType={setColumnType} columnType={columnType} />
        </span>
        <span className="modal-span">
          <h4>Modeling Type</h4>
          <Dropdown menuItems={['Continuous', 'Ordinal', 'Nominal']} setColumnType={setColumnModelingType} columnType={columnModelingType} />
        </span>
        {columnType === 'Formula' &&
        <span className="modal-span">
          <h4>Formula</h4>
          <Input style={{width: 200}} value={translateIDToLabel(columnFormula)} onChange={e => setColumnFormula(e.target.value)}/>
        </span>
        }
      </Modal>
    </div>
  )
};