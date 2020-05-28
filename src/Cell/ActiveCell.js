import React from 'react';
import { STRING } from '../constants';
import { cursorKeyToRowColMapper } from '../Spreadsheet';
export default class ActiveCell extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			currentValue: '',
		};
		this.input = React.createRef();
	}

	componentWillUnmount() {
		const { columnIndex, rowIndex, updateCell } = this.props;
		const { currentValue } = this.state;
		// Don't update blank cell if nothing was changed
		if (currentValue || this.props.value) {
			updateCell(this.input.current.value, rowIndex, columnIndex);
		}
	}

	onKeyDown = (event, rows, rowIndex, columns, columnIndex) => {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case 'Tab':
				event.preventDefault();
				const { row, column } = cursorKeyToRowColMapper[event.key](
					rowIndex,
					columnIndex,
					rows.length,
					columns.length,
					event.shiftKey,
				);
				this.props.changeActiveCell(row, column, event.ctrlKey || event.shiftKey || event.metaKey);
				break;
			default:
				break;
		}
	};

	render() {
		const { column, columns, columnIndex, rows, rowIndex } = this.props;
		return (
			<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => this.props.handleContextMenu(e)}>
				<input
					autoFocus
					onFocus={(e) => e.target.select()}
					defaultValue={this.props.value}
					type="text"
					style={{
						textAlign: column && column.type === STRING ? 'left' : 'right',
						height: '100%',
						width: '100%',
					}}
					ref={this.input}
					onKeyDown={(e) => this.onKeyDown(e, rows, rowIndex, columns, columnIndex)}
					onChange={(e) => {
						e.preventDefault();
						this.setState({ currentValue: e.target.value });
					}}
				/>
			</div>
		);
	}
}
