// src/components/StatsScreen.js
import React from 'react';

export default function StatsScreen({ stats }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Stats & Progress</h2>
      <div>
        <b>Reputation History:</b>
        <ul>
          {stats.reputationHistory.map((rep, idx) => (
            <li key={idx}>Day {rep.day}: {rep.value}</li>
          ))}
        </ul>
      </div>
      <div>
        <b>Adventurer Missions:</b>
        <ul>
          <li>Successes: {stats.missions.success}</li>
          <li>Deaths: {stats.missions.death}</li>
        </ul>
      </div>
      <div>
        <b>Total Gold Earned:</b> {stats.goldEarned}
      </div>
      {/* Add more stats as needed */}
    </div>
  );
}
