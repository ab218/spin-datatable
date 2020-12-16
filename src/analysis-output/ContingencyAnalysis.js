import React, { useState } from "react";
import Popup from "./PopupWindow";
import { FunnelPlotOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import ContingencyD3Chart from "./ContingencyD3Chart";

export default function ContingencyAnalysis({ data, setPopup }) {
  const {
    contingency,
    colX,
    colY,
    chi2,
    p,
    dof,
    log_chi2,
    log_p,
    coordinates,
    expected,
  } = data;
  const [contingencyOptions, setContingencyOptions] = useState({
    includeCount: true,
    includeTotal: true,
    includeCol: true,
    includeRow: true,
    includeExpected: true,
  });
  const parsedContingency = JSON.parse(contingency);
  const contingencyKeys = Object.keys(parsedContingency);
  const groupKeys = Object.keys(parsedContingency[contingencyKeys[0]]);
  const columnTotals = groupKeys.map((key) =>
    contingencyKeys
      .map((row, i) => parsedContingency[row][key])
      .reduce((acc, curr) => acc + curr),
  );
  const totals = groupKeys.map((key, i) => {
    return { [key]: columnTotals[i] };
  });
  const mosaicData = contingencyKeys.flatMap((key) =>
    groupKeys.map((group) => {
      return { x: key, y: group, value: parsedContingency[key][group] };
    }),
  );
  const title = `Contingency Analysis of ${colY.label} ${
    colY.units ? "(" + colY.units + ")" : ""
  } By ${colX.label}
  ${colX.units ? "(" + colX.units + ")" : ""}`;
  return (
    <Popup
      key={data.id}
      id={data.id}
      title={title}
      windowWidth={1000}
      setPopup={setPopup}
    >
      <div id="popupcontainer" style={{ textAlign: "center" }}>
        <TitleText title={title} />
        <ContingencyD3Chart
          groups={contingencyKeys}
          data={mosaicData}
          totals={totals}
          colX={colX}
          colY={colY}
          n={coordinates.length}
        />
        <Tests
          contingencyOptions={contingencyOptions}
          setContingencyOptions={setContingencyOptions}
          contingency={parsedContingency}
          n={coordinates.length}
          expected={expected}
          colX={colX}
          colY={colY}
          chi2={chi2}
          p={p}
          dof={dof}
          log_chi2={log_chi2}
          log_p={log_p}
        />
      </div>
    </Popup>
  );
}

// TODO: DRY
const evaluatePValue = (pValue) =>
  pValue < 0.0001 ? "<0.0001" : pValue.toFixed(4) / 1;

const TitleText = ({ title }) => <h1>{title}</h1>;

const ContingencyTableOptions = ({
  setContingencyOptions,
  contingencyOptions,
}) => {
  const {
    includeCount,
    includeRow,
    includeCol,
    includeTotal,
    includeExpected,
  } = contingencyOptions;
  const [visible, setVisible] = useState(false);
  const menu = (
    <Menu multiple>
      <Menu.ItemGroup>
        <Menu.Item
          onClick={() =>
            setContingencyOptions((prev) => {
              return { ...prev, includeCount: !prev.includeCount };
            })
          }
        >
          <div style={{ display: "flex" }}>
            <span className="select-checkmark">{includeCount ? "✓" : " "}</span>
            <span>Count</span>
          </div>
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            setContingencyOptions((prev) => {
              return { ...prev, includeTotal: !prev.includeTotal };
            })
          }
        >
          <div style={{ display: "flex" }}>
            <span className="select-checkmark">{includeTotal ? "✓" : " "}</span>
            <span>Total %</span>
          </div>
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            setContingencyOptions((prev) => {
              return { ...prev, includeCol: !prev.includeCol };
            })
          }
        >
          <div style={{ display: "flex" }}>
            <span className="select-checkmark">{includeCol ? "✓" : " "}</span>
            <span>Col %</span>
          </div>
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            setContingencyOptions((prev) => {
              return { ...prev, includeRow: !prev.includeRow };
            })
          }
        >
          <div style={{ display: "flex" }}>
            <span className="select-checkmark">{includeRow ? "✓" : " "}</span>
            <span>Row %</span>
          </div>
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            setContingencyOptions((prev) => {
              return { ...prev, includeExpected: !prev.includeExpected };
            })
          }
        >
          <div style={{ display: "flex" }}>
            <span className="select-checkmark">
              {includeExpected ? "✓" : " "}
            </span>
            <span>Expected</span>
          </div>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );
  return (
    <Dropdown
      onVisibleChange={(flag) => setVisible(flag)}
      visible={visible}
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      placement="topCenter"
      overlay={menu}
    >
      <FunnelPlotOutlined className="hamburger" />
    </Dropdown>
  );
};

const ContingencyTable = ({
  setContingencyOptions,
  contingencyOptions,
  contingency,
  expected,
  n,
}) => {
  const {
    includeCount,
    includeRow,
    includeCol,
    includeTotal,
    includeExpected,
  } = contingencyOptions;
  // TODO: If text is too long, use elipsis
  const contingencyKeys = Object.keys(contingency);
  const keysOfFirstRow = Object.keys(contingency[contingencyKeys[0]]);
  const columnTotals = keysOfFirstRow.map((key) => {
    return contingencyKeys
      .map((row, i) => {
        return contingency[row][key];
      })
      .reduce((acc, curr) => {
        return acc + curr;
      });
  });
  const rowTotals = contingencyKeys.map((key, i) => {
    const rowOfValues = Object.values(contingency[key]);
    return rowOfValues.reduce((acc, curr) => curr + acc, 0);
  });

  const mappedContingency = contingencyKeys.map((key, i) => {
    const rowOfValues = Object.values(contingency[key]);
    return rowOfValues.map((val, j) => {
      const cellContents = {
        count: val,
        total: ((val / n) * 100).toFixed(2),
        col: ((val / columnTotals[j]) * 100).toFixed(2),
        row: ((val / rowTotals[i]) * 100).toFixed(2),
        expected: expected[j][i].toFixed(4) / 1,
      };
      return cellContents;
    });
  });

  return (
    <table style={{ fontSize: "14px", margin: "0 auto 30px" }}>
      <thead>
        <tr style={{ textAlign: "left" }}>
          <td
            style={{
              width: "70px",
              maxWidth: "70px",
              paddingLeft: "5px",
            }}
            className="bordered"
          >
            <ContingencyTableOptions
              contingencyOptions={contingencyOptions}
              setContingencyOptions={setContingencyOptions}
            />
            <div style={{ pointer: "cursor", whiteSpace: "pre" }}>
              {includeCount && `Count\n`}
              {includeTotal && `Total %\n`}
              {includeCol && `Col %\n`}
              {includeRow && `Row %\n`}
              {includeExpected && `Expected\n`}
            </div>
          </td>
          {keysOfFirstRow.map((category, i) => (
            <td
              key={category + i}
              style={{
                width: "70px",
                maxWidth: "70px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingLeft: "5px",
                backgroundColor: "rgb(238, 238, 238)",
              }}
              className="bordered"
            >
              {category}
            </td>
          ))}
          <td
            style={{
              paddingLeft: "5px",
              backgroundColor: "rgb(238, 238, 238)",
            }}
            className="bordered"
          >
            Total
          </td>
        </tr>
      </thead>
      <tbody>
        {mappedContingency.map((row, i) => {
          return (
            <tr key={i}>
              <td
                style={{
                  width: "70px",
                  maxWidth: "70px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: "rgb(238, 238, 238)",
                  textAlign: "left",
                  paddingLeft: "5px",
                }}
                className="bordered"
              >
                {contingencyKeys[i]}
              </td>
              {row.map((cell, j) => {
                return (
                  <td
                    className="bordered"
                    style={{
                      width: "70px",
                      maxWidth: "70px",
                      whiteSpace: "pre",
                      paddingLeft: "5px",
                      textAlign: "right",
                      paddingRight: "5px",
                    }}
                    key={cell + j}
                  >
                    {includeCount && `${cell.count}\n`}
                    {includeTotal && `${cell.total}\n`}
                    {includeCol && `${cell.col}\n`}
                    {includeRow && `${cell.row}\n`}
                    {includeExpected && `${cell.expected}\n`}
                  </td>
                );
              })}
              <td
                style={{
                  whiteSpace: "pre",
                  textAlign: "right",
                  paddingRight: "5px",
                }}
                className="bordered"
              >
                {includeCount &&
                  `${row
                    .reduce((acc, curr) => Number(acc) + Number(curr.count), 0)
                    .toFixed(2)}\n`}
                {includeTotal &&
                  `${row
                    .reduce((acc, curr) => Number(acc) + Number(curr.total), 0)
                    .toFixed(2)}\n`}
                {includeCol && `\n`}
                {includeRow && `\n`}
                {includeExpected && `\n`}
              </td>
            </tr>
          );
        })}
        <tr key={"totals"}>
          <td
            className="bordered left"
            style={{
              textAlign: "left",
              width: "70px",
              paddingLeft: "5px",
              backgroundColor: "rgb(238, 238, 238)",
            }}
          >
            Total
          </td>
          {columnTotals.map((total, i) => (
            <td
              style={{
                whiteSpace: "pre",
                textAlign: "right",
                paddingRight: "5px",
              }}
              key={i}
              className="bordered"
            >
              {includeCount && `${total}\n`}
              {includeTotal && `${((total / n) * 100).toFixed(2)}\n`}
            </td>
          ))}
          <td
            style={{ textAlign: "right", paddingRight: "5px" }}
            className="bordered"
          >
            {n}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const Tests = ({
  expected,
  contingencyOptions,
  setContingencyOptions,
  contingency,
  chi2,
  p,
  log_chi2,
  log_p,
  n,
  dof,
}) => {
  return (
    <details open style={{ padding: "10px 30px 30px", textAlign: "center" }}>
      <summary className="analysis-summary-title">Contingency Table</summary>
      <ContingencyTable
        setContingencyOptions={setContingencyOptions}
        n={n}
        expected={expected}
        contingencyOptions={contingencyOptions}
        contingency={contingency}
      />
      <table style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td colSpan={2} className="table-subtitle">
              Summary
            </td>
          </tr>
          <tr>
            <td className="table-header small">Count</td>
            <td className="right small">{n}</td>
          </tr>
          <tr>
            <td className="table-header small">DF</td>
            <td className="right small">{dof}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ height: "30px" }} />
      <table style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td className="table-header medium">Test</td>
            <td className="table-header small right">ChiSquare</td>
            <td className="table-header small right">p-value</td>
          </tr>
          <tr>
            <td className="header-background medium">Likelihood Ratio</td>
            <td className="right small">{log_chi2.toFixed(4) / 1}</td>
            <td className="right small">{evaluatePValue(log_p)}</td>
          </tr>
          <tr>
            <td className="header-background medium">Pearson</td>
            <td className="right small">{chi2.toFixed(4) / 1}</td>
            <td className="right small">{evaluatePValue(p)}</td>
          </tr>
        </tbody>
      </table>
    </details>
  );
};
