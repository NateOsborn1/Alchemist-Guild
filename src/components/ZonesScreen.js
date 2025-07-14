import React from 'react';

export default function ZonesScreen({ zones }) {
  return (
    <div>
      <h2>Zones</h2>
      {zones.map(zone => (
        <div key={zone.id} style={{
          border: '1px solid #8b5a2b', borderRadius: 8, margin: 8, padding: 8, background: '#2c1810'
        }}>
          <h3>{zone.name}</h3>
          <div>
            <b>Assigned Adventurers:</b>
            {zone.assigned && zone.assigned.length > 0 ? (
              <ul>
                {zone.assigned.map(adv => (
                  <li key={adv.id}>{adv.name} (Wealth: {adv.wealth}, Exp: {adv.experience})</li>
                ))}
              </ul>
            ) : (
              <span> None</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
