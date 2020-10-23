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
    <div className={"toolbar"}>
      <div
        onClick={() => {
          dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
          dispatchSpreadsheetAction({
            type: TOGGLE_FILTER_MODAL,
            filterModalOpen: true,
          });
        }}
        className={"toolbar-button"}
      >
        <FilterTwoTone
          className={"toolbar-icon"}
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
        className={"toolbar-button"}
      >
        <BoxPlotTwoTone
          className={"toolbar-icon"}
          twoToneColor={"green"}
          rotate={90}
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
        className={"toolbar-button"}
      >
        <BarChartOutlined className={"toolbar-icon"} style={{ color: "red" }} />
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
        className={"toolbar-button"}
      >
        <LineChartOutlined
          className={"toolbar-icon"}
          style={{ color: "blue" }}
        />
        <div>Fit Y By X</div>
      </div>
    </div>
  );
}
