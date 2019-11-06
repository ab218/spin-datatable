import React, { useEffect, useState } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, OPEN_CONTEXT_MENU, REMOVE_SELECTED_CELLS } from './constants';

export default function ColumnResizer({borderRight, column, columnIndex, columns, createNewColumns}) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState(0);
  const [originalCellWidth, setOriginalCellWidth] = useState();

  function openModal() {
    if (!column) {
      if (columnIndex > columns.length) {
        createNewColumns(columnIndex - columns.length);
        return;
      }
    };
    dispatchSpreadsheetAction({type: REMOVE_SELECTED_CELLS })
    dispatchSpreadsheetAction({type: TOGGLE_COLUMN_TYPE_MODAL, columnTypeModalOpen: true, column})
  }

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      console.log('on mouse move');
      setOffset(e.clientX - startX);
    }
    console.log('isDragging:', isDragging);
    console.log('startX:', startX);
    console.log('adding mouse move listener');
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      console.log('removing mouse move listener')
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [isDragging, startX]);

  const endDrag = () => {
    if (!isDragging) return;
    console.log('call endDrag')
    setOriginalCellWidth(originalCellWidth + offset);
    setOffset(0);
    setIsDragging(false);
  }

  const startDrag = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    const { width: originalWidth } = e.currentTarget.parentNode.getBoundingClientRect();
    setOriginalCellWidth(originalWidth)
  }

  const style = {
    borderRight: borderRight && '1px solid black',
    userSelect: 'none',
    width: (originalCellWidth || 80) + offset,
    textOverflow: 'ellipsis',
  };

  const onContextMenu = (e) => {
    e.preventDefault();
    dispatchSpreadsheetAction({type: OPEN_CONTEXT_MENU, colName: column && column.label, colHeaderContext: true, contextMenuPosition: {left: e.pageX, top: e.pageY}});
  }

  return (
    <th style={style} onMouseUp={endDrag} onDoubleClick={openModal} onContextMenu={onContextMenu}>
      <span>{(column && column.label)}</span><span className='header-handle' onMouseDown={startDrag}>&nbsp;</span>
    </th>
  );
}