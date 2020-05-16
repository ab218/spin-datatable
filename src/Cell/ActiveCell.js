import React, { Component } from 'react';
import { STRING } from '../constants';
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

	render() {
		const { column, createNewRows, rows, rowIndex } = this.props;
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
					onChange={(e) => {
						e.preventDefault();
						if (rowIndex + 1 > rows.length) {
							createNewRows(rowIndex + 1 - rows.length);
						}
						this.setState({ currentValue: e.target.value });
					}}
				/>
			</div>
		);
	}
}
