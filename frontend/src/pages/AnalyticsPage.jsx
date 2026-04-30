import { useState, useEffect } from "react";
import { useStats, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Heatmap } from "../components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COLORS = ["#00C896","#3b82f6","#fbbf24","#8b5cf6","#f87171","#f472b6","#34d399","#fb923c"];

export default function AnalyticsPage() {
  const { stats } = useStats();
  const [subjects, setSubjects] = useState([]);

  useEffect(()=>{ 
    api.getSubjects().then(setSubjects).catch(()=>{}); 
  },[]);

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
    </div>
  );
}
