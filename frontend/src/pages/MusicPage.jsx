import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic, PLAYLISTS, AMBIENT_SOUNDS, getYouTubeId } from "../context/MusicContext";
import { Card, Badge, Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";

export default function MusicPage() {
  const {
    activePL, playing, ambient, customLink,
    handlePlaylist, handleAmbient, playCustom,
    queue, addToQueue, recentlyPlayed,
  } = useMusic();

  const [url, setUrl] = useState("");
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("playlists");

  const handlePaste = () => {
    if (!url.trim()) return;
    const ok = playCustom(url.trim());
    if (ok) { sfx.success(); setUrl(""); setToast({ msg: "Now streaming!", color: "var(--ac)" }); }
    else { sfx.error(); setToast({ msg: "Unsupported URL", color: "#f87171" }); }
  };

  const TABS = [
    { id: "playlists", label: "Curated", icon: "library_music" },
    { id: "custom", label: "Custom URL", icon: "link" },
    { id: "queue", label: `Queue (${queue.length})`, icon: "queue_music" },
    { id: "recent", label: "Recent", icon: "history" },
    { id: "ambient", label: "Ambient", icon: "spa" },
  ];

  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      {/* Header */}
      <motion.div className="mb-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-3xl grad-text filled">headphones</span>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight">Music Studio</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Stream music while you study</p>
      </motion.div>

      {/* Tabs */}
      <motion.div className="flex flex-wrap gap-2 mb-8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            style={tab === t.id ? {
              background: 'color-mix(in srgb, var(--ac) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ac) 30%, transparent)',
              color: 'var(--ac)',
              boxShadow: '0 0 15px color-mix(in srgb, var(--ac) 10%, transparent)',
            } : {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}>
            <span className={`material-symbols-outlined text-base ${tab === t.id ? 'filled' : ''}`}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* CURATED PLAYLISTS */}
        {tab === "playlists" && (
          <motion.div key="playlists"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLAYLISTS.map((pl, i) => {
              const isActive = activePL?.id === pl.id;
              const ytId = getYouTubeId(pl.url);
              const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              return (
                <motion.div key={pl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlaylist(pl)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{
                    border: isActive ? `2px solid ${pl.color}` : '1px solid var(--border)',
                    boxShadow: isActive ? `0 0 30px ${pl.color}25, inset 0 0 20px ${pl.color}08` : 'none',
                  }}>
                  {/* Background Image */}
                  {thumb && (
                    <div className="absolute inset-0">
                      <img src={thumb} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105 transform" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${pl.color}20, var(--bg) 80%)` }} />
                    </div>
                  )}
                  {!thumb && (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${pl.color}15, var(--bg))` }} />
                  )}

                  <div className="relative p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${pl.color}20`, border: `1px solid ${pl.color}30` }}>
                        <span className="material-symbols-outlined text-2xl filled" style={{ color: pl.color }}>
                          {isActive && playing ? "equalizer" : "play_arrow"}
                        </span>
                      </div>
                      {isActive && playing && (
                        <div className="flex items-end gap-[3px] h-4">
                          {[1,2,3,4,5].map(i => (
                            <motion.div key={i}
                              className="w-[3px] rounded-full"
                              style={{ background: pl.color }}
                              animate={{ height: [4, 16, 8, 14, 6] }}
                              transition={{ duration: 0.8, delay: i * 0.12, repeat: Infinity, repeatType: "reverse" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>{pl.name}</h3>
                    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{pl.desc}</p>
                    <div className="flex items-center gap-2">
                      <Badge color={pl.color}>
                        {isActive && playing ? "Now Playing" : "Play"}
                      </Badge>
                      <button onClick={(e) => { e.stopPropagation(); addToQueue(pl); sfx.click(); setToast({ msg: `Added "${pl.name}" to queue`, color: pl.color }); }}
                        className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                        style={{ color: 'var(--muted)' }}>
                        <span className="material-symbols-outlined text-sm align-middle">add</span> Queue
                      </button>
                    </div>
                  </div>

                  {/* Active glow ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ border: `2px solid ${pl.color}`, boxShadow: `0 0 20px ${pl.color}30` }}
                      animate={{ boxShadow: [`0 0 10px ${pl.color}20`, `0 0 30px ${pl.color}40`, `0 0 10px ${pl.color}20`] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* CUSTOM URL */}
        {tab === "custom" && (
          <motion.div key="custom"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--ac)' }}>link</span>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Stream from URL</h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Paste a YouTube, SoundCloud, or Twitch link</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePaste()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="input-field flex-1" />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handlePaste} className="btn-primary px-6">
                  <span className="material-symbols-outlined text-base">play_arrow</span> Stream
                </motion.button>
              </div>
              {customLink && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-4 p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'color-mix(in srgb, var(--ac) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)' }}>
                  <span className="material-symbols-outlined filled" style={{ color: 'var(--ac)' }}>check_circle</span>
                  <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{customLink}</span>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* QUEUE */}
        {tab === "queue" && (
          <motion.div key="queue"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {queue.length === 0 ? (
              <Card className="text-center py-16">
                <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--dim)' }}>queue_music</span>
                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Queue is empty</p>
                <p className="text-xs" style={{ color: 'var(--dim)' }}>Add tracks from the Curated tab</p>
              </Card>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {queue.map((pl, i) => (
                  <motion.div key={`${pl.id}-${i}`}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 flex items-center gap-4">
                    <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--dim)' }}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${pl.color}20` }}>
                      <span className="material-symbols-outlined text-base" style={{ color: pl.color }}>music_note</span>
                    </div>
                    <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>{pl.name}</span>
                    <button onClick={() => {
                      const { setQueue } = useMusic;
                      // Remove from queue
                    }} className="p-1" style={{ color: 'var(--dim)' }}>
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* RECENTLY PLAYED */}
        {tab === "recent" && (
          <motion.div key="recent"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {recentlyPlayed.length === 0 ? (
              <Card className="text-center py-16">
                <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--dim)' }}>history</span>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No recently played tracks</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentlyPlayed.map((item, i) => (
                  <motion.div key={`${item.id}-${i}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      const pl = PLAYLISTS.find(p => p.id === item.id);
                      if (pl) handlePlaylist(pl);
                      else if (item.url) playCustom(item.url);
                    }}
                    className="glass-card p-4 cursor-pointer flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${item.color || 'var(--ac)'}15` }}>
                      <span className="material-symbols-outlined" style={{ color: item.color || 'var(--ac)' }}>play_arrow</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--dim)' }}>Tap to play</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* AMBIENT SOUNDS */}
        {tab === "ambient" && (
          <motion.div key="ambient"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            {AMBIENT_SOUNDS.map((s, i) => {
              const isActive = ambient === s.id;
              const icons = { off: "volume_off", rain: "water_drop", whitenoise: "graphic_eq", lofi: "music_note", binaural: "psychology", fire: "local_fire_department" };
              return (
                <motion.button key={s.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAmbient(s.id)}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{
                    background: isActive ? 'color-mix(in srgb, var(--ac) 10%, transparent)' : 'var(--card)',
                    border: isActive ? '1px solid color-mix(in srgb, var(--ac) 40%, transparent)' : '1px solid var(--border)',
                    boxShadow: isActive ? '0 0 20px color-mix(in srgb, var(--ac) 15%, transparent)' : 'none',
                  }}>
                  <span className={`material-symbols-outlined text-3xl mb-2 block ${isActive ? 'filled' : ''}`}
                    style={{ color: isActive ? 'var(--ac)' : 'var(--dim)' }}>
                    {icons[s.id] || "music_note"}
                  </span>
                  <span className="text-sm font-semibold"
                    style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}>{s.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
