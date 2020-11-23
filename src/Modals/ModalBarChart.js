import React, { useState } from "react";
import { Button, Modal } from "antd";
import {
  BoxPlotTwoTone,
  BarChartOutlined,
  LineChartOutlined,
  PieChartTwoTone,
} from "@ant-design/icons";
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
  const [chartSelected, setChartSelected] = useState("bar");

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
    setPerformingAnalysis(true);
    const colX = xColData[0];
    const colY = yColData[0];
    const colZ = groupingColData ? groupingColData[0] : null;
    const colA = colX && filterExcludedRows(rows, excludedRows, colX);
    const colB = colY && filterExcludedRows(rows, excludedRows, colY);
    const colC = colZ ? filterExcludedRows(rows, excludedRows, colZ) : [];
    // const maxColLength = Math.max(colA.length, colB.length, colC.length);
    function makeXYZCols(colA, colB, colC) {
      return rows
        .map((row, i) => {
          const rowID = row.id;
          const foundRowA = colA && colA.find((r) => r.rowID === rowID);
          const foundRowB = colB && colB.find((r) => r.rowID === rowID);
          const foundRowC = colC.length && colC.find((r) => r.rowID === rowID);
          if (foundRowA && foundRowB && foundRowC) {
            return {
              x: foundRowA.value,
              y: foundRowB.value,
              group: foundRowC.value,
              row: { rowID, rowNumber: i + 1 },
            };
          } else if (foundRowA && foundRowB) {
            return {
              x: foundRowA.value,
              y: foundRowB.value,
              group: null,
              row: { rowID, rowNumber: i + 1 },
            };
          } else if (foundRowA && foundRowC) {
            return {
              x: foundRowA.value,
              group: foundRowC.value,
              row: { rowID, rowNumber: i + 1 },
            };
          } else if (foundRowA) {
            return {
              x: foundRowA.value,
              group: null,
              row: { rowID, rowNumber: i + 1 },
            };
          } else if (foundRowB) {
            return {
              y: foundRowB.value,
              group: null,
              row: { rowID, rowNumber: i + 1 },
            };
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
        chartSelected,
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
      setPerformingAnalysis(false);
      return;
    }
  }

  const filteredColumns = columns.filter((column) =>
    rows.some((row) => row[column.id] || typeof row[column.id] === "number"),
  );

  function BoxPlotButton() {
    return (
      <div
        onClick={(e) => setChartSelected("box")}
        className={"toolbar-button"}
      >
        <BoxPlotTwoTone
          style={{
            opacity: chartSelected === "box" ? 1 : 0.3,
          }}
          className={"graph-builder-icon"}
        />
      </div>
    );
  }

  function BarChartButton() {
    return (
      <div
        onClick={(e) => setChartSelected("bar")}
        className={"toolbar-button"}
      >
        <BarChartOutlined
          style={{
            opacity: chartSelected === "bar" ? 1 : 0.3,
          }}
          className={"graph-builder-icon"}
        />
      </div>
    );
  }

  function PieChartButton() {
    return (
      <div
        onClick={(e) => setChartSelected("pie")}
        className={"toolbar-button"}
      >
        <PieChartTwoTone
          style={{
            opacity: chartSelected === "pie" ? 1 : 0.3,
          }}
          className={"graph-builder-icon"}
        />
      </div>
    );
  }

  function LineChartButton() {
    return (
      <div
        onClick={(e) => setChartSelected("line")}
        className={"toolbar-button"}
      >
        <LineChartOutlined
          style={{
            opacity: chartSelected === "line" ? 1 : 0.3,
          }}
          className={"graph-builder-icon"}
        />
      </div>
    );
  }

  function SelectChartType() {
    return (
      <div style={{ display: "flex", paddingBottom: "20px" }}>
        <BarChartButton />
        <PieChartButton />
        <BoxPlotButton />
        <LineChartButton />
      </div>
    );
  }

  function isDisabled() {
    if (chartSelected === "bar" || chartSelected === "line") {
      return xColData.length === 0 || yColData.length === 0;
    } else if (chartSelected === "pie") {
      return xColData.length === 0;
    } else if (chartSelected === "box") {
      return yColData.length === 0;
    }
    return true;
  }
  return (
    <div>
      <Modal
        className="ant-modal"
        onCancel={handleModalClose}
        onOk={performAnalysis}
        title={<DraggableModal children="Graph Builder" />}
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
                disabled={isDisabled() || performingAnalysis}
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
          <div>
            <SelectChartType />
            <SelectColumn
              title={"Select Columns"}
              groupingColData={groupingColData[0]}
              columns={filteredColumns}
              setSelectedColumn={setSelectedColumn}
            />
          </div>
          <div style={{ width: 410 }}>
            <div style={{ marginBottom: 20 }}>
              Cast Selected Columns into Roles
            </div>
            {(chartSelected === "bar" || chartSelected === "line") && (
              <React.Fragment>
                <VariableSelector
                  notAllowed={[NOMINAL, ORDINAL]}
                  cardText={"Required"}
                  data={yColData}
                  label="Y"
                  setData={setYColData}
                  selectedColumn={selectedColumn}
                  styleProps={{ marginBottom: 20 }}
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
              </React.Fragment>
            )}
            {chartSelected === "pie" && (
              <React.Fragment>
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
              </React.Fragment>
            )}
            {chartSelected === "box" && (
              <React.Fragment>
                <VariableSelector
                  notAllowed={[NOMINAL, ORDINAL]}
                  cardText={"Required"}
                  data={yColData}
                  label="Y"
                  setData={setYColData}
                  selectedColumn={selectedColumn}
                  styleProps={{ marginBottom: 20 }}
                />
                <VariableSelector
                  notAllowed={[CONTINUOUS]}
                  cardText={"Optional"}
                  data={xColData}
                  label="X"
                  setData={setXColData}
                  selectedColumn={selectedColumn}
                  styleProps={{ marginBottom: 20 }}
                />
              </React.Fragment>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
