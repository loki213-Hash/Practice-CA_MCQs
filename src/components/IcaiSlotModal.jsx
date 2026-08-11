import { useState, useEffect } from "react";
import SpomSlotFinder from "./SpomSlotFinder";
import AdvIttSlotFinder from "./AdvIttSlotFinder";

export default function IcaiSlotModal({ activeTab = "spom", isOpen, onClose }) {
  const [tab, setTab] = useState(activeTab);

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="icai-modal-overlay" onClick={onClose}>
      <div 
        className="icai-modal-wrapper" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL TAB SWITCHER */}
        <div className="icai-modal-tabs">
          <button
            type="button"
            className={`icai-modal-tab-btn ${tab === "spom" ? "active spom" : ""}`}
            onClick={() => setTab("spom")}
          >
            🎯 SPOM Exam Slots Finder
          </button>
          <button
            type="button"
            className={`icai-modal-tab-btn ${tab === "adv" ? "active adv" : ""}`}
            onClick={() => setTab("adv")}
          >
            🎓 ICAI BOS Adv MCS / Adv ITT Batches
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        <div className="icai-modal-content">
          {tab === "spom" ? (
            <SpomSlotFinder onClose={onClose} />
          ) : (
            <AdvIttSlotFinder onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
