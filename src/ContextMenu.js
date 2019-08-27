import React, { useEffect } from 'react';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { TOGGLE_CONTEXT_MENU, TOGGLE_ANALYSIS_MODAL, OPEN_ANALYSIS_WINDOW } from './constants'
import './App.css';

export default function ContextMenu({setAnalysisWindow}) {

  const { contextMenuOpen } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  useEffect(() => {
    const menu = document.querySelector(".menu");
    menu.style.display = contextMenuOpen ? 'block' : 'none';

    const toggleMenu = command => {
      dispatchSpreadsheetAction({type: TOGGLE_CONTEXT_MENU, contextMenuOpen: command })
    };

    const setPosition = ({ top, left }) => {
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      toggleMenu("show");
    };

    const contextMenu = (e) => {
      e.preventDefault();
      const origin = {
        left: e.pageX,
        top: e.pageY
      };
      setPosition(origin);
    }

    const onClick = (e) => {
      if (contextMenuOpen) {
        toggleMenu("hide");
      }
    }

    document.body.addEventListener("contextmenu", contextMenu)
    document.body.addEventListener("click", onClick)

    return () => {
      document.body.removeEventListener("contextmenu", contextMenu);
      document.body.removeEventListener("click", onClick);
    };
  })
  return (
    <div className="menu">
      <ul className="menu-options">
        <li className="menu-option">Cut</li>
        <li className="menu-option">Copy</li>
        <li onClick={() => dispatchSpreadsheetAction({type: OPEN_ANALYSIS_WINDOW, analysisWindowOpen: true })} className="menu-option">Paste</li>
        <li onClick={() => dispatchSpreadsheetAction({type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: true })} className="menu-option">Analysis</li>
      </ul>
    </div>
  )
}