import React from "react";

export default function CaseTableRenderer({ tableData, title = null }) {
  if (!tableData) return null;

  let raw = tableData;
  if (typeof tableData === "string") {
    try {
      raw = JSON.parse(tableData);
    } catch {
      return (
        <div style={{ margin: "14px 0", overflowX: "auto", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <pre style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {String(tableData)}
          </pre>
        </div>
      );
    }
  }

  let tables = [];
  if (Array.isArray(raw)) {
    tables = raw;
  } else if (typeof raw === "object" && raw !== null) {
    tables = [raw];
  } else {
    return (
      <div style={{ margin: "14px 0", overflowX: "auto", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
        <pre style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontFamily: "monospace" }}>
          {String(raw)}
        </pre>
      </div>
    );
  }

  if (tables.length === 0) return null;

  // Check if tables is an array of row objects: [ { "Year": "2020", "Profit": "50 Cr" }, ... ]
  if (
    tables.length > 0 &&
    typeof tables[0] === "object" &&
    tables[0] !== null &&
    !Array.isArray(tables[0]) &&
    !tables[0].headers &&
    !tables[0].columns &&
    !tables[0].rows &&
    !tables[0].data
  ) {
    const headers = Object.keys(tables[0]);
    const rows = tables.map((rowObj) => headers.map((h) => rowObj[h] ?? ""));
    tables = [{ headers, rows }];
  }

  return (
    <div className="case-tables-container" style={{ margin: "16px 0", width: "100%" }}>
      {title && (
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F3D3E", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          📋 {title}
        </div>
      )}
      {tables.map((tbl, tIdx) => {
        let headers = tbl.headers || tbl.columns || [];
        let rows = tbl.rows || tbl.data || [];
        const tblTitle = tbl.title || tbl.caption || tbl.name || null;

        // If tbl itself is a row object
        if (headers.length === 0 && rows.length === 0 && typeof tbl === "object" && tbl !== null) {
          headers = Object.keys(tbl);
          rows = [headers.map((h) => tbl[h] ?? "")];
        }

        if (headers.length === 0 && rows.length === 0) return null;

        return (
          <div key={tIdx} style={{ overflowX: "auto", margin: "10px 0 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {tblTitle && (
              <div style={{ padding: "8px 14px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", fontSize: "12.5px", fontWeight: "700", color: "#0F3D3E" }}>
                {tblTitle}
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", textAlign: "left" }}>
              {headers.length > 0 && (
                <thead>
                  <tr style={{ background: "#0F3D3E", color: "#ffffff" }}>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} style={{ padding: "10px 14px", fontWeight: "700", borderBottom: "2px solid #0B2545", letterSpacing: "0.3px" }}>
                        {String(h).replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {Array.isArray(row)
                      ? row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "10px 14px", color: "#1e293b", lineHeight: "1.5" }}>
                            {typeof cell === "object" ? JSON.stringify(cell) : String(cell)}
                          </td>
                        ))
                      : (
                          <td style={{ padding: "10px 14px", color: "#1e293b" }}>{String(row)}</td>
                        )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
