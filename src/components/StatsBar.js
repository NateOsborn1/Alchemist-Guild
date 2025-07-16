import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCoins, FaUserFriends, FaStar, FaMapMarkedAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Helper to format gold history for chart
function getGoldHistoryData(goldHistory, range = 'day') {
  // Group by hour (day), day (week), or day (month)
  const now = Date.now();
  let cutoff;
  let groupBy;
  if (range === 'day') {
    cutoff = now - 24 * 60 * 60 * 1000;
    groupBy = 60 * 60 * 1000; // 1 hour
  } else if (range === 'week') {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
    groupBy = 24 * 60 * 60 * 1000; // 1 day
  } else {
    cutoff = now - 30 * 24 * 60 * 60 * 1000;
    groupBy = 24 * 60 * 60 * 1000; // 1 day
  }
  const filtered = goldHistory.filter(e => e.timestamp >= cutoff);
  const buckets = {};
  filtered.forEach(e => {
    const bucket = Math.floor(e.timestamp / groupBy) * groupBy;
    if (!buckets[bucket]) buckets[bucket] = { timestamp: bucket, earned: 0, spent: 0 };
    if (e.amount > 0) buckets[bucket].earned += e.amount;
    else buckets[bucket].spent += Math.abs(e.amount);
  });
  // Sort by time
  return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp).map(b => ({
    ...b,
    time: new Date(b.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }));
}

export default function StatsBar({ inventory, gameState, adventurers, zones, purchasedUpgrades }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('overview');
  const [graphRange, setGraphRange] = useState('day');
  const goldHistory = gameState.goldHistory || [];
  const chartData = getGoldHistoryData(goldHistory, graphRange);

  // Stats for overview
  const totalAdventurers = adventurers.length;
  const availableAdventurers = adventurers.filter(a => a.status === 'available').length;
  const onMissionAdventurers = adventurers.filter(a => a.status === 'onMission').length;
  const assignedAdventurers = adventurers.filter(a => a.status === 'assigned').length;
  const totalMissions = gameState.adventurerStats.totalSent;
  const successfulMissions = gameState.adventurerStats.successfulMissions;
  const failedMissions = gameState.adventurerStats.deaths;
  const successRate = totalMissions > 0 ? Math.round((successfulMissions / totalMissions) * 100) : 0;
  const zonesRevealed = zones.filter(z => z.isRevealed).length;
  const totalZoneClears = gameState.zoneStats.totalClears;
  const totalZoneDeaths = gameState.zoneStats.totalDeaths;
  const upgradesPurchased = Object.values(purchasedUpgrades).reduce((total, category) => total + Object.values(category).filter(upg => upg.purchased).length, 0);
  const totalUpgrades = Object.values(purchasedUpgrades).reduce((total, category) => total + Object.values(category).length, 0);

  return (
    <div style={{
      background: '#2c1810',
      borderBottom: '2px solid #8b5a2b',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3001,
      width: '100%',
      boxShadow: '0 2px 8px #0004',
      minHeight: 56, // ensure enough height for touch
      padding: '8px 0', // vertical padding
    }}>
      {/* Collapsed bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span title="Gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCoins color="#ffd700" /> {inventory.gold}</span>
          <span title="Reputation" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaStar color="#d4af37" /> {gameState.reputation}</span>
          <span title="Population" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaUserFriends color="#4ecdc4" /> {gameState.population}</span>
          <span title="Active Missions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaMapMarkedAlt color="#a855f7" /> {onMissionAdventurers}</span>
        </div>
        <div style={{ marginLeft: 12 }}>
          {expanded ? <FaChevronUp color="#ffd700" /> : <FaChevronDown color="#ffd700" />}
        </div>
      </div>
      {/* Expanded view */}
      {expanded && (
        <div style={{ background: '#1a120a', borderTop: '1px solid #8b5a2b', padding: 12 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setTab('overview')} style={{ fontWeight: tab === 'overview' ? 'bold' : 'normal', background: 'none', border: 'none', color: tab === 'overview' ? '#ffd700' : '#f4e4bc', fontSize: 16, cursor: 'pointer' }}>Overview</button>
            <button onClick={() => setTab('graph')} style={{ fontWeight: tab === 'graph' ? 'bold' : 'normal', background: 'none', border: 'none', color: tab === 'graph' ? '#ffd700' : '#f4e4bc', fontSize: 16, cursor: 'pointer' }}>Cashflow</button>
          </div>
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              <div>
                <b>Adventurers:</b> {totalAdventurers} (Available: {availableAdventurers}, On Mission: {onMissionAdventurers}, Assigned: {assignedAdventurers})
              </div>
              <div>
                <b>Missions:</b> {totalMissions} (Success: {successfulMissions}, Deaths: {failedMissions}, Rate: {successRate}%)
              </div>
              <div>
                <b>Economy:</b> {inventory.gold}g (Reputation: {gameState.reputation})
              </div>
              <div>
                <b>Zones:</b> {zonesRevealed}/{zones.length} (Clears: {totalZoneClears}, Deaths: {totalZoneDeaths})
              </div>
              <div>
                <b>Upgrades:</b> {upgradesPurchased}/{totalUpgrades}
              </div>
              <div>
                <b>Population:</b> {gameState.population}
              </div>
            </div>
          )}
          {tab === 'graph' && (
            <div style={{ width: '100%', height: 260, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setGraphRange('day')} style={{ fontWeight: graphRange === 'day' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'day' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Day</button>
                <button onClick={() => setGraphRange('week')} style={{ fontWeight: graphRange === 'week' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'week' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Week</button>
                <button onClick={() => setGraphRange('month')} style={{ fontWeight: graphRange === 'month' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'month' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Month</button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8b5a2b33" />
                  <XAxis dataKey="time" tick={{ fill: '#ffd700', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#ffd700', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#2c1810', border: '1px solid #ffd700', color: '#ffd700' }} />
                  <Line type="monotone" dataKey="earned" stroke="#4ecdc4" strokeWidth={2} name="Earned" />
                  <Line type="monotone" dataKey="spent" stroke="#ff6b6b" strokeWidth={2} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 