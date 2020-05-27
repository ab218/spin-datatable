import React from 'react';
export default React.memo(function NoColumnNoRowCell() {
	return <div className="non-interactive-cell" style={{ backgroundColor: '#eee', height: '100%', width: '100%' }} />;
});
