import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMistakeVaultQuestions, removeFromVault } from "../services/mistakeVaultService";
import { getAllBookmarks, removeBookmark, updateStickyNote } from "../services/bookmarkService";

export default function MistakeVault() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("vault"); // "vault" | "bookmarks"
  
  // Data states
  const [vaultQuestions, setVaultQuestions] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [expandedCards, setExpandedCards] = useState({});
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vaultData, bookmarkData] = await Promise.all([
        getMistakeVaultQuestions(),
        getAllBookmarks()
      ]);
      setVaultQuestions(vaultData || []);
      setBookmarks(bookmarkData || []);
    } catch (error) {
      console.error("Error loading vault data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRemoveFromVault = async (e, questionId) => {
    e.stopPropagation();
    try {
      await removeFromVault(questionId);
      setVaultQuestions(prev => prev.filter(q => (q.question_id || q.id) !== questionId));
    } catch (error) {
      console.error("Error removing from vault:", error);
    }
  };

  const handleRemoveBookmark = async (e, questionId) => {
    e.stopPropagation();
    try {
      await removeBookmark(questionId);
      setBookmarks(prev => prev.filter(b => (b.question_id || b.id) !== questionId));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const startEditingNote = (e, bookmark) => {
    e.stopPropagation();
    setEditingNoteId(bookmark.question_id || bookmark.id);
    setNoteText(bookmark.sticky_note || "");
  };

  const saveStickyNote = async (e, questionId) => {
    e.stopPropagation();
    try {
      await updateStickyNote(questionId, noteText);
      setBookmarks(prev => prev.map(b => 
        (b.question_id || b.id) === questionId ? { ...b, sticky_note: noteText } : b
      ));
      setEditingNoteId(null);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Get unique topics for vault filter
  const topics = ["All", ...new Set(vaultQuestions.map(q => q.topic).filter(Boolean))];

  const filteredVault = activeFilter === "All" 
    ? vaultQuestions 
    : vaultQuestions.filter(q => q.topic === activeFilter);

  return (
    <div className="vault-page">
      <nav className="vault-nav">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1 className="vault-title">Study Vault</h1>
        <div className="vault-tabs">
          <button 
            className={`vault-tab ${activeTab === "vault" ? "active" : ""}`}
            onClick={() => setActiveTab("vault")}
          >
            Mistake Vault
          </button>
          <button 
            className={`vault-tab ${activeTab === "bookmarks" ? "active" : ""}`}
            onClick={() => setActiveTab("bookmarks")}
          >
            Bookmarks
          </button>
        </div>
      </nav>

      <div className="vault-content">
        <div className="vault-stats-bar">
          <span className="stat-item">📚 {vaultQuestions.length} in vault</span>
          <span className="stat-item">⭐ {bookmarks.length} bookmarked</span>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading your vault...</div>
        ) : (
          <>
            {/* VAULT TAB */}
            {activeTab === "vault" && (
              <div className="tab-pane vault-pane">
                {vaultQuestions.length > 0 && (
                  <div className="vault-filter-chips">
                    {topics.map(topic => (
                      <button 
                        key={topic}
                        className={`vault-chip ${activeFilter === topic ? "active" : ""}`}
                        onClick={() => setActiveFilter(topic)}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}

                {vaultQuestions.length === 0 ? (
                  <div className="vault-empty">
                    <div className="empty-icon">🎉</div>
                    <h3>Vault is clear!</h3>
                    <p>Keep practicing to track weak areas.</p>
                    <Link to="/practice" className="primary-btn">Start Practice</Link>
                  </div>
                ) : (
                  <div className="question-list">
                    {filteredVault.map((q) => {
                      const isExpanded = expandedCards[q.id];
                      return (
                        <div 
                          key={q.id} 
                          className={`vault-question-card ${isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpand(q.id)}
                        >
                          <div className="card-header">
                            <span className="vault-q-topic-badge">{q.topic || 'General'}</span>
                            <div className="vault-q-actions">
                              <button 
                                className="vault-remove-btn"
                                onClick={(e) => handleRemoveFromVault(e, q.id)}
                              >
                                Remove ✓ Mastered
                              </button>
                            </div>
                          </div>
                          
                          <p className="vault-q-text">
                            {isExpanded ? q.question_text : 
                              (q.question_text?.length > 120 ? q.question_text.substring(0, 120) + "..." : q.question_text)}
                          </p>

                          {isExpanded && (
                            <div className="vault-expand-section">
                              <div className="options-list">
                                {['a', 'b', 'c', 'd'].map(optKey => (
                                  <div 
                                    key={optKey} 
                                    className={`vault-opt ${q.correct_option === optKey ? "correct-ans" : ""}`}
                                  >
                                    <span className="opt-label">{optKey.toUpperCase()})</span>
                                    <span className="opt-text">{q[`option_${optKey}`]}</span>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div className="vault-explanation">
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BOOKMARKS TAB */}
            {activeTab === "bookmarks" && (
              <div className="tab-pane bookmarks-pane">
                {bookmarks.length === 0 ? (
                  <div className="vault-empty">
                    <div className="empty-icon">⭐</div>
                    <h3>No bookmarks yet</h3>
                    <p>Star questions during practice to save them here.</p>
                    <Link to="/practice" className="primary-btn">Start Practice</Link>
                  </div>
                ) : (
                  <div className="question-list">
                    {bookmarks.map((b) => {
                      const q = b.question; // Assuming relation brings question details
                      if (!q) return null;
                      
                      const isExpanded = expandedCards[`b_${b.id}`];
                      const isEditing = editingNoteId === b.id;

                      return (
                        <div 
                          key={b.id} 
                          className={`vault-question-card ${isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpand(`b_${b.id}`)}
                        >
                          <div className="card-header">
                            <span className="vault-q-topic-badge">{q.topic || 'General'}</span>
                            <div className="vault-q-actions">
                              <button 
                                className="action-btn"
                                onClick={(e) => startEditingNote(e, b)}
                              >
                                📝 Edit Note
                              </button>
                              <button 
                                className="action-btn danger"
                                onClick={(e) => handleRemoveBookmark(e, q.id)}
                              >
                                Remove Bookmark
                              </button>
                            </div>
                          </div>
                          
                          <p className="vault-q-text">
                            {isExpanded ? q.question_text : 
                              (q.question_text?.length > 120 ? q.question_text.substring(0, 120) + "..." : q.question_text)}
                          </p>

                          {/* Sticky Note Section */}
                          {(b.sticky_note || isEditing) && (
                            <div className="vault-sticky-note" onClick={e => e.stopPropagation()}>
                              {isEditing ? (
                                <div className="note-edit-container">
                                  <textarea 
                                    className="vault-note-input"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Type your study note here..."
                                    autoFocus
                                  />
                                  <div className="note-actions">
                                    <button onClick={(e) => saveStickyNote(e, b.id)}>Save Note</button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="note-display">📌 {b.sticky_note}</p>
                              )}
                            </div>
                          )}

                          {isExpanded && (
                            <div className="vault-expand-section">
                              <div className="options-list">
                                {['a', 'b', 'c', 'd'].map(optKey => (
                                  <div 
                                    key={optKey} 
                                    className={`vault-opt ${q.correct_option === optKey ? "correct-ans" : ""}`}
                                  >
                                    <span className="opt-label">{optKey.toUpperCase()})</span>
                                    <span className="opt-text">{q[`option_${optKey}`]}</span>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div className="vault-explanation">
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .vault-page {
          max-width: 1000px;
          margin: 0 auto;
          background: #f8fafc;
          min-height: 100vh;
        }
        .vault-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .back-link {
          text-decoration: none;
          color: #64748b;
          font-weight: 500;
        }
        .vault-title {
          font-size: 1.5rem;
          margin: 0;
          color: #0f172a;
        }
        .vault-tabs {
          display: flex;
          gap: 1rem;
        }
        .vault-tab {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
          border-bottom: 2px solid transparent;
        }
        .vault-tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }
        .vault-content {
          padding: 2rem;
        }
        .vault-stats-bar {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          color: #475569;
          font-weight: 500;
        }
        .vault-filter-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .vault-chip {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          color: #475569;
        }
        .vault-chip.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        .vault-question-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .vault-question-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .vault-q-topic-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .vault-q-actions {
          display: flex;
          gap: 0.5rem;
        }
        .vault-remove-btn, .action-btn {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .vault-remove-btn:hover {
          background: #f0fdf4;
          color: #166534;
          border-color: #bbf7d0;
        }
        .action-btn.danger:hover {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .vault-q-text {
          color: #1e293b;
          font-size: 1rem;
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }
        .vault-expand-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .vault-opt {
          padding: 0.75rem;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }
        .vault-opt.correct-ans {
          background: #f0fdf4;
          border-color: #86efac;
        }
        .opt-label {
          font-weight: 600;
          margin-right: 0.5rem;
        }
        .vault-explanation {
          margin-top: 1rem;
          padding: 1rem;
          background: #eff6ff;
          border-radius: 6px;
          color: #1e3a8a;
        }
        .vault-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .primary-btn {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.5rem 1.5rem;
          background: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
        }
        .vault-sticky-note {
          background: #fef08a;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
        }
        .vault-note-input {
          width: 100%;
          min-height: 80px;
          border: 1px solid #ca8a04;
          background: #fef9c3;
          border-radius: 4px;
          padding: 0.5rem;
          font-family: inherit;
          resize: vertical;
        }
        .note-actions {
          margin-top: 0.5rem;
          display: flex;
          gap: 0.5rem;
        }
        .note-actions button {
          padding: 0.25rem 0.75rem;
          cursor: pointer;
        }
        .note-display {
          margin: 0;
          color: #854d0e;
        }
      `}} />
    </div>
  );
}
