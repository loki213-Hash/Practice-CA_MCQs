import { useState, useEffect } from "react";
import {
  SPOM_STATES,
  SPOM_CITIES_BY_STATE,
  SPOM_CENTERS_BY_CITY,
  getSpomSlots
} from "../services/icaiSlotService";

export default function SpomSlotFinder({ initialExpanded = false, onClose }) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [stateId, setStateId] = useState("MH");
  const [city, setCity] = useState("Mumbai");
  const [centerId, setCenterId] = useState("");
  const [slots, setSlots] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Available cities for state
  const currentCities = SPOM_CITIES_BY_STATE[stateId] || [];

  useEffect(() => {
    if (currentCities.length > 0) {
      setCity(currentCities[0]);
    }
  }, [stateId]);

  // Available centers for city
  const currentCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: "GENERIC_CTR", name: `ICAI SPOM Exam Center - ${city}`, address: `Official ICAI Examination Premises, ${city}` }
  ];

  useEffect(() => {
    if (currentCenters.length > 0) {
      setCenterId(currentCenters[0].id);
    }
  }, [city]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = getSpomSlots(stateId, city, centerId);
      setSlots(res);
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
    <div className={`icai-slot-card-container ${isExpanded ? "expanded" : "compact"} spom-theme`}>
      {/* CARD HEADER / COMPACT BAR */}
      <div 
        className="slot-card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="slot-header-left">
          <div className="slot-icon-orb spom-icon-bg">🎯</div>
          <div>
            <div className="slot-title">ICAI SPOM Live Exam Slot Finder</div>
            <div className="slot-subtitle">
              {isExpanded ? "Select State, City & Center to view available exam dates & seat slots" : "Click to search SPOM exam center dates, time slots & available seats"}
            </div>
          </div>
        </div>
        <div className="slot-header-right">
          <span className="slot-badge-live spom-badge">
            <span className="live-dot spom-dot"></span> spmt.icai.org
          </span>
          <button type="button" className="slot-toggle-btn spom-btn">
            {isExpanded ? "Collapse ▲" : "Check Slots →"}
          </button>
        </div>
      </div>

      {/* EXPANDED INTERACTIVE PANEL */}
      {isExpanded && (
        <div className="slot-card-body">
          <div className="slot-portal-notice spom-notice">
            <span>🔗 Official SPOM Data Portal:</span>
            <a 
              href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action" 
              target="_blank" 
              rel="noopener noreferrer"
              className="portal-link-accent"
            >
              spmt.icai.org/ICAI/LoginAction_showSlotDetails.action ↗
            </a>
          </div>

          {/* INPUT FORM GRID */}
          <form onSubmit={handleSearch} className="slot-filter-form">
            <div className="filter-group">
              <label htmlFor="spom-state-select">Select State Name</label>
              <select 
                id="spom-state-select"
                value={stateId} 
                onChange={(e) => setStateId(e.target.value)}
                className="slot-select"
              >
                {SPOM_STATES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="spom-city-select">Select City</label>
              <select 
                id="spom-city-select"
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                className="slot-select"
              >
                {currentCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="spom-center-select">Select Exam Center</label>
              <select 
                id="spom-center-select"
                value={centerId} 
                onChange={(e) => setCenterId(e.target.value)}
                className="slot-select"
              >
                {currentCenters.map(ctr => (
                  <option key={ctr.id} value={ctr.id}>{ctr.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group submit-group">
              <button type="submit" className="slot-search-btn spom-search-btn" disabled={loading}>
                {loading ? "Checking Slots..." : "⚡ Check SPOM Slots"}
              </button>
            </div>
          </form>

          {/* RESULTS DISPLAY LIST */}
          {searched && (
            <div className="slot-results-wrapper">
              <div className="results-head">
                <h4>Available SPOM Exam Slots ({slots.length})</h4>
                <span className="results-sub">Live exam date & seat availability</span>
              </div>

              {slots.length === 0 ? (
                <div className="slot-empty-state">
                  No slots currently available for the selected center. Please check another city or center.
                </div>
              ) : (
                <div className="batches-grid">
                  {slots.map((s, idx) => (
                    <div key={idx} className="batch-item-card spom-item-card">
                      <div className="batch-card-top">
                        <div>
                          <span className="batch-code-tag spom-tag">{s.slotId}</span>
                          <h5 className="batch-course-title">{s.examDate}</h5>
                        </div>
                        <span className={`seat-badge ${s.availableSeats <= 10 ? "warning" : "success"}`}>
                          {s.availableSeats <= 10 ? `⚠️ ${s.availableSeats} Seats Left` : `🟢 ${s.availableSeats} Seats Available`}
                        </span>
                      </div>

                      <div className="batch-details-list">
                        <div className="detail-row">
                          <span className="d-label">⏰ Slot Timing:</span>
                          <span className="d-val highlight">{s.timing}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">📘 Modules:</span>
                          <span className="d-val">{s.moduleType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">📍 Center:</span>
                          <span className="d-val">{s.centerName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="d-label">🏢 Address:</span>
                          <span className="d-val address-val">{s.address}</span>
                        </div>
                      </div>

                      <div className="batch-card-action">
                        <a
                          href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-book-icai spom-book-btn"
                        >
                          Book Exam Slot on Official SPOM Portal ↗
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
