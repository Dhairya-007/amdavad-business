// The Amdavad board. 40 tiles, laid out the way everyone's childhood
// "Business" board was: cheap stuff near START, the posh stuff at the end.
// All money is in real rupees, so 60000 prints as 60,000.

const K = 1000

export const GROUPS = {
  khaki:     { label: 'Juna Amdavad', color: '#8d5524', house: 50 * K },
  cyan:      { label: 'Nava Vistaar', color: '#2bb3c0', house: 50 * K },
  pink:      { label: 'Paschim Pol',  color: '#d6457f', house: 100 * K },
  orange:    { label: 'Shaher Madhya', color: '#ef7d20', house: 100 * K },
  red:       { label: 'Bazaar Belt',  color: '#d92b2b', house: 150 * K },
  yellow:    { label: 'Corporate Row', color: '#f1b511', house: 150 * K },
  green:     { label: 'SG Corridor',  color: '#1f9d55', house: 200 * K },
  blue:      { label: 'Heritage Gold', color: '#2b4bd9', house: 200 * K },
}

const prop = (name, group, price, rents, short) => ({
  type: 'property', name, short: short || name, group, price,
  rents: rents.map((r) => r * K),
})

const station = (name, short) => ({
  type: 'station', name, short, price: 200 * K,
  rents: [25 * K, 50 * K, 100 * K, 200 * K],
})

const utility = (name, short) => ({ type: 'utility', name, short, price: 150 * K })

export const BOARD = [
  { type: 'start', name: 'START', short: 'START', note: 'Kem cho! Collect pagaar' },
  prop('Maninagar', 'khaki', 60 * K, [2, 10, 30, 90, 160, 250]),
  { type: 'chance', name: 'Nasib', short: 'Nasib', note: 'Luck of the draw' },
  prop('Nikol', 'khaki', 60 * K, [4, 20, 60, 180, 320, 450]),
  { type: 'tax', name: 'GST Bharo', short: 'GST', amount: 20 * K },
  station('Kalupur Junction', 'Kalupur'),
  prop('Ghatlodia', 'cyan', 100 * K, [6, 30, 90, 270, 400, 550]),
  { type: 'chest', name: 'Mandli Fund', short: 'Mandli', note: 'Society collection' },
  prop('Chandkheda', 'cyan', 100 * K, [6, 30, 90, 270, 400, 550]),
  prop('Gota', 'cyan', 120 * K, [8, 40, 100, 300, 450, 600]),
  { type: 'jail', name: 'Police Chowki', short: 'Chowki', note: 'Just visiting' },
  prop('Naranpura', 'pink', 140 * K, [10, 50, 150, 450, 625, 750]),
  utility('AMTS Depot', 'AMTS'),
  prop('Paldi', 'pink', 140 * K, [10, 50, 150, 450, 625, 750]),
  prop('Vasna', 'pink', 160 * K, [12, 60, 180, 500, 700, 900]),
  station('Gandhigram', 'Gandhigram'),
  prop('Navrangpura', 'orange', 180 * K, [14, 70, 200, 550, 750, 950]),
  { type: 'chance', name: 'Nasib', short: 'Nasib', note: 'Luck of the draw' },
  prop('Vastrapur', 'orange', 180 * K, [14, 70, 200, 550, 750, 950]),
  prop('Thaltej', 'orange', 200 * K, [16, 80, 220, 600, 800, 1000]),
  { type: 'parking', name: 'Chai Break', short: 'Chai Break', note: 'Kitli stop, free' },
  prop('Law Garden', 'red', 220 * K, [18, 90, 250, 700, 875, 1050]),
  { type: 'chest', name: 'Mandli Fund', short: 'Mandli', note: 'Society collection' },
  prop('C G Road', 'red', 220 * K, [18, 90, 250, 700, 875, 1050], 'CG Road'),
  prop('Ashram Road', 'red', 240 * K, [20, 100, 300, 750, 925, 1100]),
  station('Sabarmati', 'Sabarmati'),
  prop('Prahlad Nagar', 'yellow', 260 * K, [22, 110, 330, 800, 975, 1150]),
  prop('Bodakdev', 'yellow', 260 * K, [22, 110, 330, 800, 975, 1150]),
  utility('Metro Rail', 'Metro'),
  prop('Satellite', 'yellow', 280 * K, [24, 120, 360, 850, 1025, 1200]),
  { type: 'gotojail', name: 'Chowki Jao!', short: 'Chowki Jao', note: 'Straight inside' },
  prop('Sindhu Bhavan Road', 'green', 300 * K, [26, 130, 390, 900, 1100, 1275], 'Sindhu Bhavan'),
  prop('Bopal', 'green', 300 * K, [26, 130, 390, 900, 1100, 1275]),
  { type: 'chest', name: 'Mandli Fund', short: 'Mandli', note: 'Society collection' },
  prop('Science City', 'green', 320 * K, [28, 150, 450, 1000, 1200, 1400]),
  station('SVP Airport', 'Airport'),
  { type: 'chance', name: 'Nasib', short: 'Nasib', note: 'Luck of the draw' },
  prop('Kankaria Lake', 'blue', 350 * K, [35, 175, 500, 1100, 1300, 1500]),
  { type: 'tax', name: 'Municipal Tax', short: 'Muni Tax', amount: 30 * K },
  prop('Manek Chowk', 'blue', 400 * K, [50, 200, 600, 1400, 1700, 2000]),
]

export const START_CASH = 300 * K
export const SALARY = 40 * K
export const JAIL_INDEX = 10
export const JAIL_FINE = 20 * K
export const PARKING_INDEX = 20

export const CHANCE_CARDS = [
  { text: 'Traffic jam at Panchvati circle. Lose a turn sipping chai.', effect: { kind: 'skip' } },
  { text: 'Uttarayan! Your kite cut three. Everyone pays you ₹10,000.', effect: { kind: 'collectAll', amount: 10 * K } },
  { text: 'Navratri pass resale went well. Collect ₹50,000.', effect: { kind: 'cash', amount: 50 * K } },
  { text: 'Advance to Manek Chowk for jalebi-fafda. Pay if owned.', effect: { kind: 'moveTo', index: 39 } },
  { text: 'BRTS lane fine. Pay ₹25,000.', effect: { kind: 'cash', amount: -25 * K } },
  { text: 'Take the metro to Kalupur Junction.', effect: { kind: 'moveTo', index: 5 } },
  { text: 'Riverfront marathon winner. Collect ₹30,000.', effect: { kind: 'cash', amount: 30 * K } },
  { text: 'Caught without a helmet on Ashram Road. Chowki jao!', effect: { kind: 'jail' } },
  { text: 'Back three steps, you forgot your wallet at the pol.', effect: { kind: 'move', steps: -3 } },
  { text: 'Lawyer friend fixed your challan. Keep this Chowki-mafi card.', effect: { kind: 'jailCard' } },
  { text: 'Repairs across your properties: ₹10,000 per house.', effect: { kind: 'repairs', perHouse: 10 * K } },
  { text: 'Go to START and collect the pagaar.', effect: { kind: 'moveTo', index: 0 } },
]

export const CHEST_CARDS = [
  { text: 'Society maintenance refund. Collect ₹20,000.', effect: { kind: 'cash', amount: 20 * K } },
  { text: 'Wedding season catering order. Collect ₹75,000.', effect: { kind: 'cash', amount: 75 * K } },
  { text: 'Garba class fees due. Pay ₹15,000.', effect: { kind: 'cash', amount: -15 * K } },
  { text: 'Doctor at Civil Hospital. Pay ₹40,000.', effect: { kind: 'cash', amount: -40 * K } },
  { text: 'Won the Mandli lottery. Collect ₹1,00,000.', effect: { kind: 'cash', amount: 100 * K } },
  { text: 'Chowki-mafi card! Keep it till you need it.', effect: { kind: 'jailCard' } },
  { text: 'School fees for the whole pol. Pay each player ₹15,000.', effect: { kind: 'payAll', amount: 15 * K } },
  { text: 'Old scooter sold in Gulbai Tekra. Collect ₹45,000.', effect: { kind: 'cash', amount: 45 * K } },
  { text: 'Income tax notice. Pay ₹50,000.', effect: { kind: 'cash', amount: -50 * K } },
  { text: 'Cousin repaid an old loan. Collect ₹60,000.', effect: { kind: 'cash', amount: 60 * K } },
  { text: 'Unpaid electricity bill at Torrent. Pay ₹30,000.', effect: { kind: 'cash', amount: -30 * K } },
  { text: 'Street-food stall profit share. Collect ₹35,000.', effect: { kind: 'cash', amount: 35 * K } },
]

// Grid coordinates (1-indexed, 11x11) for every tile so tokens and tiles agree.
export function cellOf(i) {
  if (i <= 10) return { col: 11 - i, row: 11 }
  if (i <= 20) return { col: 1, row: 11 - (i - 10) }
  if (i <= 30) return { col: 1 + (i - 20), row: 1 }
  return { col: 11, row: 1 + (i - 30) }
}

export function sideOf(i) {
  if (i <= 10) return 'bottom'
  if (i <= 20) return 'left'
  if (i <= 30) return 'top'
  return 'right'
}

export const PLAYER_COLORS = [
  { name: 'Kesari', hex: '#ff8a1f', deep: '#b24a00' },
  { name: 'Mor Pankh', hex: '#19b6a8', deep: '#0b6b63' },
  { name: 'Gulabi', hex: '#f0468a', deep: '#9a1047' },
  { name: 'Indigo', hex: '#6b6cff', deep: '#2b2a8f' },
]

export const groupTiles = (group) =>
  BOARD.map((t, i) => ({ t, i })).filter(({ t }) => t.group === group).map(({ i }) => i)
