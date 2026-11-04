import { useState } from 'react'
import { PLAYER_COLORS, START_CASH } from '../data/board.js'
import { money } from '../game/engine.js'

export default function Setup({ onStart }) {
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(['Dhairya', 'Seth Bhavesh', 'Jignesh', 'Falguni'])
  const [humans, setHumans] = useState([true, false, false, false])

  const setName = (i, v) => setNames(names.map((n, k) => (k === i ? v : n)))
  const toggle = (i) => setHumans(humans.map((h, k) => (k === i ? !h : h)))

  return (
    <div className="setup">
      <div className="setup-card">
        <span className="setup-kite">🪁</span>
        <h1>Amdavad <span>Business</span></h1>
        <p className="setup-sub">
          The property game we actually played — pols, bhaadu, chowki and one
          cousin who always lands on Manek Chowk.
        </p>

        <div className="setup-field">
          <label>How many sethiya?</label>
          <div className="seg">
            {[2, 3, 4].map((n) => (
              <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>

        <div className="setup-list">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="setup-row" style={{ '--c': PLAYER_COLORS[i].hex }}>
              <span className="chip" style={{ background: `linear-gradient(160deg, ${PLAYER_COLORS[i].hex}, ${PLAYER_COLORS[i].deep})` }}>
                {(names[i] || '?').slice(0, 1).toUpperCase()}
              </span>
              <input value={names[i]} maxLength={14} onChange={(e) => setName(i, e.target.value)} />
              <button className={'who' + (humans[i] ? ' human' : '')} onClick={() => toggle(i)}>
                {humans[i] ? 'Human' : 'Computer'}
              </button>
            </div>
          ))}
        </div>

        <ul className="setup-rules">
          <li>Everyone starts with {money(START_CASH)} and ₹40,000 every time they cross START.</li>
          <li>Own a whole colour set to build houses, then a hotel. Rent goes up hard.</li>
          <li>Three doubles in a row and you are inside the Police Chowki.</li>
        </ul>

        <button className="btn primary big" onClick={() => onStart(
          Array.from({ length: count }).map((_, i) => ({
            name: (names[i] || PLAYER_COLORS[i].name).trim() || PLAYER_COLORS[i].name,
            ai: !humans[i],
          }))
        )}>Shuru karo</button>
      </div>
    </div>
  )
}
