import {
  BOARD, GROUPS, CHANCE_CARDS, CHEST_CARDS, START_CASH, SALARY,
  JAIL_INDEX, JAIL_FINE, groupTiles,
} from '../data/board.js'

export const money = (n) => {
  const neg = n < 0
  const s = Math.abs(Math.round(n)).toString()
  const last = s.slice(-3)
  const rest = s.slice(0, -3)
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last : last
  return (neg ? '-₹' : '₹') + grouped
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const d6 = () => 1 + Math.floor(Math.random() * 6)

export function createGame(playerSetup) {
  const tiles = {}
  BOARD.forEach((t, i) => {
    if (t.price) tiles[i] = { owner: null, houses: 0, mortgaged: false }
  })
  return {
    players: playerSetup.map((p, i) => ({
      id: i, name: p.name, ai: p.ai, color: i,
      pos: 0, cash: START_CASH, jail: false, jailTurns: 0, jailCards: 0,
      out: false, skip: 0,
    })),
    tiles,
    turn: 0,
    dice: null,
    remaining: 0,
    phase: 'roll',
    doubles: 0,
    card: null,
    log: [{ id: 0, text: 'Board set, dice warmed up. Pehla daav!' , tone: 'good' }],
    logId: 1,
    winner: null,
    chance: shuffle(CHANCE_CARDS.map((_, i) => i)),
    chest: shuffle(CHEST_CARDS.map((_, i) => i)),
    lastRent: null,
  }
}

const say = (s, text, tone = 'plain') => {
  s.log = [{ id: s.logId++, text, tone }, ...s.log].slice(0, 60)
}

export const owned = (s, pid) =>
  Object.keys(s.tiles).map(Number).filter((i) => s.tiles[i].owner === pid)

export const netWorth = (s, p) => {
  let total = p.cash
  owned(s, p.id).forEach((i) => {
    const t = BOARD[i]
    total += s.tiles[i].mortgaged ? t.price / 2 : t.price
    total += s.tiles[i].houses * (GROUPS[t.group]?.house || 0)
  })
  return total
}

export function hasFullGroup(s, pid, group) {
  const tiles = groupTiles(group)
  return tiles.length > 0 && tiles.every((i) => s.tiles[i].owner === pid)
}

export function rentFor(s, index, diceTotal) {
  const tile = BOARD[index]
  const st = s.tiles[index]
  if (!st || st.owner === null || st.mortgaged) return 0
  if (tile.type === 'property') {
    if (st.houses > 0) return tile.rents[st.houses]
    return hasFullGroup(s, st.owner, tile.group) ? tile.rents[0] * 2 : tile.rents[0]
  }
  if (tile.type === 'station') {
    const count = owned(s, st.owner).filter((i) => BOARD[i].type === 'station').length
    return tile.rents[Math.max(0, count - 1)]
  }
  if (tile.type === 'utility') {
    const count = owned(s, st.owner).filter((i) => BOARD[i].type === 'utility').length
    return diceTotal * (count === 2 ? 10000 : 4000)
  }
  return 0
}

export function canBuild(s, index) {
  const tile = BOARD[index]
  const st = s.tiles[index]
  if (!st || tile.type !== 'property' || st.mortgaged) return false
  const p = s.players[st.owner]
  if (!p || !hasFullGroup(s, st.owner, tile.group)) return false
  if (st.houses >= 5) return false
  const sibs = groupTiles(tile.group)
  if (sibs.some((i) => s.tiles[i].mortgaged)) return false
  const lowest = Math.min(...sibs.map((i) => s.tiles[i].houses))
  if (st.houses > lowest) return false
  return p.cash >= GROUPS[tile.group].house
}

export function canSellHouse(s, index) {
  const tile = BOARD[index]
  const st = s.tiles[index]
  if (!st || tile.type !== 'property' || st.houses === 0) return false
  const sibs = groupTiles(tile.group)
  const highest = Math.max(...sibs.map((i) => s.tiles[i].houses))
  return st.houses >= highest
}

function pay(s, player, amount, toId = null, reason = '') {
  player.cash -= amount
  if (toId !== null) {
    const to = s.players[toId]
    to.cash += amount
    say(s, `${player.name} paid ${money(amount)} to ${to.name}${reason ? ' — ' + reason : ''}`, 'bad')
  } else if (amount > 0) {
    say(s, `${player.name} paid ${money(amount)} ${reason || 'to the bank'}`, 'bad')
  }
  if (player.cash < 0) bankrupt(s, player, toId)
}

function bankrupt(s, player, creditorId) {
  const props = owned(s, player.id)
  if (creditorId !== null && creditorId !== undefined && s.players[creditorId] && !s.players[creditorId].out) {
    const cr = s.players[creditorId]
    cr.cash += Math.max(0, player.cash)
    props.forEach((i) => { s.tiles[i].owner = creditorId })
    say(s, `${player.name} is divaalia! Everything goes to ${cr.name}.`, 'bad')
  } else {
    props.forEach((i) => { s.tiles[i] = { owner: null, houses: 0, mortgaged: false } })
    say(s, `${player.name} is divaalia! Properties back to the bank.`, 'bad')
  }
  player.cash = 0
  player.out = true
  player.jail = false
  const alive = s.players.filter((p) => !p.out)
  if (alive.length === 1) {
    s.winner = alive[0].id
    s.phase = 'over'
    say(s, `${alive[0].name} owns Amdavad. Game over!`, 'good')
  }
}

function drawCard(s, deckName) {
  const deck = deckName === 'chance' ? CHANCE_CARDS : CHEST_CARDS
  const order = deckName === 'chance' ? s.chance : s.chest
  if (order.length === 0) {
    const refreshed = shuffle(deck.map((_, i) => i))
    if (deckName === 'chance') s.chance = refreshed; else s.chest = refreshed
  }
  const list = deckName === 'chance' ? s.chance : s.chest
  const idx = list.shift()
  return { deck: deckName, ...deck[idx] }
}

function applyCard(s, player, card) {
  const e = card.effect
  switch (e.kind) {
    case 'cash':
      if (e.amount >= 0) { player.cash += e.amount; say(s, `${player.name} collected ${money(e.amount)}`, 'good') }
      else pay(s, player, -e.amount, null, 'as per the card')
      break
    case 'collectAll':
      s.players.forEach((p) => {
        if (p.id !== player.id && !p.out) { p.cash -= e.amount; player.cash += e.amount; if (p.cash < 0) bankrupt(s, p, player.id) }
      })
      say(s, `Everyone paid ${player.name} ${money(e.amount)}`, 'good')
      break
    case 'payAll':
      s.players.forEach((p) => {
        if (p.id !== player.id && !p.out) { p.cash += e.amount; player.cash -= e.amount }
      })
      say(s, `${player.name} paid everyone ${money(e.amount)}`, 'bad')
      if (player.cash < 0) bankrupt(s, player, null)
      break
    case 'jailCard':
      player.jailCards += 1
      say(s, `${player.name} pocketed a Chowki-mafi card`, 'good')
      break
    case 'jail':
      sendToJail(s, player)
      break
    case 'skip':
      player.skip += 1
      say(s, `${player.name} loses the next turn`, 'bad')
      break
    case 'moveTo': {
      if (e.index < player.pos && e.index !== JAIL_INDEX) { player.cash += SALARY; say(s, `${player.name} passed START, +${money(SALARY)}`, 'good') }
      player.pos = e.index
      s.phase = 'resolve'
      return true
    }
    case 'move': {
      player.pos = (player.pos + e.steps + 40) % 40
      s.phase = 'resolve'
      return true
    }
    case 'repairs': {
      const houses = owned(s, player.id).reduce((n, i) => n + s.tiles[i].houses, 0)
      if (houses > 0) pay(s, player, houses * e.perHouse, null, `for ${houses} house repairs`)
      else say(s, `${player.name} owns nothing to repair. Phew.`, 'good')
      break
    }
    default: break
  }
  return false
}

function sendToJail(s, player) {
  player.pos = JAIL_INDEX
  player.jail = true
  player.jailTurns = 0
  s.doubles = 0
  say(s, `${player.name} is inside the Police Chowki`, 'bad')
}

function resolveTile(s, player) {
  const index = player.pos
  const tile = BOARD[index]
  const diceTotal = s.dice ? s.dice[0] + s.dice[1] : 0
  s.lastRent = null

  if (tile.type === 'gotojail') { sendToJail(s, player); s.phase = 'end'; return }
  if (tile.type === 'tax') { pay(s, player, tile.amount, null, `as ${tile.name}`); s.phase = 'end'; return }
  if (tile.type === 'chance' || tile.type === 'chest') {
    const card = drawCard(s, tile.type === 'chance' ? 'chance' : 'chest')
    s.card = card
    s.phase = 'card'
    return
  }
  if (tile.type === 'parking') { say(s, `${player.name} is on a chai break`, 'plain'); s.phase = 'end'; return }
  if (tile.type === 'start') { say(s, `${player.name} is standing on START`, 'plain'); s.phase = 'end'; return }
  if (tile.type === 'jail') { say(s, `${player.name} is only visiting the chowki`, 'plain'); s.phase = 'end'; return }

  const st = s.tiles[index]
  if (st.owner === null) { s.phase = player.cash >= tile.price ? 'buy' : 'end'; if (s.phase === 'end') say(s, `${player.name} cannot afford ${tile.name}`, 'plain'); return }
  if (st.owner === player.id) { say(s, `${player.name} is home at ${tile.name}`, 'plain'); s.phase = 'end'; return }
  const rent = rentFor(s, index, diceTotal)
  if (rent === 0) { say(s, `${tile.name} is mortgaged, no bhaadu today`, 'plain'); s.phase = 'end'; return }
  s.lastRent = { amount: rent, from: player.id, to: st.owner, tile: index }
  pay(s, player, rent, st.owner, `bhaadu for ${tile.name}`)
  s.phase = s.phase === 'over' ? 'over' : 'end'
}

function nextTurn(s) {
  s.dice = null
  s.card = null
  s.doubles = 0
  let guard = 0
  do {
    s.turn = (s.turn + 1) % s.players.length
    guard += 1
    const p = s.players[s.turn]
    if (!p.out && p.skip > 0) { p.skip -= 1; say(s, `${p.name} sits this one out`, 'plain'); continue }
    if (!p.out) break
  } while (guard < 40)
  s.phase = 'roll'
}

export function reducer(state, action) {
  if (action.type === 'INIT') return action.state
  if (!state) return state
  const s = structuredClone(state)
  const player = s.players[s.turn]

  switch (action.type) {
    case 'ROLL': {
      if (s.phase !== 'roll') return state
      const a = d6(), b = d6()
      s.dice = [a, b]
      if (player.jail) {
        if (a === b) {
          player.jail = false
          say(s, `${player.name} rolled a double and walks out of the chowki`, 'good')
          s.remaining = a + b
          s.phase = 'walk'
        } else {
          player.jailTurns += 1
          if (player.jailTurns >= 3) {
            pay(s, player, JAIL_FINE, null, 'as chowki fine')
            player.jail = false
            say(s, `${player.name} paid up and is out`, 'plain')
            s.remaining = a + b
            s.phase = 'walk'
          } else {
            say(s, `${player.name} rolled ${a}+${b}, still inside`, 'bad')
            s.phase = 'end'
          }
        }
        return s
      }
      if (a === b) {
        s.doubles += 1
        if (s.doubles === 3) {
          say(s, `${player.name} rolled three doubles. Chowki jao!`, 'bad')
          sendToJail(s, player)
          s.phase = 'end'
          return s
        }
        say(s, `${player.name} rolled a double ${a} — another daav after this`, 'good')
      }
      s.remaining = a + b
      s.phase = 'walk'
      return s
    }

    case 'STEP': {
      if (s.phase !== 'walk') return state
      player.pos = (player.pos + 1) % 40
      if (player.pos === 0) { player.cash += SALARY; say(s, `${player.name} crossed START, +${money(SALARY)}`, 'good') }
      s.remaining -= 1
      if (s.remaining <= 0) s.phase = 'resolve'
      return s
    }

    case 'RESOLVE': {
      if (s.phase !== 'resolve') return state
      resolveTile(s, player)
      return s
    }

    case 'BUY': {
      if (s.phase !== 'buy') return state
      const tile = BOARD[player.pos]
      if (player.cash < tile.price) return state
      player.cash -= tile.price
      s.tiles[player.pos].owner = player.id
      say(s, `${player.name} bought ${tile.name} for ${money(tile.price)}`, 'good')
      s.phase = 'end'
      return s
    }

    case 'PASS': {
      if (s.phase !== 'buy') return state
      say(s, `${player.name} passed on ${BOARD[player.pos].name}`, 'plain')
      s.phase = 'end'
      return s
    }

    case 'CARD_OK': {
      if (s.phase !== 'card') return state
      const card = s.card
      s.card = null
      s.phase = 'end'
      say(s, `${player.name} drew: ${card.text}`, 'plain')
      const moved = applyCard(s, player, card)
      if (moved) resolveTile(s, s.players[s.turn])
      return s
    }

    case 'BUILD': {
      const i = action.index
      if (!canBuild(s, i)) return state
      const tile = BOARD[i]
      const cost = GROUPS[tile.group].house
      const ownerP = s.players[s.tiles[i].owner]
      ownerP.cash -= cost
      s.tiles[i].houses += 1
      const what = s.tiles[i].houses === 5 ? 'a hotel' : `house #${s.tiles[i].houses}`
      say(s, `${ownerP.name} built ${what} on ${tile.name} for ${money(cost)}`, 'good')
      return s
    }

    case 'SELL_HOUSE': {
      const i = action.index
      if (!canSellHouse(s, i)) return state
      const tile = BOARD[i]
      const back = GROUPS[tile.group].house / 2
      const ownerP = s.players[s.tiles[i].owner]
      s.tiles[i].houses -= 1
      ownerP.cash += back
      say(s, `${ownerP.name} sold a house on ${tile.name} for ${money(back)}`, 'plain')
      return s
    }

    case 'MORTGAGE': {
      const i = action.index
      const st = s.tiles[i]
      if (!st || st.owner === null || st.mortgaged || st.houses > 0) return state
      const ownerP = s.players[st.owner]
      st.mortgaged = true
      ownerP.cash += BOARD[i].price / 2
      say(s, `${ownerP.name} mortgaged ${BOARD[i].name} for ${money(BOARD[i].price / 2)}`, 'plain')
      return s
    }

    case 'UNMORTGAGE': {
      const i = action.index
      const st = s.tiles[i]
      if (!st || !st.mortgaged) return state
      const ownerP = s.players[st.owner]
      const cost = Math.round(BOARD[i].price * 0.55)
      if (ownerP.cash < cost) return state
      ownerP.cash -= cost
      st.mortgaged = false
      say(s, `${ownerP.name} cleared the mortgage on ${BOARD[i].name}`, 'good')
      return s
    }

    case 'USE_JAIL_CARD': {
      if (!player.jail || player.jailCards <= 0) return state
      player.jailCards -= 1
      player.jail = false
      player.jailTurns = 0
      say(s, `${player.name} used a Chowki-mafi card`, 'good')
      return s
    }

    case 'PAY_FINE': {
      if (!player.jail || player.cash < JAIL_FINE) return state
      pay(s, player, JAIL_FINE, null, 'as chowki fine')
      player.jail = false
      player.jailTurns = 0
      return s
    }

    case 'END_TURN': {
      if (s.phase !== 'end') return state
      if (s.winner !== null) { s.phase = 'over'; return s }
      const rolledDouble = s.dice && s.dice[0] === s.dice[1] && !player.jail && !player.out
      if (rolledDouble && s.doubles > 0 && s.doubles < 3) {
        s.dice = null
        s.phase = 'roll'
        return s
      }
      nextTurn(s)
      return s
    }

    default:
      return state
  }
}
