import React from "react";
import {
  FilterTwoTone,
  BoxPlotTwoTone,
  BarChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import {
  useSpreadsheetDispatch,
  useSelectDispatch,
} from "./context/SpreadsheetProvider";
import {
  REMOVE_SELECTED_CELLS,
  TOGGLE_ANALYSIS_MODAL,
  TOGGLE_BAR_CHART_MODAL,
  TOGGLE_DISTRIBUTION_MODAL,
  TOGGLE_FILTER_MODAL,
} from "./constants";
export default function Toolbar() {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const dispatchSelectAction = useSelectDispatch();
  return (
    <div
      style={{
        borderBottom: "1px solid #b3b3b3",
        backgroundColor: "#eee",
        display: "flex",
        alignItems: "center",
        position: "fixed",
        height: "60px",
        width: "100%",
        top: 0,
        zIndex: 9,
        textAlign: "left",
      }}
    >
      <div
        onClick={() => {
          dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
          dispatchSpreadsheetAction({
            type: TOGGLE_FILTER_MODAL,
            filterModalOpen: true,
          });
        }}
        className={"toolbar-icon"}
        style={{ textAlign: "center" }}
      >
        <FilterTwoTone
          style={{ fontSize: "2em", margin: "0 40px" }}
          twoToneColor={"yellowgreen"}
        />
        <div>Filter</div>
      </div>
      <div
        onClick={() => {
          dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
          dispatchSpreadsheetAction({
            type: TOGGLE_DISTRIBUTION_MODAL,
            distributionModalOpen: true,
          });
        }}
        className={"toolbar-icon"}
        style={{ textAlign: "center" }}
      >
        <BoxPlotTwoTone
          style={{ fontSize: "2em", margin: "0 40px" }}
          rotate={90}
          twoToneColor={"green"}
        />
        <div>Descriptive</div>
      </div>
      <div
        onClick={() => {
          dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
          dispatchSpreadsheetAction({
            type: TOGGLE_BAR_CHART_MODAL,
            barChartModalOpen: true,
            selectedColumns: [],
          });
        }}
        style={{ textAlign: "center" }}
        className={"toolbar-icon"}
      >
        <BarChartOutlined
          style={{ color: "red", fontSize: "2em", margin: "0 40px" }}
        />
        <div>Graph Builder</div>
      </div>
      <div
        onClick={() => {
          dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
          dispatchSpreadsheetAction({
            type: TOGGLE_ANALYSIS_MODAL,
            analysisModalOpen: true,
          });
        }}
        style={{ textAlign: "center" }}
        className={"toolbar-icon"}
      >
        <LineChartOutlined
          style={{ color: "blue", fontSize: "2em", margin: "0 40px" }}
        />
        <div>Fit Y By X</div>
      </div>
    </div>
  );
}
