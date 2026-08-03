export default function CaseTableRenderer({ tableData }) {
  if (!tableData) return null;

  let tables = [];
  try {
    if (typeof tableData === "string") {
      tables = JSON.parse(tableData);
    } else if (Array.isArray(tableData)) {
      tables = tableData;
    } else if (typeof tableData === "object") {
      tables = [tableData];
    }
  } catch {
    // If it's a plain text table string
    return (
      <div className="case-table-text-block">
        <pre className="case-table-pre">{String(tableData)}</pre>
      </div>
    );
  }

  if (!Array.isArray(tables) || tables.length === 0) {
    if (typeof tableData === "string" && tableData.trim()) {
      return (
        <div className="case-table-text-block">
          <pre className="case-table-pre">{tableData}</pre>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="case-tables-container">
      <strong style={{ color: "#A8762C", display: "block", marginBottom: 6, fontSize: 13, fontFamily: "Inter, sans-serif" }}>
        📊 Case Data &amp; Financial Schedules:
      </strong>
      {tables.map((tbl, tIdx) => {
        const headers = tbl.headers || tbl.columns || [];
        const rows = tbl.rows || tbl.data || [];

        if (!Array.isArray(headers) || !Array.isArray(rows)) return null;

        return (
          <div className="case-table-wrapper" key={tIdx}>
            <table className="icai-case-table">
              {headers.length > 0 && (
                <thead>
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Array.isArray(row)
                      ? row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)
                      : <td>{String(row)}</td>}
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
