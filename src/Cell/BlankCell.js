import React from 'react';

export default React.memo(function BlankCell({ rowIndex, columnIndex }) {
	return (
		// cells in defined rows but undefined columns
		<div
			style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
			key={`row${rowIndex}col${columnIndex}`}
			onDoubleClick={(e) => {
				e.preventDefault();
				// if (columnIndex > columns.length) {
				// 	createNewColumns(columnIndex - columns.length);
				// }
			}}
		/>
	);
});
