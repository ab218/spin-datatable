import React, { useEffect, useRef, useState } from 'react';

export default function ColumnResizer({content}) {

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [width, setWidth] = useState();

  const ref = useRef(null);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
    };
  });

  const startDrag = (e) => {
    setIsDragging(true);
    setStartX(e.clientX)
  }

  const endDrag = () => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
  }

  const onMouseMove = (e) => {
    if (!isDragging) {
      return;
    }
    setWidth(e.clientX - startX)
  }

  const style = {
    userSelect: 'none',
    cursor: 'col-resize',
    width: 80 + width,
  };

  return (
      <td ref={ref} style={style} onMouseDown={startDrag}>
          {content}
      </td>
  );
}