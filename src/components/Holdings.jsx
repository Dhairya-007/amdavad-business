import { BOARD, GROUPS, PLAYER_COLORS, groupTiles } from '../data/board.js'
import { money, canBuild, canSellHouse, hasFullGroup, owned, rentFor } from '../game/engine.js'

export function TileDetail({ state, index, onClose }) {
  if (index === null || index === undefined) return null
  const tile = BOARD[index]
  const st = state.tiles[index]
  const group = tile.group ? GROUPS[tile.group] : null
  return (
    <div className="detail">
      <div className="detail-head" style={{ background: group ? group.color : '#2a2f45' }}>
        <span>{tile.name}</span>
        <button type="button" onClick={onClose} aria-label="close">✕</button>
      </div>
      <div className="detail-body">
        {group && <p className="detail-group">{group.label}</p>}
        {!tile.price && <p className="detail-note">{tile.note || tile.name}</p>}
        {tile.amount ? <p className="detail-note">Pay {money(tile.amount)} on landing</p> : null}
        {tile.price && (
          <>
            <div className="detail-row"><span>Price</span><b>{money(tile.price)}</b></div>
            {tile.type === 'property' && (
              <>
                {['Bare plot', '1 house', '2 houses', '3 houses', '4 houses', 'Hotel'].map((label, i) => (
                  <div key={label} className={'detail-row' + (st.houses === i ? ' now' : '')}>
                    <span>{label}</span><b>{money(tile.rents[i])}</b>
                  </div>
                ))}
                <div className="detail-row"><span>House cost</span><b>{money(group.house)}</b></div>
                <div className="detail-row"><span>Full set rent</span><b>×2 bare</b></div>
              </>
            )}
            {tile.type === 'station' && tile.rents.map((r, i) => (
              <div key={i} className="detail-row"><span>{i + 1} station{i ? 's' : ''}</span><b>{money(r)}</b></div>
            ))}
            {tile.type === 'utility' && (
              <>
                <div className="detail-row"><span>One owned</span><b>4,000 × dice</b></div>
                <div className="detail-row"><span>Both owned</span><b>10,000 × dice</b></div>
              </>
            )}
            <div className="detail-row owner">
              <span>Owner</span>
              <b style={{ color: st.owner !== null ? PLAYER_COLORS[st.owner].hex : '#9aa3b8' }}>
                {st.owner !== null ? state.players[st.owner].name : 'Bank'}
              </b>
            </div>
            {st.owner !== null && (
              <div className="detail-row"><span>Rent right now</span><b>{money(rentFor(state, index, 7))}</b></div>
            )}
            {st.mortgaged && <p className="detail-mort">Mortgaged — no rent collected</p>}
          </>
        )}
      </div>
    </div>
  )
}

export default function Holdings({ state, dispatch }) {
  const p = state.players[state.turn]
  const mine = owned(state, p.id)
  const groups = [...new Set(mine.map((i) => BOARD[i].group).filter(Boolean))]
  const others = mine.filter((i) => !BOARD[i].group)

  return (
    <div className="holdings">
      <h3>{p.name}'s dhandho</h3>
      {mine.length === 0 && <p className="empty">Nothing yet. Buy something before the board runs out.</p>}

      {groups.map((g) => {
        const full = hasFullGroup(state, p.id, g)
        return (
          <div key={g} className="hgroup">
            <div className="hgroup-head">
              <span className="swatch" style={{ background: GROUPS[g].color }} />
              <strong>{GROUPS[g].label}</strong>
              {full && <span className="tag">full set</span>}
              <small>{groupTiles(g).filter((i) => state.tiles[i].owner === p.id).length}/{groupTiles(g).length}</small>
            </div>
            {groupTiles(g).filter((i) => state.tiles[i].owner === p.id).map((i) => (
              <div key={i} className="hrow">
                <span className="hname">
                  {BOARD[i].name}
                  {state.tiles[i].houses === 5 ? ' · hotel' : state.tiles[i].houses ? ` · ${state.tiles[i].houses}h` : ''}
                  {state.tiles[i].mortgaged ? ' · mortgaged' : ''}
                </span>
                <span className="hbtns">
                  <button disabled={!canBuild(state, i) || p.ai} onClick={() => dispatch({ type: 'BUILD', index: i })}
                    title={`Build for ${money(GROUPS[g].house)}`}>＋</button>
                  <button disabled={!canSellHouse(state, i) || p.ai} onClick={() => dispatch({ type: 'SELL_HOUSE', index: i })}
                    title="Sell a house">－</button>
                  {state.tiles[i].mortgaged ? (
                    <button disabled={p.ai} onClick={() => dispatch({ type: 'UNMORTGAGE', index: i })} title="Clear mortgage">↺</button>
                  ) : (
                    <button disabled={p.ai || state.tiles[i].houses > 0} onClick={() => dispatch({ type: 'MORTGAGE', index: i })}
                      title={`Mortgage for ${money(BOARD[i].price / 2)}`}>₹</button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )
      })}

      {others.length > 0 && (
        <div className="hgroup">
          <div className="hgroup-head">
            <span className="swatch" style={{ background: '#8b93a7' }} />
            <strong>Stations & utilities</strong>
          </div>
          {others.map((i) => (
            <div key={i} className="hrow">
              <span className="hname">{BOARD[i].name}{state.tiles[i].mortgaged ? ' · mortgaged' : ''}</span>
              <span className="hbtns">
                {state.tiles[i].mortgaged
                  ? <button disabled={p.ai} onClick={() => dispatch({ type: 'UNMORTGAGE', index: i })}>↺</button>
                  : <button disabled={p.ai} onClick={() => dispatch({ type: 'MORTGAGE', index: i })}>₹</button>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
