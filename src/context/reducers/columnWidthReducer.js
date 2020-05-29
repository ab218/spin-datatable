import { ADD_COLUMN_WIDTH, RESIZE_COLUMN } from '../../constants';

export function columnWidthReducer(state, action) {
	const { type, dataKey, deltaX } = action;
	switch (type) {
		case ADD_COLUMN_WIDTH: {
			return { ...state, widths: { ...state.widths, [dataKey]: 100 } };
		}
		case RESIZE_COLUMN: {
			const { widths } = state;
			const colWidth = widths[dataKey] || 0;
			return { ...state, widths: { ...state.widths, [dataKey]: Math.max(colWidth + deltaX, 50) } };
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
