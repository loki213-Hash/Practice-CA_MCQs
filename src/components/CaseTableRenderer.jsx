export default function CaseTableRenderer({ tableData }) {
  if (!tableData) return null;

  let raw = tableData;
  if (typeof tableData === "string") {
    try {
      raw = JSON.parse(tableData);
    } catch {
      return (
        <div className="case-table-text-block">
          <pre className="case-table-pre">{String(tableData)}</pre>
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
      <div className="case-table-text-block">
        <pre className="case-table-pre">{String(raw)}</pre>
      </div>
    );
  }

  if (tables.length === 0) return null;

  // Check if tables is an array of row objects, e.g. [ { "Item": "A", "Amount": "100" }, ... ]
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
    <div className="case-tables-container">
      <strong
        style={{
          color: "var(--navy, #1E2A33)",
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          fontFamily: "var(--font, sans-serif)",
          fontWeight: 600,
        }}
      >
        📊 Explanation Table:
      </strong>
      {tables.map((tbl, tIdx) => {
        let headers = tbl.headers || tbl.columns || [];
        let rows = tbl.rows || tbl.data || [];

        // If tbl itself is a row object
        if (headers.length === 0 && rows.length === 0 && typeof tbl === "object" && tbl !== null) {
          headers = Object.keys(tbl);
          rows = [headers.map((h) => tbl[h] ?? "")];
        }

        if (headers.length === 0 && rows.length === 0) return null;

        return (
          <div className="case-table-wrapper" key={tIdx} style={{ overflowX: "auto", margin: "6px 0 12px" }}>
            <table className="icai-case-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              {headers.length > 0 && (
                <thead>
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} style={{ padding: "8px 12px", background: "var(--navy-2, #141D24)", color: "#fff", textAlign: "left" }}>
                        {String(h).replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {Array.isArray(row)
                      ? row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "8px 12px", color: "#374151" }}>
                            {typeof cell === "object" ? JSON.stringify(cell) : String(cell)}
                          </td>
                        ))
                      : (
                          <td style={{ padding: "8px 12px", color: "#374151" }}>{String(row)}</td>
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
