import { BOARD, PLAYER_COLORS, JAIL_FINE } from '../data/board.js'
import { money, netWorth, owned } from '../game/engine.js'

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
}

export function Die({ value, rolling }) {
  const on = PIPS[value] || []
  return (
    <div className={'die' + (rolling ? ' die-rolling' : '')}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={on.includes(i) ? 'pip on' : 'pip'} />
      ))}
    </div>
  )
}

function PlayerCard({ state, p, isTurn }) {
  const c = PLAYER_COLORS[p.color]
  const props = owned(state, p.id)
  return (
    <div className={'pcard' + (isTurn ? ' pcard-turn' : '') + (p.out ? ' pcard-out' : '')}
      style={{ '--c': c.hex, '--cd': c.deep }}>
      <div className="pcard-top">
        <span className="chip" style={{ background: `linear-gradient(160deg, ${c.hex}, ${c.deep})` }}>
          {p.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="pcard-id">
          <strong>{p.name}</strong>
          <small>{p.ai ? 'Computer seth' : 'You'}{p.jail ? ' · in chowki' : ''}</small>
        </div>
        <span className="pcard-cash">{money(p.cash)}</span>
      </div>
      <div className="pcard-meta">
        <span>{props.length} properties</span>
        <span>{p.jailCards > 0 ? `${p.jailCards} mafi card` : ''}</span>
        <span>worth {money(netWorth(state, p))}</span>
      </div>
      <div className="pcard-strip">
        {props.map((i) => (
          <i key={i} title={BOARD[i].name}
            style={{ background: BOARD[i].group ? undefined : '#8b93a7' }}
            className={BOARD[i].group ? 'g-' + BOARD[i].group : 'g-util'} />
        ))}
      </div>
    </div>
  )
}

export default function Panel({ state, dispatch, onBuyPrompt }) {
  const p = state.players[state.turn]
  const tile = BOARD[p.pos]
  const human = !p.ai
  const rolling = state.phase === 'walk'

  return (
    <aside className="panel">
      <div className="players">
        {state.players.map((q) => (
          <PlayerCard key={q.id} state={state} p={q} isTurn={q.id === state.turn} />
        ))}
      </div>

      <div className="turnbox">
        <div className="turnbox-head">
          <span className="dot" style={{ background: PLAYER_COLORS[p.color].hex }} />
          <strong>{p.name}</strong>
          <span className="turnbox-tile">{tile.name}</span>
        </div>

        <div className="dice-row">
          <Die value={state.dice ? state.dice[0] : 1} rolling={rolling} />
          <Die value={state.dice ? state.dice[1] : 1} rolling={rolling} />
          <span className="dice-total">
            {state.dice ? state.dice[0] + state.dice[1] : '—'}
          </span>
        </div>

        <div className="actions">
          {state.phase === 'roll' && (
            <>
              {p.jail && p.jailCards > 0 && (
                <button className="btn ghost" onClick={() => dispatch({ type: 'USE_JAIL_CARD' })} disabled={!human}>
                  Use mafi card
                </button>
              )}
              {p.jail && (
                <button className="btn ghost" onClick={() => dispatch({ type: 'PAY_FINE' })} disabled={!human || p.cash < JAIL_FINE}>
                  Pay {money(JAIL_FINE)} fine
                </button>
              )}
              <button className="btn primary" onClick={() => dispatch({ type: 'ROLL' })} disabled={!human}>
                {p.ai ? 'Seth is thinking…' : 'Roll the dice'}
              </button>
            </>
          )}

          {state.phase === 'buy' && (
            <>
              <button className="btn primary" onClick={() => dispatch({ type: 'BUY' })} disabled={!human}>
                Buy {tile.short} · {money(tile.price)}
              </button>
              <button className="btn ghost" onClick={() => dispatch({ type: 'PASS' })} disabled={!human}>
                Jaane do
              </button>
            </>
          )}

          {state.phase === 'end' && (
            <button className="btn primary" onClick={() => dispatch({ type: 'END_TURN' })} disabled={!human}>
              {state.dice && state.dice[0] === state.dice[1] && !p.jail ? 'Roll again (double!)' : 'End turn'}
            </button>
          )}

          {(state.phase === 'walk' || state.phase === 'resolve') && (
            <button className="btn primary" disabled>Moving…</button>
          )}
        </div>
        {onBuyPrompt}
      </div>

      <div className="log">
        <h3>Khabar</h3>
        <ul>
          {state.log.map((l) => (
            <li key={l.id} className={'tone-' + l.tone}>{l.text}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
