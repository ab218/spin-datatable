import React, {useState} from 'react';
import { Button, Modal, Icon, Tooltip } from 'antd';
import IntegerStep from './IntegerStep';
import { SelectColumn } from './ModalFitXY';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { SET_SELECTED_COLUMN, TOGGLE_FILTER_MODAL, REMOVE_SELECTED_CELLS } from './constants';

export default function AntModal() {

  const [clickedColumn, setClickedColumn] = useState(null);

  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const { filterModalOpen, columns, rows, selectedColumns } = useSpreadsheetState();

  function handleClose() {
    dispatchSpreadsheetAction({type: TOGGLE_FILTER_MODAL, filterModalOpen: false, selectedColumns: []})
  }

  function handleCancel() {
    dispatchSpreadsheetAction({type: REMOVE_SELECTED_CELLS })
    dispatchSpreadsheetAction({type: TOGGLE_FILTER_MODAL, filterModalOpen: false, selectedColumns: []})
  }

  function addColumn() {
    if (!selectedColumns.some(({id}) => id === clickedColumn.id)) {
      const colVals = rows.map(row => Number(row[clickedColumn.id])).filter(x=>x);
      const colMax = Math.max(...colVals);
      const colMin = Math.min(...colVals);
      const columnObject = {
        ...clickedColumn,
        colMin,
        colMax
      }
      dispatchSpreadsheetAction({type: SET_SELECTED_COLUMN, selectedColumns: selectedColumns.concat(columnObject)});
    }
  }

  function removeColumn(column) {
    const filteredColumns = selectedColumns.filter(sel => sel.id !== column.id);
    dispatchSpreadsheetAction({type: SET_SELECTED_COLUMN, selectedColumns: filteredColumns});
  }


  function AddColumnButton() {
    return <Button disabled={!clickedColumn} style={{width: 100, marginTop:10}} onClick={addColumn}>Add</Button>
  }

  function RemoveColumnButton({column}) {
    return (
      <Tooltip onClick={() => removeColumn(column)} className='pointer' title="Remove Column">
        <Icon type='close' style={{color: 'red', marginTop: 20}} />
      </Tooltip>
    )
  }

  function FilterColumnSlider({col}) {
    return (
      <div style={{display: 'flex'}}>
        <IntegerStep key={col.id} column={col} colMin={col.colMin} colMax={col.colMax} selectedColumns={selectedColumns}/>
        <RemoveColumnButton column={col}/>
      </div>
    )
  }

  return (
    <div>
      <Modal
        className='ant-modal'
        destroyOnClose
        onCancel={handleCancel}
        onOk={handleClose}
        title={`Data Filter`}
        visible={filterModalOpen}
        style={{display: 'flex', justifyContent: 'center'}}
      >
        <div style={{width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <SelectColumn
          columns={columns}
          setSelectedColumn={setClickedColumn}
          style={{width: '300px'}}
        />
        <AddColumnButton />
        {selectedColumns && selectedColumns.length > 0 && selectedColumns.map(col => <FilterColumnSlider col={col} />)}
        </div>
      </Modal>
    </div>
  )
};