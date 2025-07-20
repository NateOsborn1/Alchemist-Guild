import React, { useState, useEffect, useMemo } from 'react';
import { FaChevronDown, FaChevronUp, FaCoins, FaUserFriends, FaStar, FaMapMarkedAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Helper to format gold history for chart
function getGoldHistoryData(goldHistory, range = 'minute') {
  // Group by minute (minute), hour (hour), or day (day)
  const now = Date.now();
  let cutoff;
  let groupBy;
  if (range === 'minute') {
    cutoff = now - 60 * 60 * 1000; // last 60 minutes
    groupBy = 60 * 1000; // 1 minute
  } else if (range === 'hour') {
    cutoff = now - 24 * 60 * 60 * 1000; // last 24 hours
    groupBy = 60 * 60 * 1000; // 1 hour
  } else {
    cutoff = now - 30 * 24 * 60 * 60 * 1000; // last 30 days
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
    time: new Date(b.timestamp).toLocaleString([], range === 'minute' ? { hour: '2-digit', minute: '2-digit' } : range === 'hour' ? { month: 'short', day: 'numeric', hour: '2-digit' } : { month: 'short', day: 'numeric' })
  }));
}

export default function StatsBar({ 
  inventory, 
  gameState, 
  adventurers, 
  zones, 
  purchasedUpgrades, 
  onOpenSaveManager,
  // New props for adventurer pool system
  adventurerPool = [],
  populationState = 'Stable',
  refreshesUsed = 0,
  onPoolRefresh = () => {},
  // Game log system
  gameLog = []
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('log'); // Default to log tab
  const [graphRange, setGraphRange] = useState('minute');
  const [graphAnimated, setGraphAnimated] = useState(false); // Track if graph has been animated
  const goldHistory = gameState.goldHistory || [];
  
  // Memoize chart data to prevent unnecessary re-renders and animations
  const chartData = useMemo(() => getGoldHistoryData(goldHistory, graphRange), [goldHistory, graphRange]);

  // Reset animation when tab changes to graph
  useEffect(() => {
    if (tab === 'graph' && !graphAnimated) {
      setGraphAnimated(true);
    } else if (tab !== 'graph') {
      setGraphAnimated(false);
    }
  }, [tab, graphAnimated]);

  // Stats for overview
  const totalAdventurers = adventurers.length;
  const availableAdventurers = adventurerPool.length; // Use pool instead of filtering adventurers
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

  // Color coding for population status
  const getPopulationColor = (state) => {
    if (state === 'Struggling') return '#ff6b6b'; // Red for struggling
    if (state === 'Booming') return '#ffd700'; // Gold for booming
    return '#4ecdc4'; // Default for stable
  };

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
          <span title="Available Adventurers" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FaUserFriends color="#4ecdc4" /> 
            <span>{availableAdventurers}</span>
          </span>
          <span title="Active Missions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaMapMarkedAlt color="#a855f7" /> {onMissionAdventurers}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenSaveManager && onOpenSaveManager(); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffd700',
              fontSize: 20,
              cursor: 'pointer',
              padding: 0,
              marginRight: 2
            }}
            title="Save/Load"
          >
            <img src="/save-icon.svg" alt="Save" style={{ width: 20, height: 20, filter: 'brightness(0) saturate(100%) invert(67%) sepia(15%) saturate(638%) hue-rotate(358deg) brightness(91%) contrast(87%)' }} />
          </button>
          {expanded ? <FaChevronUp color="#ffd700" /> : <FaChevronDown color="#ffd700" />}
        </div>
      </div>
      {/* Expanded view */}
      {expanded && (
        <div style={{ background: '#1a120a', borderTop: '1px solid #8b5a2b', padding: 12 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setTab('log')} style={{ fontWeight: tab === 'log' ? 'bold' : 'normal', background: 'none', border: 'none', color: tab === 'log' ? '#ffd700' : '#f4e4bc', fontSize: 16, cursor: 'pointer' }}>Log</button>
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
                <b>Population:</b> <span style={{ color: getPopulationColor(populationState) }}>{availableAdventurers}</span> 
                <span style={{ color: getPopulationColor(populationState), marginLeft: 8 }}>({populationState})</span>
              </div>
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); onPoolRefresh(); }}
                  disabled={refreshesUsed >= 2}
                  style={{
                    background: refreshesUsed >= 2 ? '#4a2c1a' : '#8b5a2b',
                    color: refreshesUsed >= 2 ? '#8b5a2b' : '#f4e4bc',
                    border: '1px solid #d4af37',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: refreshesUsed >= 2 ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}
                  title={refreshesUsed >= 2 ? 'No refreshes remaining' : 'Refresh adventurer pool'}
                >
                  Refresh ({refreshesUsed}/2)
                </button>
              </div>
            </div>
          )}
          {tab === 'log' && (
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #8b5a2b', borderRadius: 6, padding: 8 }}>
              {gameLog.length === 0 ? (
                <div style={{ color: '#8b5a2b', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
                  No events logged yet
                </div>
              ) : (
                gameLog.map(entry => {
                  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const getTypeColor = (type) => {
                    switch (type) {
                      case 'success': return '#4ecdc4';
                      case 'error': return '#ff6b6b';
                      case 'warning': return '#ffd700';
                      default: return '#f4e4bc';
                    }
                  };
                  return (
                    <div key={entry.id} style={{ 
                      marginBottom: 6, 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      background: 'rgba(44, 24, 16, 0.6)',
                      borderLeft: `3px solid ${getTypeColor(entry.type)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: getTypeColor(entry.type), fontSize: 14 }}>{entry.message}</span>
                        <span style={{ color: '#8b5a2b', fontSize: 12 }}>{time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          {tab === 'graph' && (
            <div style={{ width: '100%', height: 260, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setGraphRange('minute')} style={{ fontWeight: graphRange === 'minute' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'minute' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Minute</button>
                <button onClick={() => setGraphRange('hour')} style={{ fontWeight: graphRange === 'hour' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'hour' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Hour</button>
                <button onClick={() => setGraphRange('day')} style={{ fontWeight: graphRange === 'day' ? 'bold' : 'normal', background: 'none', border: 'none', color: graphRange === 'day' ? '#ffd700' : '#f4e4bc', cursor: 'pointer' }}>Day</button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8b5a2b33" />
                  <XAxis dataKey="time" tick={{ fill: '#ffd700', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#ffd700', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#2c1810', border: '1px solid #ffd700', color: '#ffd700' }} />
                  <Line 
                    type="monotone" 
                    dataKey="earned" 
                    stroke="#4ecdc4" 
                    strokeWidth={2} 
                    name="Earned"
                    animationDuration={graphAnimated ? 1000 : 0}
                    animationBegin={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#ff6b6b" 
                    strokeWidth={2} 
                    name="Spent"
                    animationDuration={graphAnimated ? 1000 : 0}
                    animationBegin={200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 