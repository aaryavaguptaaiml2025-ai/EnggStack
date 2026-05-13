import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Card, Modal, Input, Btn, Badge, Toast, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { useStats } from "../context/StatsContext";
import { motion, AnimatePresence } from "framer-motion";

const RATING_BUTTONS = [
  { rating: 1, label: "Again", color: "var(--clr-danger, #ef4444)", icon: "replay", sub: "< 1 min" },
  { rating: 2, label: "Hard",  color: "var(--clr-streak, #f97316)", icon: "trending_down", sub: "~1 day" },
  { rating: 3, label: "Good",  color: "var(--ac)", icon: "check", sub: "Normal" },
  { rating: 4, label: "Easy",  color: "var(--clr-blue, #3b82f6)", icon: "bolt", sub: "Extended" },
];

export default function FlashcardsPage() {
  const { refresh } = useStats();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Deck creation
  const [deckModal, setDeckModal] = useState(false);
  const [deckForm, setDeckForm] = useState({ title: "", subject: "" });
  const [subjects, setSubjects] = useState([]);

  // Card creation
  const [cardModal, setCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({ front: "", back: "", deckId: "" });
  
  // Review mode
  const [reviewDeckId, setReviewDeckId] = useState(null);
  const [reviewCards, setReviewCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  
  // Browse cards
  const [browseDeckId, setBrowseDeckId] = useState(null);
  const [browseCards, setBrowseCards] = useState([]);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try { setDecks(await api.getDecks()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadDecks();
    api.getSubjects().then(setSubjects).catch(() => {});
  }, [loadDecks]);

  // Create deck
  const createDeck = async () => {
    if (!deckForm.title.trim()) return;
    try {
      await api.createDeck(deckForm);
      sfx.success();
      setToast({ msg: "Deck created!", color: "var(--ac)" });
      setDeckModal(false);
      setDeckForm({ title: "", subject: "" });
      loadDecks();
    } catch (e) { sfx.error(); setToast({ msg: e.message, color: "var(--clr-danger, #f87171)" }); }
  };

  // Delete deck
  const deleteDeck = async (id) => {
    try { await api.deleteDeck(id); sfx.click(); loadDecks(); } catch {}
  };

  // Create card
  const createCard = async () => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;
    try {
      await api.createCard(cardForm);
      sfx.success();
      setToast({ msg: "Card added!", color: "var(--ac)" });
      setCardForm(f => ({ ...f, front: "", back: "" }));
      loadDecks();
      if (browseDeckId === cardForm.deckId) {
        api.getDeckCards(cardForm.deckId).then(setBrowseCards).catch(() => {});
      }
    } catch (e) { sfx.error(); setToast({ msg: e.message, color: "var(--clr-danger, #f87171)" }); }
  };

  // Start review
  const startReview = async (deckId) => {
    try {
      const cards = await api.getDueCards(deckId);
      if (cards.length === 0) {
        setToast({ msg: "No cards due! Come back later.", color: "var(--clr-blue, #3b82f6)" });
        return;
      }
      setReviewDeckId(deckId);
      setReviewCards(cards);
      setCurrentIdx(0);
      setFlipped(false);
      setReviewed(0);
      setXpEarned(0);
      setShowComplete(false);
      sfx.click();
    } catch (e) { setToast({ msg: e.message, color: "var(--clr-danger, #f87171)" }); }
  };

  // Submit review
  const submitReview = async (rating) => {
    if (reviewing) return;
    setReviewing(true);
    try {
      const card = reviewCards[currentIdx];
      const result = await api.reviewCard(card._id, rating);
      setReviewed(r => r + 1);
      setXpEarned(x => x + 5);
      
      if (rating >= 3) sfx.xp();
      else sfx.click();

      if (currentIdx + 1 >= reviewCards.length) {
        // All done!
        setShowComplete(true);
        sfx.levelUp();
        refresh();
      } else {
        setCurrentIdx(i => i + 1);
        setFlipped(false);
      }
    } catch (e) { setToast({ msg: e.message, color: "var(--clr-danger, #f87171)" }); }
    finally { setReviewing(false); }
  };

  // Browse cards in a deck
  const browseCardsDeck = async (deckId) => {
    setBrowseDeckId(deckId);
    try {
      const cards = await api.getDeckCards(deckId);
      setBrowseCards(cards);
    } catch (e) { console.error(e); }
  };

  // ── Review Mode ─────────────────────────────────────────────────────────────
  if (reviewDeckId && !showComplete) {
    const card = reviewCards[currentIdx];
    const deck = decks.find(d => d._id === reviewDeckId);
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[80vh]">
        {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

        {/* Progress */}
        <div className="w-full max-w-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setReviewDeckId(null)} className="text-muted text-xs hover:text-[var(--text)] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Exit
            </button>
            <span className="text-sm font-bold text-[var(--text)]">{deck?.title}</span>
            <span className="text-xs text-muted">{currentIdx + 1} / {reviewCards.length}</span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ background: "var(--ac)", width: `${((currentIdx) / reviewCards.length) * 100}%` }} />
          </div>
        </div>

        {/* Flashcard with flip animation */}
        <div 
          onClick={() => !flipped && setFlipped(true)}
          className="w-full max-w-lg cursor-pointer perspective-1000"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d", position: "relative", minHeight: "280px" }}
          >
            {/* Front */}
            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center rounded-3xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', backfaceVisibility: "hidden" }}>
              <span className="material-symbols-outlined text-3xl mb-4" style={{ color: 'color-mix(in srgb, var(--ac) 40%, transparent)' }}>quiz</span>
              <div className="text-lg font-bold leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{card?.front}</div>
              <div className="text-xs mt-6" style={{ color: 'var(--dim)' }}>Tap to reveal answer</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center rounded-3xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <span className="material-symbols-outlined text-3xl mb-4" style={{ color: 'color-mix(in srgb, var(--ac) 40%, transparent)' }}>lightbulb</span>
              <div className="text-lg font-bold leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{card?.back}</div>
            </div>
          </motion.div>
        </div>

        {/* Rating buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 mt-8 w-full max-w-lg"
            >
              {RATING_BUTTONS.map(btn => (
                <button key={btn.rating}
                  onClick={() => submitReview(btn.rating)}
                  disabled={reviewing}
                  className="flex-1 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.03] active:scale-95 flex flex-col items-center gap-1"
                  style={{ 
                    background: `${btn.color}0d`,
                    borderColor: `${btn.color}30`,
                    color: btn.color,
                  }}
                >
                  <span className="material-symbols-outlined text-xl">{btn.icon}</span>
                  <span className="text-xs font-bold">{btn.label}</span>
                  <span className="text-[10px] opacity-60">{btn.sub}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-[10px] text-dim">
          +5 XP per card • {xpEarned} XP earned this session
        </div>
      </div>
    );
  }

  // ── Completion Screen ───────────────────────────────────────────────────────
  if (showComplete) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[80vh] text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <span className="material-symbols-outlined text-7xl mb-4 block filled" style={{ color: "var(--ac)" }}>emoji_events</span>
        </motion.div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Session Complete!</h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>You reviewed {reviewed} cards</p>
        <div className="flex gap-4 mb-8">
          <div className="px-6 py-4 text-center rounded-3xl" style={{ background: "var(--card)" }}>
            <div className="text-2xl font-extrabold" style={{ color: "var(--ac)" }}>+{xpEarned}</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>XP Earned</div>
          </div>
          <div className="px-6 py-4 text-center rounded-3xl" style={{ background: "var(--card)" }}>
            <div className="text-2xl font-extrabold" style={{ color: "var(--clr-streak, #f97316)" }}>{reviewed}</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Cards Reviewed</div>
          </div>
        </div>
        <Btn color="var(--ac)" onClick={() => { setReviewDeckId(null); setShowComplete(false); loadDecks(); }}>
          Back to Decks
        </Btn>
      </div>
    );
  }

  // ── Main View — Deck List ───────────────────────────────────────────────────
  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      
      <motion.div className="flex justify-between items-center mb-8" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-3xl grad-text filled">style</span>
            <h1 className="text-3xl font-extrabold grad-text tracking-tight">Flashcards</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Spaced repetition for long-term memory</p>
        </div>
        <Btn color="var(--clr-purple, #8b5cf6)" onClick={() => setDeckModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> New Deck
        </Btn>
      </motion.div>

      {loading ? (
        <div className="text-center py-20"><Spinner /></div>
      ) : decks.length === 0 ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-16 rounded-3xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--dim)' }}>style</span>
          <div className="text-sm mb-4" style={{ color: 'var(--muted)' }}>No flashcard decks yet. Create one to start studying!</div>
          <Btn color="var(--clr-purple, #8b5cf6)" onClick={() => setDeckModal(true)}>Create First Deck</Btn>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck, i) => {
            const hasDue = deck.dueCount > 0;
            return (
              <motion.div key={deck._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="relative overflow-hidden" style={{ borderLeft: "3px solid var(--clr-purple, #8b5cf6)" }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--clr-purple, #8b5cf6)' }}>style</span>
                      <div>
                        <div className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>{deck.title}</div>
                        {deck.subject && <Badge color="var(--ac)">{deck.subject}</Badge>}
                      </div>
                    </div>
                    <button onClick={() => deleteDeck(deck._id)}
                      className="p-1 transition-colors hover:brightness-150" style={{ color: 'var(--dim)' }}>
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>

                  <div className="flex gap-3 text-xs mb-4" style={{ color: 'var(--muted)' }}>
                    <span>{deck.totalCards} cards</span>
                    <span className="font-bold" style={{ color: hasDue ? 'var(--clr-streak, #f97316)' : 'var(--ac)' }}>
                      {hasDue ? `🔥 ${deck.dueCount} due` : "✅ All caught up"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => startReview(deck._id)}
                      disabled={!hasDue}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5`}
                      style={{
                        background: hasDue ? 'color-mix(in srgb, var(--clr-purple, #8b5cf6) 10%, transparent)' : 'var(--card2)',
                        border: hasDue ? '1px solid color-mix(in srgb, var(--clr-purple, #8b5cf6) 20%, transparent)' : '1px solid var(--border)',
                        color: hasDue ? 'var(--clr-purple, #8b5cf6)' : 'var(--dim)',
                        cursor: hasDue ? 'pointer' : 'default'
                      }}>
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      {hasDue ? "Study" : "No cards due"}
                    </button>
                    <button onClick={() => { setCardForm(f => ({ ...f, deckId: deck._id })); setCardModal(true); }}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={{ background: 'color-mix(in srgb, var(--ac) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)', color: 'var(--ac)' }}>
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                    <button onClick={() => browseDeckId === deck._id ? setBrowseDeckId(null) : browseCardsDeck(deck._id)}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <span className="material-symbols-outlined text-sm">list</span>
                    </button>
                  </div>

                  {/* Browse cards inline */}
                  <AnimatePresence>
                    {browseDeckId === deck._id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 space-y-2 max-h-60 overflow-y-auto" style={{ borderTop: '1px solid var(--border)' }}>
                          {browseCards.length === 0 ? (
                            <div className="text-xs text-center py-3" style={{ color: 'var(--dim)' }}>No cards yet</div>
                          ) : browseCards.map(c => (
                            <div key={c._id} className="flex items-start justify-between p-2.5 rounded-xl text-xs" style={{ background: 'var(--card2)' }}>
                              <div className="flex-1 mr-2">
                                <div className="font-medium truncate" style={{ color: 'var(--text)' }}>{c.front}</div>
                                <div className="truncate mt-0.5" style={{ color: 'var(--muted)' }}>{c.back}</div>
                              </div>
                              <button onClick={() => { api.deleteCard(c._id).then(() => browseCardsDeck(deck._id)).then(loadDecks); sfx.click(); }}
                                className="flex-shrink-0 p-0.5 transition-colors hover:brightness-150" style={{ color: 'var(--dim)' }}>
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Deck Modal */}
      {deckModal && (
        <Modal title="Create Deck" onClose={() => setDeckModal(false)}>
          <Input label="Deck Title" placeholder="e.g. Data Structures — Trees" value={deckForm.title} 
            onChange={e => setDeckForm({...deckForm, title: e.target.value})} />
          <div className="mb-4">
            <div className="text-xs font-semibold mb-1.5 ml-1" style={{ color: 'var(--muted)' }}>Subject (optional)</div>
            <select 
              value={deckForm.subject}
              onChange={e => setDeckForm({...deckForm, subject: e.target.value})}
              className="input-field w-full"
              style={{ colorScheme: "dark" }}
            >
              <option value="">No subject</option>
              {subjects.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <Btn full color="var(--clr-purple, #8b5cf6)" onClick={createDeck}>Create Deck</Btn>
        </Modal>
      )}

      {/* Create Card Modal */}
      {cardModal && (
        <Modal title="Add Flashcard" onClose={() => setCardModal(false)}>
          <div className="mb-4">
            <div className="text-xs font-semibold mb-1.5 ml-1" style={{ color: 'var(--muted)' }}>Front (Question)</div>
            <textarea value={cardForm.front} onChange={e => setCardForm({...cardForm, front: e.target.value})}
              placeholder="e.g. What is the time complexity of binary search?"
              rows={3} className="input-field resize-none w-full" />
          </div>
          <div className="mb-4">
            <div className="text-xs font-semibold mb-1.5 ml-1" style={{ color: 'var(--muted)' }}>Back (Answer)</div>
            <textarea value={cardForm.back} onChange={e => setCardForm({...cardForm, back: e.target.value})}
              placeholder="e.g. O(log n)"
              rows={3} className="input-field resize-none w-full" />
          </div>
          <div className="flex gap-2">
            <Btn full color="var(--ac)" onClick={createCard}>Add Card</Btn>
            <Btn full variant="outline" onClick={() => setCardModal(false)}>Done</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
