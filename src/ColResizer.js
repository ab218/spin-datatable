import React, { useEffect, useState } from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_COLUMN_TYPE_MODAL, OPEN_CONTEXT_MENU, REMOVE_SELECTED_CELLS } from './constants'

export default function ColumnResizer({borderRight, column}) {

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState(0);
  const [originalCellWidth, setOriginalCellWidth] = useState();

  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function openModal() {
    if (!column) return;
    dispatchSpreadsheetAction({type: REMOVE_SELECTED_CELLS })
    dispatchSpreadsheetAction({type: TOGGLE_COLUMN_TYPE_MODAL, columnTypeModalOpen: true, column})
  }

  useEffect(() => {
    const endDrag = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setOriginalCellWidth(originalCellWidth + offset);
      setOffset(0);
    }

    const onMouseMove = (e) => {
      if (!isDragging) return;
      setOffset(e.clientX - startX);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
    };
  }, [isDragging, offset, originalCellWidth, startX]);

  const startDrag = (e) => {
    setStartX(e.clientX);
    const { width: originalWidth } = e.target.getBoundingClientRect();
    setOriginalCellWidth(originalWidth);
    setIsDragging(true);
  }

  const style = {
    borderRight: borderRight && '1px solid black',
    userSelect: 'none',
    cursor: 'e-resize',
    width: (originalCellWidth || 80) + offset,
  };

  const onContextMenu = (e) => {
    e.preventDefault();
    dispatchSpreadsheetAction({type: OPEN_CONTEXT_MENU, colName: e.target.innerHTML, colHeaderContext: true, contextMenuPosition: {left: e.pageX, top: e.pageY}});
  }

  return (
      <th style={style} onMouseDown={startDrag} onDoubleClick={openModal} onContextMenu={e => onContextMenu(e)}>
          {(column && column.label)}
      </th>
  );
}