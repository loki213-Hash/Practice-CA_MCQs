import { useState, useEffect } from "react";
import {
  ADV_COURSES,
  ADV_ZONES,
  ADV_POUS_BY_ZONE,
  getAdvIttBatches
} from "../services/icaiSlotService";

export default function AdvIttSlotFinder({ onClose }) {
  const [course, setCourse] = useState("ADV_ITT");
  const [zone, setZone] = useState("WESTERN");
  const [pou, setPou] = useState("MUMBAI_BKC");
  const [batches, setBatches] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Available POUs for selected zone
  const currentPous = ADV_POUS_BY_ZONE[zone] || [];

  // Reactive Zone Change Handler
  const handleZoneChange = (newZoneId) => {
    setZone(newZoneId);
    const pous = ADV_POUS_BY_ZONE[newZoneId] || [];
    setPou(pous[0]?.id || "");
    setSearched(false);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = getAdvIttBatches(course, zone, pou);
      setBatches(res);
      setSearched(true);
      setLoading(false);
    }, 250);
  };

  // Auto-search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="icai-modal-panel adv-modal-theme">
      {/* MODAL HEADER */}
      <div className="icai-modal-header">
        <div className="icai-header-left">
          <div className="icai-icon-orb adv-bg">🎓</div>
          <div>
            <h3 className="icai-modal-title">ICAI BOS Adv MCS / Adv ITT Batches</h3>
            <p className="icai-modal-sub">
              Select Course, Zone &amp; POU Branch to view batch start dates and available seats
            </p>
          </div>
        </div>
        <div className="icai-header-right">
          <span className="icai-badge adv-badge">
            <span className="live-dot adv-dot"></span> Official ICAI BOS
          </span>
          {onClose && (
            <button type="button" className="icai-close-btn" onClick={onClose} title="Close Modal">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* PORTAL LINK BANNER */}
      <div className="icai-portal-banner adv-banner">
        <span>🔗 Official ICAI BOS Data Portal:</span>
        <a
          href="https://www.icaionlineregistration.org/launchbatchdetail.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="portal-link-accent"
        >
          www.icaionlineregistration.org/launchbatchdetail.aspx ↗
        </a>
      </div>

      {/* REACTIVE FILTER FORM */}
      <form onSubmit={handleSearch} className="icai-filter-grid">
        <div className="icai-filter-group">
          <label htmlFor="adv-modal-course">Select Course</label>
          <select
            id="adv-modal-course"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setSearched(false);
            }}
            className="icai-select"
          >
            {ADV_COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="icai-filter-group">
          <label htmlFor="adv-modal-zone">Select Zone</label>
          <select
            id="adv-modal-zone"
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value)}
            className="icai-select"
          >
            {ADV_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="icai-filter-group">
          <label htmlFor="adv-modal-pou">Select POU / City Branch</label>
          <select
            id="adv-modal-pou"
            value={pou}
            onChange={(e) => {
              setPou(e.target.value);
              setSearched(false);
            }}
            className="icai-select"
          >
            {currentPous.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>

        <div className="icai-filter-group submit-group">
          <button type="submit" className="icai-submit-btn adv-btn-color" disabled={loading}>
            {loading ? "Searching..." : "🔍 Search Batches"}
          </button>
        </div>
      </form>

      {/* RESULTS GRID */}
      {searched && (
        <div className="icai-results-container">
          <div className="icai-results-head">
            <h4>Available Upcoming Batches ({batches.length})</h4>
            <span>Live seat availability for chosen ICAI training center</span>
          </div>

          {batches.length === 0 ? (
            <div className="icai-empty-box">
              No upcoming batches found for the selected criteria. Please select another POU or Zone.
            </div>
          ) : (
            <div className="icai-cards-grid">
              {batches.map((b, idx) => (
                <div key={idx} className="icai-slot-item-card adv-card-accent">
                  <div className="card-top-head">
                    <div>
                      <span className="card-tag adv-tag-style">{b.batchCode}</span>
                      <h5 className="card-title-main">{b.courseName}</h5>
                    </div>
                    <span className={`seat-badge ${b.availableSeats <= 5 ? "warning" : "success"}`}>
                      {b.availableSeats <= 5
                        ? `⚠️ ${b.availableSeats} Seats Left`
                        : `🟢 ${b.availableSeats} Seats Available`}
                    </span>
                  </div>

                  <div className="card-body-details">
                    <div className="detail-line">
                      <span className="d-key">📅 Dates:</span>
                      <span className="d-value bold">{b.startDate} &ndash; {b.endDate}</span>
                    </div>
                    <div className="detail-line">
                      <span className="d-key">⏰ Timings:</span>
                      <span className="d-value">{b.timings}</span>
                    </div>
                    <div className="detail-line">
                      <span className="d-key">📍 Venue:</span>
                      <span className="d-value">{b.pouName}</span>
                    </div>
                    <div className="detail-line">
                      <span className="d-key">🏢 Address:</span>
                      <span className="d-value addr-text">{b.address}</span>
                    </div>
                    <div className="detail-line">
                      <span className="d-key">💳 Batch Fee:</span>
                      <span className="d-value fee-text">{b.fee}</span>
                    </div>
                  </div>

                  <div className="card-foot-action">
                    <a
                      href="https://www.icaionlineregistration.org/launchbatchdetail.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icai-book-btn adv-btn-outline"
                    >
                      Book Batch on ICAI BOS Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
