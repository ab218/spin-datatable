## Summary

This is a fully virtualized data table built with React and React Virtualized. It draws inspiration from Google Sheets and JMP 15. Users are able to input and manipulate data and perform several different kinds of statistical analyses.

When an analysis is performed, the data table will call a (Python) Google Cloud Function to calculate some statistical output. An analysis consists of a (d3) chart and statistical output which is displayed in a new window.

## Setup

1. Install dependencies with `npm install` or `yarn`.

2. `npm run start` or `yarn start` from command line.

In order to run analyses, the following environment variables (links to cloud functions) are needed:

```
REACT_APP_DISTRIBUTION_URL=
REACT_APP_REGRESSION_URL=
REACT_APP_ONEWAY_URL=
REACT_APP_CONTINGENCY_URL=
```

The code for these functions can be found at: https://github.com/nStudy-project/spin-cloud. Deploy this code with a Python (3.7) Cloud Function and copy the Trigger URL into these environment variables. Make sure the Executed function is `process_data` and the functions are given enough memory (`Regression` and `Oneway` functions can be quite computationally expensive).

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
