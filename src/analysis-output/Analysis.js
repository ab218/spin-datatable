import React from "react";
import axios from "axios";
import RegressionAnalysis from "./RegressionAnalysis";
import DistributionAnalysis from "./DistributionAnalysis";
import OnewayAnalysis from "./OnewayAnalysis";
import GraphBuilder from "./GraphBuilder";
import ContingencyAnalysis from "./ContingencyAnalysis";
import { REGRESSION, ONEWAY, CONTINGENCY, DISTRIBUTION } from "../constants";
import { createRandomID } from "../context/helpers";

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
    const linearRegression =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/regression";
    const distribution =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution";
    const oneway =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/oneway";
    const contingency =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/contingency";
    axios.post(linearRegression, { ping: "ping" }, { crossDomain: true });
    axios.post(oneway, { ping: "ping" }, { crossDomain: true });
    axios.post(distribution, { ping: "ping" }, { crossDomain: true });
    axios.post(contingency, { ping: "ping" }, { crossDomain: true });
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
    const gcloud =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/oneway";
    const result = await axios.post(
      gcloud,
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
    // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
    const result = await axios.post(
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/regression",
      { x: colXArr, y: colYArr },
      {
        crossDomain: true,
      },
    );
    // console.log(result.data) // gcloud
    // console.log(result.data.body); // Lambda

    console.log(result.data);

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
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/contingency",
      { x: colXArr, y: colYArr },
      {
        crossDomain: true,
      },
    );

    console.log(result.data);
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
    // const lambda = 'https://8gf5s84idd.execute-api.us-east-2.amazonaws.com/test/scipytest';
    const gcloud =
      "https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution-1";
    const result = await axios.post(
      gcloud,
      {
        y: selectedColumns,
      },
      {
        crossDomain: true,
      },
    );
    console.log(result.data); // gcloud
    // console.log(result.data.body); // Lambda
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
        "https://us-central1-optimum-essence-210921.cloudfunctions.net/regression",
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
