import { BOARD, GROUPS, cellOf, sideOf, PLAYER_COLORS } from '../data/board.js'
import { money } from '../game/engine.js'

const ICONS = {
  start: '🏁', jail: '🚨', gotojail: '👮', parking: '🫖', tax: '🧾',
  chance: '🎲', chest: '🪙', station: '🚆', utility: '⚡',
}

function Houses({ n }) {
  if (!n) return null
  if (n === 5) return <span className="houses hotel">🏨</span>
  return (
    <span className="houses">
      {Array.from({ length: n }).map((_, i) => <i key={i} />)}
    </span>
  )
}

function Tile({ index, tile, st, onSelect, selected, active }) {
  const { col, row } = cellOf(index)
  const side = sideOf(index)
  const group = tile.group ? GROUPS[tile.group] : null
  const ownerColor = st && st.owner !== null ? PLAYER_COLORS[st.owner].hex : null
  const corner = index % 10 === 0
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      style={{ gridColumn: col, gridRow: row, '--own': ownerColor || 'transparent' }}
      className={[
        'tile', `side-${side}`, corner ? 'corner' : '',
        selected ? 'is-selected' : '', active ? 'is-active' : '',
        ownerColor ? 'is-owned' : '', st && st.mortgaged ? 'is-mortgaged' : '',
      ].join(' ')}
    >
      {group && <span className="band" style={{ background: group.color }} />}
      <span className="tile-body">
        {!group && <span className="tile-icon">{ICONS[tile.type]}</span>}
        <span className="tile-name">{tile.short}</span>
        {tile.price ? <span className="tile-price">{money(tile.price).replace('₹', '₹ ')}</span> : null}
        {tile.amount ? <span className="tile-price">{money(tile.amount)}</span> : null}
      </span>
      <Houses n={st ? st.houses : 0} />
      {ownerColor && <span className="owner-flag" />}
    </button>
  )
}

export default function Board({ state, onSelect, selected }) {
  const stacks = {}
  state.players.forEach((p) => {
    if (p.out) return
    stacks[p.pos] = stacks[p.pos] || []
    stacks[p.pos].push(p)
  })

  return (
    <div className="board-wrap">
      <div className="board">
        {BOARD.map((tile, i) => (
          <Tile
            key={i}
            index={i}
            tile={tile}
            st={state.tiles[i]}
            onSelect={onSelect}
            selected={selected === i}
            active={state.players[state.turn] && state.players[state.turn].pos === i}
          />
        ))}

        <div className="board-center">
          <div className="crest">
            <span className="crest-kite">🪁</span>
            <h1>Amdavad<span>Business</span></h1>
            <p className="crest-sub">Manek Chowk thi SG Highway sudhi</p>
            <div className="crest-rule" />
            <p className="crest-note">Roll the dice · buy the pol · collect the bhaadu</p>
          </div>
        </div>

        {state.players.map((p) => {
          if (p.out) return null
          const { col, row } = cellOf(p.pos)
          const peers = stacks[p.pos] || []
          const slot = peers.findIndex((q) => q.id === p.id)
          const n = Math.max(1, peers.length)
          const dx = (slot - (n - 1) / 2) * 42
          const c = PLAYER_COLORS[p.color]
          return (
            <span
              key={p.id}
              className={'token' + (state.turn === p.id ? ' token-turn' : '')}
              style={{
                left: `calc(${(col - 0.5) * (100 / 11)}% + ${dx}%)`,
                top: `${(row - 0.5) * (100 / 11)}%`,
                background: `radial-gradient(circle at 32% 28%, #fff6, transparent 60%), linear-gradient(160deg, ${c.hex}, ${c.deep})`,
              }}
              title={p.name}
            >
              {p.name.slice(0, 1).toUpperCase()}
            </span>
          )
        })}
      </div>
    </div>
  )
}
