// TODO: Combine this component with Analysis Modal
import React, { useState } from "react";
import { Modal, Button, Input } from "antd";
import {
  useSpreadsheetState,
  useSpreadsheetDispatch,
  useRowsState,
  useRowsDispatch,
} from "../context/SpreadsheetProvider";
import { TOGGLE_DISTRIBUTION_MODAL, DISTRIBUTION } from "../constants";
import { analyzeData } from "../analysis-output/Analysis";
import { SelectMultipleColumns, styles } from "./ModalShared";
import ErrorMessage from "./ErrorMessage";
import DraggableModal from "./DraggableModal";

export default function DistributionModal({ setPopup }) {
  const { distributionModalOpen } = useSpreadsheetState();
  const { columns, rows, excludedRows } = useRowsState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const dispatchRowsAction = useRowsDispatch();
  const [error, setError] = useState("");
  const [numberOfBins, setNumberOfBins] = useState(10);
  const [yColData, setYColData] = useState([]);
  const [performingAnalysis, setPerformingAnalysis] = useState(false);

  function handleModalClose() {
    dispatchSpreadsheetAction({
      type: TOGGLE_DISTRIBUTION_MODAL,
      distributionModalOpen: false,
    });
  }

  async function performAnalysis() {
    if (yColData.length === 0) {
      return;
    }

    function filterExcludedRows(rows, excludedRows, column) {
      return rows.map((row) => {
        let cellValue;
        if (column.type === "Number" || column.type === "Formula") {
          cellValue = Number(row[column.id]);
        } else {
          cellValue = row[column.id];
        }
        return (
          !excludedRows.includes(row.id) && {
            colID: column.id,
            rowID: row.id,
            value: cellValue,
          }
        );
      });
    }

    const selectedColumns = yColData.map((col) => {
      const colValsWithRowData = filterExcludedRows(rows, excludedRows, col);
      const colVals = colValsWithRowData.map((x) => x.value).filter(Boolean);
      const missingValues = colValsWithRowData.length - colVals.length;
      const colValsFiltered = colValsWithRowData.filter((x) => x.value);
      return {
        yColData: col,
        colVals,
        colValsWithRowData,
        missingValues,
        colValsFiltered,
      };
    });

    selectedColumns.forEach((col) => {
      if (col.colVals.length < 3) {
        setError("Column must have at least 3 valid values");
        return;
      }
    });
    // TODO: Better error handling here
    setPerformingAnalysis(true);
    await analyzeData(
      {
        analysisType: DISTRIBUTION,
        selectedColumns,
        numberOfBins,
      },
      setPopup,
    );
    dispatchRowsAction({
      type: "SAVE_ANALYSIS",
      analysisType: DISTRIBUTION,
      selectedColumns,
      numberOfBins,
    });
    setPerformingAnalysis(false);
    dispatchSpreadsheetAction({
      type: TOGGLE_DISTRIBUTION_MODAL,
      distributionModalOpen: false,
    });
  }

  function onChangeBinInput(e) {
    e.preventDefault();
    if (isNaN(e.target.value)) {
      return setNumberOfBins(0);
    }
    return setNumberOfBins(e.target.value);
  }

  const filteredColumns = columns.filter((column) =>
    rows.some((row) => row[column.id] || typeof row[column.id] === "number"),
  );

  return (
    <div>
      <Modal
        className="ant-modal"
        onCancel={handleModalClose}
        title={<DraggableModal children="Descriptive Analysis" />}
        visible={distributionModalOpen}
        width={550}
        bodyStyle={{ background: "#ECECEC" }}
        footer={[
          <div
            key="footer-div"
            style={{
              height: 40,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <ErrorMessage error={error} setError={setError} />
            <span style={{ alignSelf: "end" }}>
              <Button
                disabled={performingAnalysis}
                key="back"
                onClick={handleModalClose}
              >
                Cancel
              </Button>
              <Button
                disabled={yColData.length === 0 || performingAnalysis}
                key="submit"
                type="primary"
                onClick={performAnalysis}
              >
                {performingAnalysis ? "Loading..." : "Submit"}
              </Button>
            </span>
          </div>,
        ]}
      >
        <div style={{ ...styles.flexSpaced }}>
          <SelectMultipleColumns
            title={"Select Columns"}
            columns={filteredColumns}
            selectedColumn={yColData}
            setSelectedColumn={setYColData}
          />
          <div style={{ display: "flex" }}>
            <div style={{ width: 100 }}>Number of Bins</div>
            <Input
              onChange={(e) => onChangeBinInput(e)}
              value={numberOfBins}
              style={{ marginLeft: 10, width: "40%", height: "30px" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
