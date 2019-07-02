import React, { useEffect, useState } from 'react';

export default function ColumnResizer({content}) {

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState(0);
  const [originalCellWidth, setOriginalCellWidth] = useState();

  useEffect(() => {
    const endDrag = () => {
      if (!isDragging) {
        return;
      }
      setIsDragging(false);
      setOriginalCellWidth(originalCellWidth + offset);
      setOffset(0);
    }

    const onMouseMove = (e) => {
      if (!isDragging) {
        return;
      }
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
    const  {width: originalWidth} = e.target.getBoundingClientRect();
    setOriginalCellWidth(originalWidth);
    setIsDragging(true);
  }

  const style = {
    userSelect: 'none',
    cursor: 'e-resize',
    width: (originalCellWidth || 80) + offset,
  };

  return (
      <td style={style} onMouseDown={startDrag}>
          {content}
      </td>
  );
}