import React, { useEffect } from 'react';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import {
  CLOSE_CONTEXT_MENU,
  PERFORM_ANALYSIS,
  SET_GROUPED_COLUMNS,
  SORT_COLUMN,
  TOGGLE_ANALYSIS_MODAL,
  TOGGLE_COLUMN_TYPE_MODAL,
  TOGGLE_FILTER_MODAL,
  TOGGLE_LAYOUT,
  TOGGLE_DISTRIBUTION_MODAL,
} from './constants';
import { Menu } from 'antd';
import './App.css';

const { SubMenu } = Menu;

export default function ContextMenu() {
  const { colHeaderContext, colName, contextMenuOpen, contextMenuPosition, layout } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  const onClick = (e) => {
    if (contextMenuOpen) {
      dispatchSpreadsheetAction({type: CLOSE_CONTEXT_MENU });
    }
  }

  const setGroupedColumns = () => {
    dispatchSpreadsheetAction({type: SET_GROUPED_COLUMNS, setColName: colName });
    // layout: false is grouped (spreadsheet) view
    dispatchSpreadsheetAction({type: TOGGLE_LAYOUT, layout: false });
  }

  useEffect(() => {
    const menu = document.querySelector(".menu");
    menu.style.display = contextMenuOpen ? 'block' : 'none';
    if (contextMenuPosition) {
      const { left, top } = contextMenuPosition;
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    }
  })
  return (
    colHeaderContext
      ? <div onClick={onClick} className="menu">
          <Menu selectable={false} style={{ width: 256 }} mode="vertical">
            <Menu.Item key="1" onClick={() => dispatchSpreadsheetAction({type: TOGGLE_COLUMN_TYPE_MODAL, columnTypeModalOpen: true, colName})}>Column Info...</Menu.Item>
            <Menu.Item key="2" onClick={setGroupedColumns}>Split by <span style={{fontWeight: 'bold'}}>{colName}</span></Menu.Item>
            <Menu.Item key="3" onClick={() => dispatchSpreadsheetAction({type: TOGGLE_LAYOUT, layout: !layout })}>Change Layout</Menu.Item>
            <SubMenu key="sub1" title="Sort">
              <Menu.Item key="4" onClick={() => dispatchSpreadsheetAction({type: SORT_COLUMN, colName, descending: true })}>Descending</Menu.Item>
              <Menu.Item key="5" onClick={() => dispatchSpreadsheetAction({type: SORT_COLUMN, colName, descending: false })}>Ascending</Menu.Item>
            </SubMenu>
          </Menu>
        </div>
      : <div onClick={onClick} className="menu">
          <Menu selectable={false} style={{ width: 256 }} mode="vertical">
              <SubMenu key="sub3" title="Fill">
                <Menu.Item key="12">Option 1</Menu.Item>
                <Menu.Item key="13">Option 2</Menu.Item>
              </SubMenu>
              <SubMenu key="sub4" title="Color">
                <Menu.Item key="14">Option 1</Menu.Item>
                <Menu.Item key="15">Option 2</Menu.Item>
              </SubMenu>
              <Menu.Item key="16">Select Matching Cells</Menu.Item>
              <Menu.Item key="17">Cut</Menu.Item>
              <Menu.Item key="18">Copy</Menu.Item>
              <Menu.Item key="19" onClick={() => dispatchSpreadsheetAction({type: PERFORM_ANALYSIS })}>Paste</Menu.Item>
              <Menu.Item key="20" onClick={() => dispatchSpreadsheetAction({type: TOGGLE_FILTER_MODAL, filterModalOpen: true })}>Add Filter</Menu.Item>
              <Menu.Item key="21" onClick={() => dispatchSpreadsheetAction({type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: true })}>Distribution</Menu.Item>
              <Menu.Item key="22" onClick={() => dispatchSpreadsheetAction({type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: true })}>Fit Y By X</Menu.Item>
          </Menu>
        </div>
  )
}