import React, { useState } from "react";
import { Button, Modal } from "antd";
import {
  useSpreadsheetState,
  useSpreadsheetDispatch,
  useRowsState,
} from "../context/SpreadsheetProvider";
import { createBarChart } from "../analysis-output/Analysis";
import {
  TOGGLE_BAR_CHART_MODAL,
  NOMINAL,
  ORDINAL,
  CONTINUOUS,
} from "../constants";
import { SelectColumn, styles, VariableSelector } from "./ModalShared";
import ErrorMessage from "./ErrorMessage";
import { createRandomID, filterExcludedRows } from "../context/helpers";
import DraggableModal from "./DraggableModal";

export default function AnalysisModal({ setPopup }) {
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [xColData, setXColData] = useState([]);
  const [yColData, setYColData] = useState([]);
  const [groupingColData, setGroupingColData] = useState([]);
  const [error, setError] = useState(null);
  const [performingAnalysis, setPerformingAnalysis] = useState(false);
  const { barChartModalOpen } = useSpreadsheetState();
  const { columns, rows, excludedRows } = useRowsState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function handleModalClose() {
    dispatchSpreadsheetAction({
      type: TOGGLE_BAR_CHART_MODAL,
      barChartModalOpen: false,
    });
  }

  async function performAnalysis() {
    if (!yColData[0] || !xColData[0]) {
      // user should never see this
      setError("Please add all required columns and try again");
      return;
    }
    setPerformingAnalysis(true);
    const colX = xColData[0];
    const colY = yColData[0];
    const colZ = groupingColData ? groupingColData[0] : null;
    const colA = filterExcludedRows(rows, excludedRows, colX);
    const colB = filterExcludedRows(rows, excludedRows, colY);
    const colC = colZ ? filterExcludedRows(rows, excludedRows, colZ) : [];
    // const maxColLength = Math.max(colA.length, colB.length, colC.length);
    function makeXYZCols(colA, colB, colC) {
      return rows
        .map((row, i) => {
          const rowID = row.id;
          const foundRowA = colA.find((r) => r.rowID === rowID);
          const foundRowB = colB.find((r) => r.rowID === rowID);
          const foundRowC = colC.length && colC.find((r) => r.rowID === rowID);
          if (colC.length > 0) {
            if (foundRowA && foundRowB && foundRowC) {
              return {
                x: foundRowA.value,
                y: foundRowB.value,
                group: foundRowC.value,
                row: { rowID, rowNumber: i + 1 },
              };
            }
          } else {
            if (foundRowA && foundRowB) {
              return {
                x: foundRowA.value,
                y: foundRowB.value,
                group: null,
                row: { rowID, rowNumber: i + 1 },
              };
            }
          }
          return null;
        })
        .filter(Boolean);
      // .sort();
    }
    const XYZCols = makeXYZCols(colA, colB, colC);
    if (XYZCols.length > 1) {
      const results = await createBarChart(
        colX,
        colY,
        colZ,
        XYZCols,
        colX.modelingType,
      );
      setPopup((prev) => prev.concat({ ...results, id: createRandomID() }));
      setPerformingAnalysis(false);
      dispatchSpreadsheetAction({
        type: TOGGLE_BAR_CHART_MODAL,
        barChartModalOpen: false,
      });
    } else {
      // user should never see this, as columns with under 1 value are filtered out
      setError(
        "Columns must each contain at least 1 value to perform this analysis",
      );
      return;
    }
  }

  const filteredColumns = columns.filter((column) =>
    rows.some((row) => row[column.id] || typeof row[column.id] === "number"),
  );

  return (
    <div>
      <Modal
        className="ant-modal"
        onCancel={handleModalClose}
        onOk={performAnalysis}
        title={<DraggableModal children="Bar Chart" />}
        visible={barChartModalOpen}
        width={750}
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
                disabled={
                  xColData.length === 0 ||
                  yColData.length === 0 ||
                  performingAnalysis
                }
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
        <div style={styles.flexSpaced}>
          <SelectColumn
            title={"Select Columns"}
            groupingColData={groupingColData[0]}
            columns={filteredColumns}
            setSelectedColumn={setSelectedColumn}
          />
          <div style={{ width: 410 }}>
            Cast Selected Columns into Roles
            <VariableSelector
              notAllowed={[NOMINAL, ORDINAL]}
              cardText={"Required"}
              data={yColData}
              label="Y"
              setData={setYColData}
              selectedColumn={selectedColumn}
              styleProps={{ marginBottom: 20, marginTop: 20 }}
            />
            <VariableSelector
              notAllowed={[]}
              cardText={"Required"}
              data={xColData}
              label="X"
              setData={setXColData}
              selectedColumn={selectedColumn}
              styleProps={{ marginBottom: 20 }}
            />
            <VariableSelector
              notAllowed={[CONTINUOUS]}
              cardText={"Optional"}
              data={groupingColData}
              label="Group"
              setData={setGroupingColData}
              selectedColumn={selectedColumn}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
