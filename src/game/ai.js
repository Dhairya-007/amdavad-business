import { BOARD, GROUPS, groupTiles } from '../data/board.js'
import { canBuild, hasFullGroup, owned } from './engine.js'

// A deliberately simple seth: buys what it can afford, loves completing a
// colour set, and builds houses the moment it has spare cash.
export function nextAiAction(state) {
  const p = state.players[state.turn]
  if (!p || !p.ai || state.winner !== null) return null

  if (state.phase === 'roll') {
    if (p.jail && p.jailCards > 0) return { type: 'USE_JAIL_CARD' }
    return { type: 'ROLL' }
  }
  if (state.phase === 'card') return { type: 'CARD_OK' }

  if (state.phase === 'buy') {
    const tile = BOARD[p.pos]
    const completes = tile.group && groupTiles(tile.group)
      .filter((i) => i !== p.pos)
      .every((i) => state.tiles[i].owner === p.id)
    const reserve = completes ? 20000 : tile.type === 'station' ? 40000 : 90000
    return p.cash - tile.price >= reserve ? { type: 'BUY' } : { type: 'PASS' }
  }

  if (state.phase === 'end') {
    const buildable = owned(state, p.id)
      .filter((i) => BOARD[i].type === 'property' && canBuild(state, i) && hasFullGroup(state, p.id, BOARD[i].group))
      .sort((a, b) => BOARD[b].price - BOARD[a].price)
    for (const i of buildable) {
      if (p.cash - GROUPS[BOARD[i].group].house >= 120000) return { type: 'BUILD', index: i }
    }
    return { type: 'END_TURN' }
  }
  return null
}
