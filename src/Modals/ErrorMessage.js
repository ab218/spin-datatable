import React, { useEffect } from 'react';
import { Alert } from 'antd';

export default function ErrorMessage({ error, setError }) {
	useEffect(
		() => {
			if (error) {
				setTimeout(() => {
					console.log('clear error');
					setError(null);
				}, 4000);
			}
		},
		[ error, setError ],
	);
	return error ? <Alert className="error" message={error} type="error" showIcon /> : <div />;
}
