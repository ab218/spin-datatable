// TODO: Combine this component with Analysis Modal
import React, { useState } from "react";
import { Modal, Button, Input } from "antd";
import {
  useSpreadsheetState,
  useSpreadsheetDispatch,
  useRowsState,
} from "../context/SpreadsheetProvider";
import { TOGGLE_DISTRIBUTION_MODAL } from "../constants";
import { performDistributionAnalysis } from "../analysis-output/Analysis";
import { SelectColumn, styles } from "./ModalShared";
import ErrorMessage from "./ErrorMessage";
import { createRandomID } from "../context/helpers";
import DraggableModal from "./DraggableModal";

export default function DistributionModal({ setPopup }) {
  const { distributionModalOpen } = useSpreadsheetState();
  const { columns, rows, excludedRows, includedRows } = useRowsState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
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

    function filterExcludedRows(rows, includedRows, excludedRows, column) {
      return rows.map((row) => {
        let cellValue;
        if (column.type === "Number" || column.type === "Formula") {
          cellValue = Number(row[column.id]);
        } else {
          cellValue = row[column.id];
        }
        return includedRows.length
          ? includedRows.includes(row.id) && {
              colID: column.id,
              rowID: row.id,
              value: cellValue,
            }
          : !excludedRows.includes(row.id) && {
              colID: column.id,
              rowID: row.id,
              value: cellValue,
            };
      });
    }

    const colValsWithRowData = filterExcludedRows(
      rows,
      includedRows,
      excludedRows,
      yColData,
    );

    const colVals = colValsWithRowData.map((x) => x.value).filter(Boolean);
    const emptyValues = colValsWithRowData.length - colVals.length;

    // TODO: Better error handling here
    if (colVals.length < 3) {
      setError("Column must have at least 3 valid values");
      return;
    }
    setPerformingAnalysis(true);
    const results = await performDistributionAnalysis(
      yColData,
      colVals,
      numberOfBins,
      emptyValues,
      colValsWithRowData.filter((x) => x.value),
    );
    setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
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
          <SelectColumn
            title={"Select Columns"}
            columns={filteredColumns}
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
