import { useState, useEffect } from "react";
import {
  ADV_COURSES,
  ADV_ZONES,
  ADV_POUS_BY_ZONE,
  getAdvIttBatches
} from "../services/icaiSlotService";

export default function AdvIttSlotFinder({ initialExpanded = false, onClose }) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [course, setCourse] = useState("ADV_ITT");
  const [zone, setZone] = useState("WESTERN");
  const [pou, setPou] = useState("");
  const [batches, setBatches] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Available POUs for selected zone
  const currentPous = ADV_POUS_BY_ZONE[zone] || [];

  useEffect(() => {
    if (currentPous.length > 0) {
      setPou(currentPous[0].id);
    }
  }, [zone]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = getAdvIttBatches(course, zone, pou);
      setBatches(res);
      setSearched(true);
      setLoading(false);
    }, 300);
  };

  // Auto-search on initial expand
  useEffect(() => {
    if (isExpanded && !searched) {
      handleSearch();
    }
  }, [isExpanded]);

  return (
    <div className={`icai-slot-card-container ${isExpanded ? "expanded" : "compact"}`}>
      {/* CARD HEADER / COMPACT BAR */}
      <div 
        className="slot-card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="slot-header-left">
          <div className="slot-icon-orb adv-icon-bg">🎓</div>
          <div>
            <div className="slot-title">ICAI BOS Adv MCS / Adv ITT Slots</div>
            <div className="slot-subtitle">
              {isExpanded ? "Select Course, Zone & POU to view batch start dates and available seats" : "Click to check live batch start dates, venue address & seat status"}
            </div>
          </div>
        </div>
        <div className="slot-header-right">
          <span className="slot-badge-live">
            <span className="live-dot"></span> Official ICAI BOS
          </span>
          <button type="button" className="slot-toggle-btn">
            {isExpanded ? "Collapse ▲" : "Find Slots →"}
          </button>
        </div>
      </div>

      {/* EXPANDED INTERACTIVE PANEL */}
      {isExpanded && (
        <div className="slot-card-body">
          <div className="slot-portal-notice">
            <span>🔗 Official Data Portal:</span>
            <a 
              href="https://www.icaionlineregistration.org/launchbatchdetail.aspx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="portal-link-accent"
            >
              www.icaionlineregistration.org/launchbatchdetail.aspx ↗
            </a>
          </div>

          {/* INPUT FORM GRID */}
          <form onSubmit={handleSearch} className="slot-filter-form">
            <div className="filter-group">
              <label htmlFor="adv-course-select">Select Course</label>
              <select 
                id="adv-course-select"
                value={course} 
                onChange={(e) => setCourse(e.target.value)}
                className="slot-select"
              >
                {ADV_COURSES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="adv-zone-select">Select Zone</label>
              <select 
                id="adv-zone-select"
                value={zone} 
                onChange={(e) => setZone(e.target.value)}
                className="slot-select"
              >
                {ADV_ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="adv-pou-select">Select POU / City Branch</label>
              <select 
                id="adv-pou-select"
                value={pou} 
                onChange={(e) => setPou(e.target.value)}
                className="slot-select"
              >
                {currentPous.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                ))}
              </select>
            </div>

            <div className="filter-group submit-group">
              <button type="submit" className="slot-search-btn" disabled={loading}>
                {loading ? "Searching..." : "🔍 Search Batches"}
              </button>
            </div>
          </form>

          {/* RESULTS DISPLAY LIST */}
          {searched && (
            <div className="slot-results-wrapper">
              <div className="results-head">
                <h4>Available Upcoming Batches ({batches.length})</h4>
                <span className="results-sub">Live seat availability for chosen center</span>
              </div>

              {batches.length === 0 ? (
                <div className="slot-empty-state">
                  No upcoming batches found for the selected criteria. Please try another zone or POU.
                </div>
              ) : (
                <div className="batches-grid">
                  {batches.map((b, idx) => (
                    <div key={idx} className="batch-item-card">
                      <div className="batch-card-top">
                        <div>
                          <span className="batch-code-tag">{b.batchCode}</span>
                          <h5 className="batch-course-title">{b.courseName}</h5>
                        </div>
                        <span className={`seat-badge ${b.availableSeats <= 5 ? "warning" : "success"}`}>
                          {b.availableSeats <= 5 ? `⚠️ ${b.availableSeats} Seats Left` : `🟢 ${b.availableSeats} Seats Available`}
                        </span>
                      </div>

                      <div className="batch-details-list">
                        <div className="detail-row">
                          <span className="d-label">📅 Dates:</span>
                          <span className="d-val highlight">{b.startDate} &ndash; {b.endDate}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">⏰ Timings:</span>
                          <span className="d-val">{b.timings}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">📍 Venue:</span>
                          <span className="d-val">{b.pouName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">🏢 Address:</span>
                          <span className="d-val address-val">{b.address}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">💳 Batch Fee:</span>
                          <span className="d-val fee-val">{b.fee}</span>
                        </div>
                      </div>

                      <div className="batch-card-action">
                        <a
                          href="https://www.icaionlineregistration.org/launchbatchdetail.aspx"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-book-icai"
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
      )}
    </div>
  );
}
