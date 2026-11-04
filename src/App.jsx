import { useEffect, useReducer, useRef, useState } from 'react'
import Board from './components/Board.jsx'
import Panel from './components/Panel.jsx'
import Holdings, { TileDetail } from './components/Holdings.jsx'
import Setup from './components/Setup.jsx'
import { createGame, reducer, money, netWorth } from './game/engine.js'
import { nextAiAction } from './game/ai.js'
import { BOARD, PLAYER_COLORS } from './data/board.js'

export default function App() {
  const [game, dispatch] = useReducer(reducer, null)
  const [selected, setSelected] = useState(null)
  const started = useRef(false)

  const start = (setup) => {
    started.current = true
    dispatch({ type: 'INIT', state: createGame(setup) })
  }

  // movement animation: one tile at a time, then settle on the square
  useEffect(() => {
    if (!game) return
    if (game.phase === 'walk') {
      const t = setTimeout(() => dispatch({ type: 'STEP' }), 150)
      return () => clearTimeout(t)
    }
    if (game.phase === 'resolve') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE' }), 260)
      return () => clearTimeout(t)
    }
  }, [game])

  // computer players take their own turns
  useEffect(() => {
    if (!game || game.winner !== null) return
    const action = nextAiAction(game)
    if (!action) return
    const t = setTimeout(() => dispatch(action), action.type === 'BUILD' ? 420 : 780)
    return () => clearTimeout(t)
  }, [game])

  if (!game) return <Setup onStart={start} />

  const card = game.card
  const winner = game.winner !== null ? game.players[game.winner] : null
  const ranked = [...game.players].sort((a, b) => netWorth(game, b) - netWorth(game, a))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span>🪁</span>
          <h2>Amdavad Business</h2>
        </div>
        <div className="scores">
          {ranked.map((p) => (
            <span key={p.id} className={'score' + (p.out ? ' out' : '')}>
              <i style={{ background: PLAYER_COLORS[p.color].hex }} />
              {p.name} <b>{money(netWorth(game, p))}</b>
            </span>
          ))}
        </div>
        <button className="btn ghost small" onClick={() => { started.current = false; dispatch({ type: 'INIT', state: null }) }}>
          New game
        </button>
      </header>

      <main className="layout">
        <Board state={game} onSelect={setSelected} selected={selected} />
        <div className="rail">
          <Panel state={game} dispatch={dispatch} />
          <TileDetail state={game} index={selected} onClose={() => setSelected(null)} />
          <Holdings state={game} dispatch={dispatch} />
        </div>
      </main>

      {card && (
        <div className="modal-wrap">
          <div className={'card-draw ' + card.deck}>
            <span className="card-kind">{card.deck === 'chance' ? 'Nasib' : 'Mandli Fund'}</span>
            <p>{card.text}</p>
            <button className="btn primary" onClick={() => dispatch({ type: 'CARD_OK' })}
              disabled={game.players[game.turn].ai}>
              {game.players[game.turn].ai ? 'Seth is reading…' : 'Theek che'}
            </button>
          </div>
        </div>
      )}

      {winner && (
        <div className="modal-wrap">
          <div className="winner">
            <span>🏆</span>
            <h2>{winner.name} owns Amdavad</h2>
            <p>Final worth {money(netWorth(game, winner))}. Everyone else is divaalia.</p>
            <button className="btn primary" onClick={() => dispatch({ type: 'INIT', state: null })}>Play again</button>
          </div>
        </div>
      )}
    </div>
  )
}
