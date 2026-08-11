import { useState, useEffect } from "react";
import {
  SPOM_STATES,
  SPOM_CITIES_BY_STATE,
  SPOM_CENTERS_BY_CITY,
  CALENDAR_AVAILABLE_DATES,
  getSpomSlots
} from "../services/icaiSlotService";

export default function SpomSlotFinder({ onClose }) {
  const [stateId, setStateId] = useState("AP");
  const [city, setCity] = useState("Visakhapatnam");
  const [centerId, setCenterId] = useState("VSKP_DEXIT");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewLiveFrame, setViewLiveFrame] = useState(false);

  // Available cities for current state
  const currentCities = SPOM_CITIES_BY_STATE[stateId] || [];

  // Available centers for current city
  const currentCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: `CTR_${city.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global / NSEIT Limited - ${city}`, address: `Official ICAI Examination Premises, ${city}` }
  ];

  // Reactive State Change Handler
  const handleStateChange = (newStateId) => {
    setStateId(newStateId);
    const cities = SPOM_CITIES_BY_STATE[newStateId] || [];
    const firstCity = cities[0] || "";
    setCity(firstCity);

    const centers = SPOM_CENTERS_BY_CITY[firstCity] || [
      { id: `CTR_${firstCity.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global / NSEIT Limited - ${firstCity}`, address: `Official ICAI Examination Premises, ${firstCity}` }
    ];
    setCenterId(centers[0]?.id || "");
    setSelectedDate("");
    setSearched(false);
  };

  // Reactive City Change Handler
  const handleCityChange = (newCity) => {
    setCity(newCity);
    const centers = SPOM_CENTERS_BY_CITY[newCity] || [
      { id: `CTR_${newCity.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global / NSEIT Limited - ${newCity}`, address: `Official ICAI Examination Premises, ${newCity}` }
    ];
    setCenterId(centers[0]?.id || "");
    setSelectedDate("");
    setSearched(false);
  };

  const handleSearch = (e, filterDate = selectedDate) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = getSpomSlots(stateId, city, centerId, filterDate);
      setSlots(res);
      setSearched(true);
      setLoading(false);
    }, 200);
  };

  // Auto-search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="icai-modal-panel spom-modal-theme">
      {/* MODAL HEADER */}
      <div className="icai-modal-header">
        <div className="icai-header-left">
          <div className="icai-icon-orb spom-bg">🎯</div>
          <div>
            <h3 className="icai-modal-title">ICAI SPOM Live Exam Slot Finder</h3>
            <p className="icai-modal-sub">
              Select State, City &amp; Partnered Test Centre to check exam dates &amp; seat availability
            </p>
          </div>
        </div>
        <div className="icai-header-right">
          <button
            type="button"
            className={`icai-toggle-frame-btn ${viewLiveFrame ? "active" : ""}`}
            onClick={() => setViewLiveFrame(!viewLiveFrame)}
          >
            {viewLiveFrame ? "📋 Form View" : "🌐 Official Live Portal"}
          </button>
          <span className="icai-badge spom-badge">
            <span className="live-dot spom-dot"></span> spmt.icai.org
          </span>
          {onClose && (
            <button type="button" className="icai-close-btn" onClick={onClose} title="Close Modal">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* EMBEDDED LIVE PORTAL VIEW (IF TOGGLED) */}
      {viewLiveFrame ? (
        <div className="icai-iframe-container">
          <div className="iframe-notice">
            <span>🌐 Live Connection to Official ICAI SPOM Portal:</span>
            <a 
              href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action" 
              target="_blank" 
              rel="noopener noreferrer"
              className="portal-link-accent"
            >
              Open spmt.icai.org in new window ↗
            </a>
          </div>
          <iframe
            src="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action"
            title="Official ICAI SPOM Live Slot Portal"
            className="icai-live-iframe"
          />
        </div>
      ) : (
        <>
          {/* PORTAL LINK BANNER */}
          <div className="icai-portal-banner spom-banner">
            <span>🔗 Official ICAI SPOM Portal:</span>
            <a
              href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action"
              target="_blank"
              rel="noopener noreferrer"
              className="portal-link-accent"
            >
              spmt.icai.org/ICAI/LoginAction_showSlotDetails.action ↗
            </a>
          </div>

          {/* REACTIVE FILTER FORM */}
          <form onSubmit={handleSearch} className="icai-filter-grid">
            <div className="icai-filter-group">
              <label htmlFor="spom-modal-state">Select State Name</label>
              <select
                id="spom-modal-state"
                value={stateId}
                onChange={(e) => handleStateChange(e.target.value)}
                className="icai-select"
              >
                {SPOM_STATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="icai-filter-group">
              <label htmlFor="spom-modal-city">Select City</label>
              <select
                id="spom-modal-city"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="icai-select"
              >
                {currentCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="icai-filter-group">
              <label htmlFor="spom-modal-center">Select Test Centre *</label>
              <select
                id="spom-modal-center"
                value={centerId}
                onChange={(e) => {
                  setCenterId(e.target.value);
                  setSelectedDate("");
                  setSearched(false);
                }}
                className="icai-select"
              >
                {currentCenters.map((ctr) => (
                  <option key={ctr.id} value={ctr.id}>
                    {ctr.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="icai-filter-group submit-group">
              <button type="submit" className="icai-submit-btn spom-btn-color" disabled={loading}>
                {loading ? "Checking..." : "⚡ Check SPOM Slots"}
              </button>
            </div>
          </form>

          {/* INTERACTIVE CALENDAR DATE PICKER (Matching Official ICAI Calendar Layout) */}
          <div className="spom-calendar-widget">
            <div className="calendar-widget-head">
              <h5>📅 ICAI Exam Date Availability Calendar (August 2026)</h5>
              <div className="calendar-legend">
                <span className="legend-item"><span className="legend-dot green"></span> Available Slots</span>
                <span className="legend-item"><span className="legend-dot red"></span> Fully Booked Slots</span>
              </div>
            </div>

            <div className="calendar-dates-grid">
              <button
                type="button"
                className={`cal-date-btn ${selectedDate === "" ? "active" : ""}`}
                onClick={() => {
                  setSelectedDate("");
                  handleSearch(null, "");
                }}
              >
                All Dates
              </button>
              {CALENDAR_AVAILABLE_DATES.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  className={`cal-date-btn green ${selectedDate === d.dateStr ? "active" : ""}`}
                  onClick={() => {
                    setSelectedDate(d.dateStr);
                    handleSearch(null, d.dateStr);
                  }}
                >
                  <span className="cal-day-num">{d.day}</span>
                  <span className="cal-month-lbl">Aug ({d.weekday})</span>
                </button>
              ))}
            </div>
          </div>

          {/* RESULTS GRID */}
          {searched && (
            <div className="icai-results-container">
              <div className="icai-results-head">
                <h4>
                  Available SPOM Exam Slots ({slots.length})
                  {selectedDate && <span className="selected-date-badge">Filtered: {selectedDate}</span>}
                </h4>
                <span>Live exam date &amp; seat availability for chosen center</span>
              </div>

              {slots.length === 0 ? (
                <div className="icai-empty-box">
                  No slots available for the selected date or center. Please select another date on the calendar.
                </div>
              ) : (
                <div className="icai-cards-grid">
                  {slots.map((s, idx) => (
                    <div key={idx} className="icai-slot-item-card spom-card-accent">
                      <div className="card-top-head">
                        <div>
                          <span className="card-tag spom-tag-style">{s.slotId}</span>
                          <h5 className="card-title-main">{s.examDate}</h5>
                        </div>
                        <span className={`seat-badge ${s.availableSeats <= 10 ? "warning" : "success"}`}>
                          {s.availableSeats <= 10
                            ? `⚠️ ${s.availableSeats} Seats Left`
                            : `🟢 ${s.availableSeats} Seats Available`}
                        </span>
                      </div>

                      <div className="card-body-details">
                        <div className="detail-line">
                          <span className="d-key">⏰ Slot:</span>
                          <span className="d-value bold">{s.timing}</span>
                        </div>
                        <div className="detail-line">
                          <span className="d-key">📘 Modules:</span>
                          <span className="d-value">{s.moduleType}</span>
                        </div>
                        <div className="detail-line">
                          <span className="d-key">📍 Centre:</span>
                          <span className="d-value">{s.centerName}</span>
                        </div>
                        <div className="detail-line">
                          <span className="d-key">🏢 Address:</span>
                          <span className="d-value addr-text">{s.address}</span>
                        </div>
                      </div>

                      <div className="card-foot-action">
                        <a
                          href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icai-book-btn spom-btn-outline"
                        >
                          Book Slot on Official SPOM Portal ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
