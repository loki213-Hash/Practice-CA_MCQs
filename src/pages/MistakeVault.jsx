import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMistakeVaultQuestions, removeFromVault } from "../services/mistakeVaultService";
import { getAllBookmarks, removeBookmark, updateStickyNote } from "../services/bookmarkService";

export default function MistakeVault() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookmarks"); // Default to bookmarks tab
  
  // Data states
  const [vaultQuestions, setVaultQuestions] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [expandedCards, setExpandedCards] = useState({});
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Search filtering
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const q = searchQuery.toLowerCase();
    return bookmarks.filter(b => {
      const text = b.question?.question_text || b.question_text || "";
      const topic = b.question?.topic || b.topic || "";
      const note = b.sticky_note || "";
      return text.toLowerCase().includes(q) || topic.toLowerCase().includes(q) || note.toLowerCase().includes(q);
    });
  }, [bookmarks, searchQuery]);

  const filteredVault = useMemo(() => {
    if (!searchQuery.trim()) return vaultQuestions;
    const q = searchQuery.toLowerCase();
    return vaultQuestions.filter(item => {
      const text = item.question_text || "";
      const topic = item.topic || "";
      return text.toLowerCase().includes(q) || topic.toLowerCase().includes(q);
    });
  }, [vaultQuestions, searchQuery]);

  return (
    <div className="vault-page-container" style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "60px" }}>
      
      {/* Top Navigation */}
      <nav style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#0F3D3E", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Home
          </Link>
          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
            <h1 style={{ margin: 0, fontSize: "18px", color: "#0F3D3E", fontWeight: "800" }}>Personal Revision Vault</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("bookmarks"); setSearchQuery(""); }}
            style={{
              border: "none",
              background: activeTab === "bookmarks" ? "#0F3D3E" : "transparent",
              color: activeTab === "bookmarks" ? "#ffffff" : "#475569",
              padding: "7px 16px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ⭐ Bookmarks ({bookmarks.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("vault"); setSearchQuery(""); }}
            style={{
              border: "none",
              background: activeTab === "vault" ? "#0F3D3E" : "transparent",
              color: activeTab === "vault" ? "#ffffff" : "#475569",
              padding: "7px 16px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ❌ Mistake Vault ({vaultQuestions.length})
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ maxWidth: "960px", margin: "32px auto 0", padding: "0 20px" }}>
        
        {/* Header Description & Search Bar */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0F3D3E" }}>
              {activeTab === "bookmarks" ? "⭐ Starred & Saved Questions" : "❌ Practice Mistakes & Weak Questions"}
            </h2>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
              {activeTab === "bookmarks"
                ? "Questions you bookmarked with your personal sticky notes for quick recall."
                : "Questions answered incorrectly during exam simulations and practice sessions."}
            </p>
          </div>

          <div style={{ minWidth: "260px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search questions or notes..."
              style={{
                width: "100%",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "13.5px",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#0F3D3E" }}>
            <h3 style={{ margin: 0 }}>Loading your questions...</h3>
          </div>
        ) : (
          <>
            {/* BOOKMARKS TAB */}
            {activeTab === "bookmarks" && (
              <div>
                {filteredBookmarks.length === 0 ? (
                  <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>⭐</div>
                    <h3 style={{ color: "#0F3D3E", margin: "0 0 8px" }}>No Bookmarked Questions Found</h3>
                    <p style={{ fontSize: "14px", margin: "0 0 20px" }}>
                      {searchQuery ? "No bookmarks match your search keyword." : "Star difficult or important questions during practice to review them here."}
                    </p>
                    <Link to="/" style={{ textDecoration: "none", background: "#0F3D3E", color: "#fff", padding: "9px 20px", borderRadius: "6px", fontWeight: "700", fontSize: "13.5px" }}>
                      Practice Questions →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredBookmarks.map((b, idx) => {
                      const q = b.question || b;
                      const qId = b.question_id || b.id;
                      const isExpanded = expandedCards[qId];
                      const isEditing = editingNoteId === qId;

                      return (
                        <div
                          key={qId || idx}
                          onClick={() => toggleExpand(qId)}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                          }}
                        >
                          {/* Top Meta */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span className="qtopic" style={{ fontSize: "11.5px" }}>
                              {q.topic || "General"}
                            </span>
                            <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => startEditingNote(e, b)}
                                style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", color: "#0F3D3E", fontWeight: "600", cursor: "pointer" }}
                              >
                                📝 {b.sticky_note ? "Edit Note" : "+ Add Note"}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveBookmark(e, qId)}
                                style={{ background: "transparent", border: "1px solid #fca5a5", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", color: "#dc2626", fontWeight: "600", cursor: "pointer" }}
                              >
                                Remove Star
                              </button>
                            </div>
                          </div>

                          {/* Question Text */}
                          <p style={{ margin: "0 0 14px", fontSize: "15.5px", fontWeight: "600", color: "#0f172a", lineHeight: "1.6" }}>
                            {q.question_text || q.question}
                          </p>

                          {/* Sticky Note Box */}
                          {(b.sticky_note || isEditing) && (
                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 14px", margin: "12px 0", fontSize: "13.5px", color: "#92400e" }} onClick={(e) => e.stopPropagation()}>
                              {isEditing ? (
                                <div>
                                  <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Write personal revision memory hooks..."
                                    rows={3}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #fde68a", fontFamily: "inherit", fontSize: "13px", boxSizing: "border-box" }}
                                  />
                                  <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                                    <button onClick={(e) => saveStickyNote(e, qId)} style={{ background: "#0F3D3E", color: "#fff", border: "none", padding: "5px 14px", borderRadius: "4px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>Save</button>
                                    <button onClick={() => setEditingNoteId(null)} style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", padding: "5px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div><strong>📌 Sticky Note:</strong> {b.sticky_note}</div>
                              )}
                            </div>
                          )}

                          {/* Expanded Options & Explanation */}
                          {isExpanded && (
                            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                                {["a", "b", "c", "d"].map((optKey) => {
                                  const optText = q[`option_${optKey}`];
                                  if (!optText) return null;
                                  const isCorrect = (q.correct_option || "").toLowerCase() === optKey;

                                  return (
                                    <div
                                      key={optKey}
                                      style={{
                                        border: isCorrect ? "1.5px solid #1E7145" : "1px solid #e2e8f0",
                                        background: isCorrect ? "rgba(30,113,69,0.06)" : "#f8fafc",
                                        padding: "10px 14px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        fontSize: "14px",
                                        color: isCorrect ? "#166534" : "#334155",
                                        fontWeight: isCorrect ? "600" : "400"
                                      }}
                                    >
                                      <span style={{ fontWeight: "700", minWidth: "22px" }}>{optKey.toUpperCase()}.</span>
                                      <span>{optText}</span>
                                      {isCorrect && <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700" }}>✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px", fontSize: "13.5px", color: "#166534", lineHeight: "1.6" }}>
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ textAlign: "right", marginTop: "8px", fontSize: "12px", color: "#0F3D3E", fontWeight: "600" }}>
                            {isExpanded ? "▲ Collapse" : "▼ Tap to view options & explanation"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MISTAKE VAULT TAB */}
            {activeTab === "vault" && (
              <div>
                {filteredVault.length === 0 ? (
                  <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                    <h3 style={{ color: "#1E7145", margin: "0 0 8px" }}>Mistake Vault is Clear!</h3>
                    <p style={{ fontSize: "14px", margin: "0 0 20px" }}>
                      {searchQuery ? "No mistake questions match your search keyword." : "Any question answered incorrectly in mock tests or practice is auto-saved here."}
                    </p>
                    <Link to="/" style={{ textDecoration: "none", background: "#0F3D3E", color: "#fff", padding: "9px 20px", borderRadius: "6px", fontWeight: "700", fontSize: "13.5px" }}>
                      Take Practice Exam →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredVault.map((q, idx) => {
                      const qId = q.question_id || q.id;
                      const isExpanded = expandedCards[qId];

                      return (
                        <div
                          key={qId || idx}
                          onClick={() => toggleExpand(qId)}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11.5px", fontWeight: "700", background: "rgba(220,38,38,0.08)", color: "#dc2626", padding: "3px 9px", borderRadius: "4px", textTransform: "uppercase" }}>
                                {q.topic || "General"}
                              </span>
                              {qId && (
                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                                  [Ref ID: #{qId}]
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFromVault(e, qId)}
                              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", color: "#166534", fontWeight: "700", cursor: "pointer" }}
                            >
                              ✓ Mastered &amp; Remove
                            </button>
                          </div>

                          <p style={{ margin: "0 0 14px", fontSize: "15.5px", fontWeight: "600", color: "#0f172a", lineHeight: "1.6" }}>
                            {q.question_text || q.question}
                          </p>

                          {isExpanded && (
                            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                                {["a", "b", "c", "d"].map((optKey) => {
                                  const optText = q[`option_${optKey}`];
                                  if (!optText) return null;
                                  const isCorrect = (q.correct_option || "").toLowerCase() === optKey;

                                  return (
                                    <div
                                      key={optKey}
                                      style={{
                                        border: isCorrect ? "1.5px solid #1E7145" : "1px solid #e2e8f0",
                                        background: isCorrect ? "rgba(30,113,69,0.06)" : "#f8fafc",
                                        padding: "10px 14px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        fontSize: "14px",
                                        color: isCorrect ? "#166534" : "#334155",
                                        fontWeight: isCorrect ? "600" : "400"
                                      }}
                                    >
                                      <span style={{ fontWeight: "700", minWidth: "22px" }}>{optKey.toUpperCase()}.</span>
                                      <span>{optText}</span>
                                      {isCorrect && <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700" }}>✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px", fontSize: "13.5px", color: "#166534", lineHeight: "1.6" }}>
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ textAlign: "right", marginTop: "8px", fontSize: "12px", color: "#0F3D3E", fontWeight: "600" }}>
                            {isExpanded ? "▲ Collapse" : "▼ Tap to view options & explanation"}
                          </div>
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
    </div>
  );
}
