import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ = [
  { cat: "Getting Started", icon: "rocket_launch", items: [
    { q: "What is Cognit?", a: "Cognit is a premium student productivity platform that combines study tracking, music, pomodoro timers, notes, deadlines, and gamification into one beautiful experience." },
    { q: "How do I track my study time?", a: "Use the Pomodoro timer on the Pomodoro page, or start the study timer from the Music player. Your study sessions are automatically logged and visible in Analytics." },
    { q: "Is my data synced across devices?", a: "Yes! All your data is stored securely on our servers and syncs across any device where you're logged in." },
  ]},
  { cat: "Music & Focus", icon: "headphones", items: [
    { q: "How does the music player work?", a: "Navigate to the Music page to choose from curated playlists or paste your own YouTube/SoundCloud URL. The persistent mini-player stays at the bottom of your screen." },
    { q: "What are ambient sounds?", a: "Ambient sounds (rain, white noise, binaural beats, etc.) are generated in-browser using Web Audio API. They layer on top of music for enhanced focus." },
    { q: "Can I create a queue?", a: "Yes! Click the 'Queue' button on any playlist card to add it to your queue. Tracks play sequentially when the current one ends." },
  ]},
  { cat: "Productivity", icon: "task_alt", items: [
    { q: "How does the XP system work?", a: "You earn XP for completing tasks, study sessions, maintaining streaks, and hitting daily goals. XP unlocks new levels and badges." },
    { q: "What are badges?", a: "Badges are achievement rewards for milestones like study streaks, total hours studied, and feature usage. Check the Achievements page to see all available badges." },
    { q: "How do deadlines work?", a: "Add deadlines with due dates and priorities. They appear on your dashboard with urgency indicators and countdown timers." },
  ]},
  { cat: "Account & Settings", icon: "settings", items: [
    { q: "How do I change themes?", a: "Go to Settings > Appearance to choose from 5 premium themes (Dark, Midnight, Forest, Ocean, Candy) and 8 accent colors. Changes apply instantly." },
    { q: "Can I export my data?", a: "Yes, go to Settings > Account > Export Data to download all your information as a JSON file." },
    { q: "How do I delete my account?", a: "Go to Settings > Account > Danger Zone. You'll need to confirm with your PIN before the account is permanently deleted." },
    { q: "How do I reset my password?", a: "Go to Settings > Account > Change Password. Enter your current password and a new one (minimum 6 characters)." },
  ]},
  { cat: "Keyboard Shortcuts", icon: "keyboard", items: [
    { q: "What shortcuts are available?", a: "Press Ctrl+K to open the Command Palette, or press ? to see all keyboard shortcuts. Common ones: Ctrl+K (Command Palette), / (Search), Ctrl+P (Pomodoro)." },
    { q: "How do I use the Command Palette?", a: "Press Ctrl+K to open it, then type to search for any page, action, or setting. Press Enter to navigate or execute." },
  ]},
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <motion.div layout className="rounded-xl overflow-hidden transition-all"
      style={{ border: '1px solid var(--border)', background: isOpen ? 'color-mix(in srgb, var(--ac) 3%, transparent)' : 'var(--card)' }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[.03]">
        <span className="text-sm font-semibold pr-4" style={{ color: isOpen ? 'var(--ac)' : 'var(--text)' }}>{item.q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
          className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: 'var(--muted)' }}>
          expand_more
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [activeCat, setActiveCat] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim() && !activeCat) return FAQ;
    return FAQ.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        (!search.trim() || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())) &&
        (!activeCat || activeCat === cat.cat)
      )
    })).filter(cat => cat.items.length > 0);
  }, [search, activeCat]);

  const totalResults = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="page-container max-w-4xl mx-auto">
      {/* Header */}
      <motion.div className="mb-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-3xl grad-text filled">help</span>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight">Help Center</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Find answers to common questions</p>
      </motion.div>

      {/* Search */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--dim)' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search help topics..."
            className="input-field pl-12 py-4 text-base" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: 'var(--dim)' }}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        {search && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs mt-2 ml-1" style={{ color: 'var(--muted)' }}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </motion.div>
        )}
      </motion.div>

      {/* Category Filters */}
      <motion.div className="flex flex-wrap gap-2 mb-8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <button onClick={() => setActiveCat(null)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={!activeCat ? {
            background: 'color-mix(in srgb, var(--ac) 12%, transparent)',
            color: 'var(--ac)',
            border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)',
          } : {
            background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)',
          }}>
          All
        </button>
        {FAQ.map(cat => (
          <button key={cat.cat} onClick={() => setActiveCat(activeCat === cat.cat ? null : cat.cat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={activeCat === cat.cat ? {
              background: 'color-mix(in srgb, var(--ac) 12%, transparent)',
              color: 'var(--ac)',
              border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)',
            } : {
              background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)',
            }}>
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            {cat.cat}
          </button>
        ))}
      </motion.div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {filtered.map((cat, ci) => (
          <motion.div key={cat.cat}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.05 }}>
            <div className="flex items-center gap-2 mb-3 ml-1">
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--ac)' }}>{cat.icon}</span>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{cat.cat}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card2)', color: 'var(--dim)' }}>{cat.items.length}</span>
            </div>
            <div className="space-y-2">
              {cat.items.map((item, ii) => {
                const id = `${ci}-${ii}`;
                return (
                  <FAQItem key={id} item={item} isOpen={openId === id}
                    onToggle={() => setOpenId(openId === id ? null : id)} />
                );
              })}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--dim)' }}>search_off</span>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No results for "{search}"</p>
            <p className="text-xs mt-1" style={{ color: 'var(--dim)' }}>Try a different search term</p>
          </motion.div>
        )}
      </div>

      {/* Contact */}
      <motion.div className="mt-12 p-6 rounded-2xl text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ background: 'color-mix(in srgb, var(--ac) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 15%, transparent)' }}>
        <span className="material-symbols-outlined text-3xl mb-3 block" style={{ color: 'var(--ac)' }}>support_agent</span>
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Still need help?</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Reach out to us and we'll get back to you soon</p>
        <a href="mailto:support@cognit.app"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: 'var(--ac)', color: 'var(--bg)', boxShadow: '0 4px 14px color-mix(in srgb, var(--ac) 30%, transparent)' }}>
          <span className="material-symbols-outlined text-base">mail</span>
          Contact Support
        </a>
      </motion.div>
    </div>
  );
}
