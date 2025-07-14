import React from 'react';

// Compact mission card component
function ActiveMissionCard({ adventurer }) {
  // Calculate progress and time left
  const now = Date.now();
  const { mission } = adventurer;
  const total = mission ? (mission.returnTime - mission.startTime) : 1;
  const elapsed = mission ? Math.max(0, now - mission.startTime) : 0;
  const progress = Math.min(100, Math.round((elapsed / total) * 100));
  const timeLeft = mission ? Math.max(0, Math.ceil((mission.returnTime - now) / 60000)) : 0; // in minutes

  return (
    <div style={{
      background: 'rgba(44,24,16,0.7)',
      border: '1px solid #8b5a2b',
      borderRadius: 8,
      padding: 10,
      margin: '6px 0',
      minWidth: 220,
      maxWidth: 340,
      color: '#f4e4bc',
      fontSize: 14,
      boxShadow: '0 2px 8px #0004',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{adventurer.name}</span>
        <span className={`class-badge ${adventurer.class.toLowerCase()}`} style={{ fontSize: 12, background: '#8b5a2b', color: '#ffd700', borderRadius: 4, padding: '2px 6px' }}>{adventurer.class}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span>Success: <b style={{ color: '#4ecdc4' }}>{mission?.successChance || 0}%</b></span>
        <span style={{ marginLeft: 12 }}>Time left: <b>{timeLeft}m</b></span>
      </div>
      <div style={{ background: '#2c1810', borderRadius: 6, height: 8, margin: '6px 0', overflow: 'hidden' }}>
        <div style={{ background: '#ffd700', width: `${progress}%`, height: '100%' }} />
      </div>
      <div style={{ fontSize: 12, color: '#cd853f', marginTop: 2 }}>
        Loot: {adventurer.lootTable && adventurer.lootTable.slice(0,2).map((item, i) => (
          <span key={i} style={{ marginRight: 8 }}>{item.min}-{item.max}x {item.material}</span>
        ))}
      </div>
    </div>
  );
}

export default function ZonesScreen({ zones, adventurers }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Zones</h2>
      {zones.map(zone => {
        const missions = adventurers.filter(a => a.status === 'onMission' && a.zoneId === zone.id);
        return (
          <div key={zone.id} style={{
            border: '1px solid #8b5a2b', borderRadius: 8, margin: 8, padding: 8, background: '#2c1810', maxWidth: 500
          }}>
            <h3>{zone.name}</h3>
            <div style={{ color: '#cd853f', fontSize: 14, marginBottom: 4 }}>{zone.description}</div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Danger: <b style={{ color: '#ff6b6b' }}>{zone.dangerLevel}</b> / {zone.maxDanger}</div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Status: <b style={{ color: '#ffd700' }}>{zone.status}</b></div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Monsters: <span style={{ color: '#a855f7' }}>{zone.monsterTypes.join(', ')}</span></div>
            <div style={{ marginTop: 10 }}>
              <b>Active Missions:</b>
              {missions.length === 0 ? (
                <div style={{ color: '#8b5a2b', fontStyle: 'italic', marginTop: 4 }}>No active missions in this zone</div>
              ) : (
                missions.map(adv => <ActiveMissionCard key={adv.id} adventurer={adv} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
