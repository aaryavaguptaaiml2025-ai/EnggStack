import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Card, Btn, Toast, Spinner, Modal, Badge } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { getLevel, LEVEL_NAMES, useStats } from "../context/StatsContext";

export default function FriendsPage() {
  const { stats } = useStats();
  const [tab, setTab]           = useState("friends"); // friends | requests | search
  const [friends, setFriends]   = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQ, setSearchQ]   = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [viewStats, setViewStats] = useState(null); // friend stats modal
  const [statsData, setStatsData] = useState(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r] = await Promise.all([api.getFriends(), api.getFriendRequests()]);
      setFriends(f);
      setRequests(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const search = async () => {
    if (searchQ.trim().length < 2) return;
    setSearching(true);
    try {
      const r = await api.searchUsers(searchQ.trim());
      setResults(r);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const sendRequest = async (userId) => {
    try {
      await api.sendFriendRequest(userId);
      sfx.success();
      setToast({ msg: "Friend request sent!", color: "#00C896" });
      setResults(prev => prev.filter(u => u.id !== userId));
      loadFriends();
    } catch (e) {
      sfx.error();
      setToast({ msg: e.message, color: "#f87171" });
    }
  };

  const respond = async (reqId, action) => {
    try {
      await api.respondRequest(reqId, action);
      sfx.success();
      setToast({ msg: action === "accept" ? "Friend added!" : "Request declined", color: "#00C896" });
      loadFriends();
    } catch (e) { sfx.error(); setToast({ msg: e.message, color: "#f87171" }); }
  };

  const removeFriend = async (id) => {
    try {
      await api.removeFriend(id);
      sfx.click();
      setToast({ msg: "Friend removed", color: "#f97316" });
      loadFriends();
    } catch (e) { sfx.error(); }
  };

  const viewFriendStats = async (friend) => {
    setViewStats(friend);
    try {
      const data = await api.getFriendStats(friend.id);
      setStatsData(data.stats || {});
    } catch (e) {
      setStatsData({});
      setToast({ msg: "Could not load stats", color: "#f87171" });
    }
  };

  const TABS = [
    { id: "friends", label: "Friends", icon: "group", count: friends.length },
    { id: "requests", label: "Requests", icon: "person_add", count: requests.incoming?.length || 0 },
    { id: "search", label: "Find People", icon: "search" },
  ];

  const Avatar = ({ user, size = 10 }) => (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-white/5 flex-shrink-0
      flex items-center justify-center border-2 border-white/10`}
      style={{ width: size * 4, height: size * 4 }}>
      {user.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
        : <span className="text-sm font-bold text-on-surface">
            {user.name?.slice(0,2).toUpperCase() || "?"}
          </span>
      }
    </div>
  );

  return (
    <div className="page-container max-w-3xl">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00C896] text-2xl">group</span>
          Friends
        </h1>
        <p className="text-xs text-muted mt-1">Connect with study buddies and compare progress</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); sfx.click(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold
              transition-all duration-200"
            style={{
              background: tab === t.id ? "rgba(0,200,150,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${tab === t.id ? "rgba(0,200,150,0.2)" : "rgba(255,255,255,0.05)"}`,
              color: tab === t.id ? "#00C896" : "#6b7280",
            }}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className="bg-[#00C896]/15 text-[#00C896] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* FRIENDS LIST */}
      {tab === "friends" && (
        <div>
          {loading ? (
            <div className="text-center py-20"><Spinner /></div>
          ) : friends.length === 0 ? (
            <Card className="text-center py-16">
              <span className="material-symbols-outlined text-dim text-5xl mb-4 block">group_add</span>
              <div className="text-sm text-muted mb-4">No friends yet. Search and add people!</div>
              <Btn color="#00C896" onClick={() => setTab("search")}>
                <span className="material-symbols-outlined text-base">search</span> Find People
              </Btn>
            </Card>
          ) : (
            <div className="space-y-3">
              {friends.map(f => {
                const lv = getLevel(f.xp || 0);
                return (
                  <div key={f.id} className="glass-card p-4 flex items-center gap-4 fade-up
                    hover:bg-white/[.06] transition-all duration-200">
                    <Avatar user={f} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-on-surface">{f.name}</div>
                      <div className="text-[11px] text-muted">@{f.username || "—"}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-[#8b5cf6] font-semibold">
                          Lv.{lv + 1} {LEVEL_NAMES[lv]}
                        </span>
                        <span className="text-[10px] text-[#f97316] font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px] filled">local_fire_department</span>
                          {f.streak || 0}d
                        </span>
                        <span className="text-[10px] text-[#3b82f6] font-semibold">
                          {Math.floor((f.totalMins || 0) / 60)}h studied
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => viewFriendStats(f)}
                        className="p-2 text-dim hover:text-[#3b82f6] hover:bg-white/5
                          rounded-xl transition-all duration-200" title="View stats">
                        <span className="material-symbols-outlined text-lg">analytics</span>
                      </button>
                      <button onClick={() => removeFriend(f.id)}
                        className="p-2 text-dim hover:text-[#f87171] hover:bg-white/5
                          rounded-xl transition-all duration-200" title="Remove friend">
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REQUESTS */}
      {tab === "requests" && (
        <div className="space-y-6">
          {/* Incoming */}
          <div>
            <div className="label-text mb-3 ml-1">
              Incoming ({requests.incoming?.length || 0})
            </div>
            {(requests.incoming?.length || 0) === 0 ? (
              <Card className="text-center py-8">
                <span className="material-symbols-outlined text-dim text-3xl mb-2 block">inbox</span>
                <div className="text-xs text-muted">No pending requests</div>
              </Card>
            ) : (
              <div className="space-y-2">
                {requests.incoming.map(r => (
                  <div key={r.id} className="glass-card p-4 flex items-center gap-4 fade-up">
                    <Avatar user={r.user} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-on-surface">{r.user.name}</div>
                      <div className="text-[11px] text-muted">@{r.user.username || "—"}</div>
                    </div>
                    <div className="flex gap-2">
                      <Btn color="#00C896" size="sm" onClick={() => respond(r.id, "accept")}>Accept</Btn>
                      <Btn variant="outline" size="sm" onClick={() => respond(r.id, "reject")}>Decline</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          {(requests.outgoing?.length || 0) > 0 && (
            <div>
              <div className="label-text mb-3 ml-1">Sent ({requests.outgoing.length})</div>
              <div className="space-y-2">
                {requests.outgoing.map(r => (
                  <div key={r.id} className="glass-card p-4 flex items-center gap-4 opacity-60">
                    <Avatar user={r.user} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-on-surface">{r.user.name}</div>
                      <div className="text-[11px] text-muted">@{r.user.username || "—"}</div>
                    </div>
                    <Badge color="#f97316">Pending</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEARCH */}
      {tab === "search" && (
        <div>
          <Card className="mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                  text-dim text-base">search</span>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="Search by name, username, or email..."
                  className="input-field pl-10"/>
              </div>
              <Btn color="#00C896" onClick={search} disabled={searching}>
                {searching ? <Spinner size={14}/> : "Search"}
              </Btn>
            </div>
          </Card>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(u => {
                const isFriend = friends.some(f => f.id === u.id);
                const isPending = requests.outgoing?.some(r => r.user.id === u.id);
                return (
                  <div key={u.id} className="glass-card p-4 flex items-center gap-4 fade-up">
                    <Avatar user={u} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-on-surface">{u.name}</div>
                      <div className="text-[11px] text-muted">@{u.username || u.email}</div>
                    </div>
                    {isFriend ? (
                      <Badge color="#00C896">Friends</Badge>
                    ) : isPending ? (
                      <Badge color="#f97316">Pending</Badge>
                    ) : (
                      <Btn color="#00C896" size="sm" onClick={() => sendRequest(u.id)}>
                        <span className="material-symbols-outlined text-sm">person_add</span> Add
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchQ && results.length === 0 && !searching && (
            <Card className="text-center py-10">
              <span className="material-symbols-outlined text-dim text-3xl mb-2 block">person_search</span>
              <div className="text-xs text-muted">No users found for "{searchQ}"</div>
            </Card>
          )}
        </div>
      )}

      {/* Friend Stats & Comparison Modal */}
      {viewStats && (
        <Modal title={`${viewStats.name}'s Stats`} onClose={() => { setViewStats(null); setStatsData(null); }}>
          {!statsData ? (
            <div className="text-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="text-center">
                  <div className="text-xs text-dim mb-1">You</div>
                  <div className="text-xl font-bold text-[#00C896]">Lv.{getLevel(stats?.xp || 0) + 1}</div>
                  <div className="text-[10px] text-muted">{stats?.xp || 0} XP</div>
                </div>
                <div className="text-2xl font-bold text-dim">VS</div>
                <div className="text-center">
                  <div className="text-xs text-dim mb-1">{viewStats.name?.split(' ')[0] || "Friend"}</div>
                  <div className="text-xl font-bold text-[#8b5cf6]">Lv.{getLevel(statsData.xp || 0) + 1}</div>
                  <div className="text-[10px] text-muted">{statsData.xp || 0} XP</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: "Current Streak", y: stats?.streak || 0, f: statsData.streak || 0, color: "#f97316" },
                  { label: "Pomodoros Completed", y: stats?.pomodoros || 0, f: statsData.pomodoros || 0, color: "#f87171" },
                  { label: "Hours Studied", y: Math.floor((stats?.totalMins || 0) / 60), f: Math.floor((statsData.totalMins || 0) / 60), color: "#3b82f6" },
                ].map((s, i) => {
                  const max = Math.max(s.y, s.f, 1);
                  const yPct = (s.y / max) * 100;
                  const fPct = (s.f / max) * 100;
                  return (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold">{s.y}</span>
                        <span className="text-muted">{s.label}</span>
                        <span className="font-bold">{s.f}</span>
                      </div>
                      <div className="flex h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 bg-[#00C896] rounded-full opacity-80" style={{ width: `${yPct/2}%` }} />
                        <div className="absolute right-0 top-0 bottom-0 bg-[#8b5cf6] rounded-full opacity-80" style={{ width: `${fPct/2}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
