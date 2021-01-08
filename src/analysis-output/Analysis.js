import React from "react";
import axios from "axios";
import RegressionAnalysis from "./RegressionAnalysis";
import DistributionAnalysis from "./DistributionAnalysis";
import OnewayAnalysis from "./OnewayAnalysis";
import GraphBuilder from "./GraphBuilder";
import ContingencyAnalysis from "./ContingencyAnalysis";
import { REGRESSION, ONEWAY, CONTINGENCY, DISTRIBUTION } from "../constants";
import { createRandomID } from "../context/helpers";
const DISTRIBUTION_URL = process.env.REACT_APP_DISTRIBUTION_URL;
const REGRESSION_URL = process.env.REACT_APP_REGRESSION_URL;
const ONEWAY_URL = process.env.REACT_APP_ONEWAY_URL;
const CONTINGENCY_URL = process.env.REACT_APP_CONTINGENCY_URL;

export async function analyzeData(analysisProps, setPopup) {
  switch (analysisProps.analysisType) {
    case REGRESSION: {
      const results = await performLinearRegressionAnalysis(analysisProps);
      return setPopup((prev) =>
        prev.concat({ ...results, id: createRandomID() }),
      );
    }
    case ONEWAY: {
      const results = await performOnewayAnalysis(analysisProps);
      return setPopup((prev) =>
        prev.concat({ ...results, id: createRandomID() }),
      );
    }
    case CONTINGENCY: {
      const results = await performContingencyAnalysis(analysisProps);
      return setPopup((prev) =>
        prev.concat({ ...results, id: createRandomID() }),
      );
    }
    case DISTRIBUTION: {
      const results = await performDistributionAnalysis(analysisProps);
      return setPopup((prev) =>
        prev.concat({ ...results, id: createRandomID() }),
      );
    }
    default:
      return null;
  }
}

export default function AnalysisContainer({ popup, setPopup }) {
  if (!popup.length === 0) {
    return null;
  }
  return popup.map((data, i) => {
    const { analysisType } = data;
    if (analysisType === REGRESSION) {
      return <RegressionAnalysis key={i} data={data} setPopup={setPopup} />;
    } else if (analysisType === DISTRIBUTION) {
      return <DistributionAnalysis key={i} data={data} setPopup={setPopup} />;
    } else if (analysisType === ONEWAY) {
      return <OnewayAnalysis key={i} data={data} setPopup={setPopup} />;
    } else if (
      analysisType === "bar" ||
      analysisType === "line" ||
      analysisType === "box" ||
      analysisType === "pie" ||
      analysisType === "fit"
    ) {
      return <GraphBuilder key={i} data={data} setPopup={setPopup} />;
    } else if (analysisType === CONTINGENCY) {
      return <ContingencyAnalysis key={i} data={data} setPopup={setPopup} />;
    }
    return null;
  });
}

export async function pingCloudFunctions() {
  try {
    axios.post(REGRESSION_URL, { ping: "ping" }, { crossDomain: true });
    axios.post(ONEWAY_URL, { ping: "ping" }, { crossDomain: true });
    axios.post(DISTRIBUTION_URL, { ping: "ping" }, { crossDomain: true });
    axios.post(CONTINGENCY_URL, { ping: "ping" }, { crossDomain: true });
  } catch (e) {
    console.log(e);
  }
}

// bug: if the group only has one data point in it, the cloud function fails.
export async function performOnewayAnalysis({
  analysisType,
  colXArr,
  colYArr,
  colX,
  colY,
  XYCols,
}) {
  try {
    const result = await axios.post(
      ONEWAY_URL,
      {
        x: colXArr,
        y: colYArr,
      },
      {
        crossDomain: true,
      },
    );
    const {
      ordered_differences_report,
      bartlett,
      levene,
      x_groups_lists,
      means_std,
      anova,
      summary_table,
    } = result.data;

    return {
      analysisType,
      ordered_differences_report: JSON.parse(ordered_differences_report),
      x_groups_lists: JSON.parse(x_groups_lists),
      anova: JSON.parse(anova),
      coordinates: XYCols,
      bartlett,
      levene,
      colX,
      colY,
      colXArr,
      colYArr,
      means_std: JSON.parse(means_std),
      summary_table,
    };
  } catch (e) {
    console.log("something went wrong: ", e);
  }
}

export async function performLinearRegressionAnalysis({
  analysisType,
  colXArr,
  colYArr,
  colX,
  colY,
  XYCols,
}) {
  try {
    const result = await axios.post(
      REGRESSION_URL,
      { x: colXArr, y: colYArr },
      {
        crossDomain: true,
      },
    );

    const mean = (numbers) =>
      numbers.reduce((acc, val) => acc + Number(val), 0) / numbers.length;
    return {
      analysisType,
      ...result.data,
      colX,
      colY,
      colXMean: mean([...colXArr]),
      colYMean: mean([...colYArr]),
      coordinates: XYCols,
    };
  } catch (e) {
    console.log("something went wrong: ", e);
  }
}

export async function performContingencyAnalysis({
  analysisType,
  colXArr,
  colYArr,
  colX,
  colY,
  XYCols,
}) {
  try {
    const result = await axios.post(
      CONTINGENCY_URL,
      { x: colXArr, y: colYArr },
      {
        crossDomain: true,
      },
    );
    return {
      analysisType,
      ...result.data,
      colX,
      colY,
      coordinates: XYCols,
    };
  } catch (e) {
    console.log("something went wrong: ", e);
  }
}

export async function performDistributionAnalysis({
  analysisType,
  selectedColumns,
  numberOfBins,
}) {
  try {
    const result = await axios.post(
      DISTRIBUTION_URL,
      {
        y: selectedColumns,
      },
      {
        crossDomain: true,
      },
    );
    return {
      analysisType,
      numberOfBins,
      colData: [...result.data],
    };
  } catch (e) {
    console.log("something went wrong: ", e);
  }
}

export async function createGraph(colX, colY, colZ, XYZCols, analysisType) {
  try {
    let cloudData;
    if (analysisType === "fit") {
      cloudData = await axios.post(
        REGRESSION_URL,
        { x: XYZCols.map((row) => row.x), y: XYZCols.map((row) => row.y) },
        {
          crossDomain: true,
        },
      );
    }
    return {
      analysisType,
      colX,
      colY,
      colZ,
      coordinates: XYZCols,
      cloudData: cloudData && cloudData.data,
    };
  } catch (e) {
    console.log("something went wrong: ", e);
  }
}
