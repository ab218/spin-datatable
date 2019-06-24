import React, { useEffect, useRef, useState } from 'react';

export default function ColumnResizer({content, minWidth = 0}) {

  const [state, setState] = useState({
    isDragging: false,
    startX: 0,
    // startWidthPrevSibling: 0,
    // startWidthNextSibling: 0,
    // endWidthPrevSibling: 0,
    // endWidthNextSibling: 0,
  });

  const [width, setWidth] = useState();

  const ref = useRef(null);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);

    // if (ref.current.previousSibling && ref.current.nextSibling) {
    //   ref.current.previousSibling.style.minWidth = state.endWidthPrevSibling + 'px';
    //   ref.current.nextSibling.style.minWidth = state.endWidthNextSibling + 'px';
    //   console.log(ref.current.nextSibling.style.minWidth)
    // }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
    };
  });

  const startDrag = (e) => {
    // e.persist() is called here so that startX does not become null
    e.persist();
    setState(prevState => ({
      ...prevState,
      isDragging: true,
      startX: e.clientX,
      // startWidthPrevSibling: 0,
      // startWidthNextSibling: 0,
    }));

    // if (ref) {
    //   console.log('ele exists', ref)
    //   let { prevSibling, nextSibling } = ref.current

    //   if (prevSibling) {
    //     setState(prevState => ({
    //       ...prevState,
    //       startWidthPrevSibling: prevSibling.clientWidth,
    //     }));
    //   }

    //   if (nextSibling) {
    //     setState(prevState => ({
    //       ...prevState,
    //       startWidthNextSibling: nextSibling.clientWidth,
    //     }));
    //   }
    // }
  }

  const endDrag = () => {
    if (!state.isDragging) {
      return;
    }
    console.log('endDrag')
    setState(prevState => ({
      ...prevState,
      isDragging: false,
    }));
  }

  const onMouseMove = (e) => {
    if (!state.isDragging) {
      return;
    }

    let moveDiff;
    if (state.startX > e.clientX) {
      moveDiff = state.startX - e.clientX
    } else {
      moveDiff = e.clientX - state.startX
    }

    setWidth(moveDiff)
    // let endWidthPrevSibling = state.startWidthPrevSibling - moveDiff;
    // let endWidthNextSibling = state.startWidthNextSibling + moveDiff;


    // console.log(endWidthPrevSibling, endWidthNextSibling)

    // if (endWidthPrevSibling < minWidth) {
    //     const offset = endWidthPrevSibling - minWidth;
    //     // endWidthPrevSibling = minWidth;
    //     setState(prevState => ({...prevState, endWidthNextSibling: endWidthNextSibling + offset }))
    // } else if (endWidthNextSibling < minWidth) {
    //     const offset = endWidthNextSibling - minWidth;
    //     // endWidthNextSibling = minWidth;
    //     setState(prevState => ({...prevState, endWidthPrevSibling: endWidthPrevSibling + offset }))
    // }
  }

  const style = {
    userSelect: 'none',
    cursor: 'col-resize',
    minWidth: width
  };

  return (
      <td ref={ref} style={style} onMouseDown={startDrag}>
          {content}
      </td>
  );
}