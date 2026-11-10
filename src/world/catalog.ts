export type ShipKind = 'leo-station' | 'lunar-gateway' | 'mars-transit' | 'lunar-habitat';
export type OccupationKey =
  | 'occ.commander'
  | 'occ.botanist'
  | 'occ.eclss'
  | 'occ.avionics'
  | 'occ.robotics'
  | 'occ.geology'
  | 'occ.lifeSupport'
  | 'occ.flightEng'
  | 'occ.medical'
  | 'occ.science'
  | 'occ.habitat'
  | 'occ.eva';

export interface ShipDef {
  id: string;
  nameKey: string;
  kindKey: string;
  kind: ShipKind;
  /** 0 = unshielded, 1 = fully sheltered. Used only to scale official S-scale into modeled cabin dose. */
  shielding: number;
  baselineMsvDay: number;
  modules: string[];
  locKey: string;
}

export interface CrewDef {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  occupationKey: OccupationKey;
  shipId: string;
  loginAccount?: string;
  roleOnShip: 'commander' | 'crew';
  bloodType: string;
  avatarSeed: string;
  baselineHr: number;
  baselineHrv: number;
  baselineSpo2: number;
  baselineVo2: number;
}

export const SHIPS: ShipDef[] = [
  {
    id: 'ship-harmony',
    nameKey: 'ship.harmony.name',
    kindKey: 'ship.harmony.kind',
    kind: 'leo-station',
    shielding: 0.72,
    baselineMsvDay: 0.42,
    modules: ['mod.columbus', 'mod.destiny', 'mod.tranquility', 'mod.exterior'],
    locKey: 'loc.leo',
  },
  {
    id: 'ship-gateway',
    nameKey: 'ship.gateway.name',
    kindKey: 'ship.gateway.kind',
    kind: 'lunar-gateway',
    shielding: 0.55,
    baselineMsvDay: 0.61,
    modules: ['mod.hab', 'mod.pps', 'mod.airlock'],
    locKey: 'loc.gateway',
  },
  {
    id: 'ship-ares',
    nameKey: 'ship.ares.name',
    kindKey: 'ship.ares.kind',
    kind: 'mars-transit',
    shielding: 0.48,
    baselineMsvDay: 1.15,
    modules: ['mod.command', 'mod.spin', 'mod.engineering'],
    locKey: 'loc.mars',
  },
  {
    id: 'ship-mare',
    nameKey: 'ship.mare.name',
    kindKey: 'ship.mare.kind',
    kind: 'lunar-habitat',
    shielding: 0.82,
    baselineMsvDay: 0.28,
    modules: ['mod.berm', 'mod.airlock', 'mod.greenhouse'],
    locKey: 'loc.mare',
  },
];

export const CREW: CrewDef[] = [
  { id: 'astro-marcus', name: 'Marcus Vance', gender: 'Male', age: 51, occupationKey: 'occ.commander', shipId: 'ship-harmony', loginAccount: 'marcus_vance', roleOnShip: 'commander', bloodType: 'O Rh+', avatarSeed: 'MV', baselineHr: 74, baselineHrv: 32, baselineSpo2: 98, baselineVo2: 24.8 },
  { id: 'astro-alice', name: 'Alice Smith', gender: 'Female', age: 46, occupationKey: 'occ.botanist', shipId: 'ship-harmony', loginAccount: 'alice_smith', roleOnShip: 'crew', bloodType: 'A Rh+', avatarSeed: 'AS', baselineHr: 82, baselineHrv: 22, baselineSpo2: 96, baselineVo2: 20.0 },
  { id: 'astro-elena', name: 'Elena Rostova', gender: 'Female', age: 39, occupationKey: 'occ.eclss', shipId: 'ship-harmony', loginAccount: 'elena_rostova', roleOnShip: 'crew', bloodType: 'B Rh+', avatarSeed: 'ER', baselineHr: 78, baselineHrv: 26, baselineSpo2: 97, baselineVo2: 22.1 },
  { id: 'astro-noah', name: 'Noah Okonkwo', gender: 'Male', age: 37, occupationKey: 'occ.robotics', shipId: 'ship-harmony', roleOnShip: 'crew', bloodType: 'O Rh−', avatarSeed: 'NO', baselineHr: 76, baselineHrv: 28, baselineSpo2: 97, baselineVo2: 23.0 },
  { id: 'astro-priya', name: 'Priya Nair', gender: 'Female', age: 44, occupationKey: 'occ.commander', shipId: 'ship-gateway', roleOnShip: 'commander', bloodType: 'B Rh+', avatarSeed: 'PN', baselineHr: 72, baselineHrv: 30, baselineSpo2: 98, baselineVo2: 23.4 },
  { id: 'astro-kenji', name: 'Kenji Sato', gender: 'Male', age: 42, occupationKey: 'occ.avionics', shipId: 'ship-gateway', loginAccount: 'kenji_sato', roleOnShip: 'crew', bloodType: 'AB Rh+', avatarSeed: 'KS', baselineHr: 70, baselineHrv: 35, baselineSpo2: 99, baselineVo2: 23.4 },
  { id: 'astro-luca', name: 'Luca Moretti', gender: 'Male', age: 35, occupationKey: 'occ.geology', shipId: 'ship-gateway', roleOnShip: 'crew', bloodType: 'A Rh+', avatarSeed: 'LM', baselineHr: 75, baselineHrv: 27, baselineSpo2: 97, baselineVo2: 22.6 },
  { id: 'astro-amina', name: 'Amina Diallo', gender: 'Female', age: 40, occupationKey: 'occ.lifeSupport', shipId: 'ship-gateway', roleOnShip: 'crew', bloodType: 'O Rh+', avatarSeed: 'AD', baselineHr: 77, baselineHrv: 25, baselineSpo2: 97, baselineVo2: 21.8 },
  { id: 'astro-sofia', name: 'Sofia Berg', gender: 'Female', age: 48, occupationKey: 'occ.commander', shipId: 'ship-ares', roleOnShip: 'commander', bloodType: 'A Rh−', avatarSeed: 'SB', baselineHr: 71, baselineHrv: 29, baselineSpo2: 97, baselineVo2: 22.9 },
  { id: 'astro-wei', name: 'Wei Chen', gender: 'Male', age: 36, occupationKey: 'occ.flightEng', shipId: 'ship-ares', roleOnShip: 'crew', bloodType: 'B Rh+', avatarSeed: 'WC', baselineHr: 73, baselineHrv: 27, baselineSpo2: 96, baselineVo2: 23.1 },
  { id: 'astro-jamal', name: 'Jamal Haddad', gender: 'Male', age: 41, occupationKey: 'occ.medical', shipId: 'ship-ares', roleOnShip: 'crew', bloodType: 'O Rh+', avatarSeed: 'JH', baselineHr: 69, baselineHrv: 33, baselineSpo2: 98, baselineVo2: 24.0 },
  { id: 'astro-ines', name: 'Inés Vargas', gender: 'Female', age: 33, occupationKey: 'occ.science', shipId: 'ship-ares', roleOnShip: 'crew', bloodType: 'AB Rh+', avatarSeed: 'IV', baselineHr: 80, baselineHrv: 24, baselineSpo2: 96, baselineVo2: 21.4 },
  { id: 'astro-yara', name: 'Yara Petrov', gender: 'Female', age: 45, occupationKey: 'occ.commander', shipId: 'ship-mare', roleOnShip: 'commander', bloodType: 'O Rh+', avatarSeed: 'YP', baselineHr: 74, baselineHrv: 28, baselineSpo2: 97, baselineVo2: 22.2 },
  { id: 'astro-theo', name: 'Theo Park', gender: 'Male', age: 38, occupationKey: 'occ.habitat', shipId: 'ship-mare', roleOnShip: 'crew', bloodType: 'A Rh+', avatarSeed: 'TP', baselineHr: 76, baselineHrv: 26, baselineSpo2: 97, baselineVo2: 21.9 },
  { id: 'astro-samira', name: 'Samira Al-Farsi', gender: 'Female', age: 34, occupationKey: 'occ.eva', shipId: 'ship-mare', roleOnShip: 'crew', bloodType: 'B Rh−', avatarSeed: 'SA', baselineHr: 79, baselineHrv: 23, baselineSpo2: 96, baselineVo2: 23.6 },
];

export function crewByLogin(account: string): CrewDef | undefined {
  return CREW.find((c) => c.loginAccount === account);
}

export function shipOf(crewId: string): ShipDef | undefined {
  const c = CREW.find((x) => x.id === crewId);
  return SHIPS.find((s) => s.id === c?.shipId);
}
