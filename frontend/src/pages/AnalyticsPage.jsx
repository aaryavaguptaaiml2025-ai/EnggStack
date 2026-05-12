import { useState, useEffect } from "react";
import { useStats, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Heatmap } from "../components/ui";
import { Spinner } from "../components/ui";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COLORS = ["#00C896","#3b82f6","#fbbf24","#8b5cf6","#f87171","#f472b6","#34d399","#fb923c"];

export default function AnalyticsPage() {
  const { stats } = useStats();
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(()=>{ 
    api.getSubjects().then(setSubjects).catch(()=>{}); 
  },[]);

  useEffect(() => {
    if (activeTab === "reports") {
      setReportsLoading(true);
      api.getReports().then(setReports).catch(() => {}).finally(() => setReportsLoading(false));
    }
  }, [activeTab]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const report = await api.generateReport();
      setReports(prev => [report, ...prev]);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  // Weekly data mapping
  const wMins = stats.weeklyMins || [0,0,0,0,0,0,0];
  const weeklyData = DAYS.map((day, i) => ({
    name: day,
    minutes: wMins[i]
  }));

  // Study Distribution data
  const distributionData = subjects.length > 0 
    ? subjects.map(s => ({
        name: s.name,
        value: s.doneTopics || 1 // fallback for visualization if 0
      }))
    : [{ name: "No Data", value: 1 }];

  // Heatmap Data
  const heatmapData = typeof stats.heatmap === "object" ? stats.heatmap : {};

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl border border-white/10" style={{ background: "#1a2235", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          <p className="text-[11px] text-muted mb-1">{label}</p>
          <p className="text-sm font-bold text-white">{`${payload[0].value} mins`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-3xl grad-text">analytics</span>
            <h1 className="text-3xl font-extrabold grad-text tracking-tight">Analytics</h1>
          </div>
          <p className="text-muted text-sm">Your study insights</p>
        </div>
      </div>

      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 stagger">
        {[
          { label: "Total Study Time", value: `${Math.floor((stats.totalMins||0)/60)}h ${(stats.totalMins||0)%60}m`, icon: "schedule", color: "#3b82f6" },
          { label: "Sessions Completed", value: stats.pomodoros || 0, icon: "task_alt", color: "#8b5cf6" },
          { label: "Current Streak", value: `${stats.streak || 0} days`, icon: "local_fire_department", color: "#f97316" },
          { label: "Best Streak", value: `${stats.streak || 0} days`, icon: "emoji_events", color: "#fbbf24" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10" style={{ background: s.color }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text)] mb-0.5">{s.value}</div>
            <div className="label-text text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="glass-card p-6 md:col-span-2">
          <div className="text-sm font-bold text-[var(--text)] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--ac)] text-lg">bar_chart</span>
            Weekly Activity
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="transparent" tick={{ fill: "#6b7280", fontSize: 11 }} dy={10} />
                <YAxis stroke="transparent" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="minutes" fill="#00C896" opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 md:col-span-1">
          <div className="text-sm font-bold text-[var(--text)] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--clr-info)] text-lg">donut_large</span>
            Study Distribution
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="glass-card p-6 mb-8">
        <div className="text-sm font-bold text-[var(--text)] mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--clr-streak)] text-lg filled">local_fire_department</span>
          Activity Heatmap
        </div>
        <div className="text-xs text-muted mb-6">Your daily study consistency over the last year.</div>
        <Heatmap data={heatmapData} />
      </div>

      {/* Subject Breakdown */}
      <div className="glass-card p-6">
        <div className="text-sm font-bold text-[var(--text)] mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--clr-level)] text-lg">menu_book</span>
          Subject Breakdown
        </div>
        
        {subjects.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-dim text-4xl mb-3">auto_awesome_motion</span>
            <div className="text-muted text-sm">No subjects added yet</div>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((s, i) => {
              const pct = s.totalTopics > 0 ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={s._id} className="flex items-center gap-4">
                  <div className="w-1/4 min-w-[100px] text-sm font-medium text-[var(--text)] truncate">
                    {s.name}
                  </div>
                  <div className="flex-1">
                    <ProgressBar value={pct} max={100} color={color} height={6} glow />
                  </div>
                  <div className="w-12 text-right text-xs font-bold" style={{ color }}>
                    {pct}%
                  </div>
                  <div className="w-16 text-right text-xs text-muted">
                    {s.doneTopics}/{s.totalTopics}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs: Overview | Reports */}
      <div className="flex gap-2 mb-6 mt-8">
        {["overview", "reports"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
              ${activeTab === tab
                ? "bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6]"
                : "bg-white/5 border border-white/10 text-muted hover:bg-white/10"}`}
          >
            {tab === "overview" ? "📊 Overview" : "📋 Weekly Reports"}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[var(--text)]">AI Study Reports</h2>
            <button onClick={generateReport} disabled={generating}
              className="btn-outline px-4 py-2 text-xs flex items-center gap-2 font-bold">
              {generating ? <Spinner size={14} color="currentColor" /> : (
                <><span className="material-symbols-outlined text-sm">auto_awesome</span> Generate Now</>
              )}
            </button>
          </div>

          {reportsLoading ? (
            <div className="text-center py-12"><Spinner /></div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-dim mb-3 block">summarize</span>
              <div className="text-muted text-sm mb-4">No reports yet. Generate your first weekly study report!</div>
              <button onClick={generateReport} disabled={generating}
                className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl px-6 py-3 text-[#8b5cf6] text-sm font-bold hover:bg-[#8b5cf6]/20 transition-all duration-200">
                Generate Report
              </button>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((r, i) => (
                <motion.div key={r._id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-bold text-[var(--text)] mb-1">
                          Week of {new Date(r.weekStart).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — {new Date(r.weekEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="text-xs text-muted">{r.summary}</div>
                      </div>
                      <div className="text-[10px] text-dim">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Study Time", value: `${Math.round((r.totalMins || 0) / 60)}h`, icon: "schedule", color: "#3b82f6" },
                        { label: "Sessions", value: r.sessions, icon: "event", color: "#00C896" },
                        { label: "Streak", value: `${r.streakStatus}d`, icon: "local_fire_department", color: "#f97316" },
                        { label: "Deadlines", value: `${r.deadlinesDone}/${(r.deadlinesDone || 0) + (r.deadlinesMissed || 0)}`, icon: "check_circle", color: "#8b5cf6" },
                      ].map((s, j) => (
                        <div key={j} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                          <span className="material-symbols-outlined text-lg" style={{ color: s.color }}>{s.icon}</span>
                          <div className="text-base font-bold text-[var(--text)] mt-1">{s.value}</div>
                          <div className="text-[10px] text-muted">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* AI Recommendations */}
                    {r.aiRecommendations?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#8b5cf6] mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          AI Recommendations
                        </div>
                        {r.aiRecommendations.map((rec, k) => (
                          <div key={k} className="p-3 rounded-xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 text-xs text-[var(--text)] leading-relaxed">
                            {k + 1}. {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
