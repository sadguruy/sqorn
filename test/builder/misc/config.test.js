const pg = require('pg')
const { query, sqorn } = require('../tape')

const db_name = 'sqorn_config_test'
const adminConnection = {
  connectionString: 'postgresql://postgres@localhost:5432/postgres'
}
const appConnection = {
  connectionString: `postgresql://postgres@localhost:5432/${db_name}`
}

const createTestDatabase = async () => {
  // create test database
  let sq = sqorn({ pg, pool: new pg.Pool(adminConnection) })
  await sq.l`drop database if exists $${db_name}`
  await sq.l`create database $${db_name}`
  await sq.end()
  // populate test database
  sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
  await sq.l`create table person (
    id              serial primary key,
    first_name      text,
    last_name       text
  )`
  await sq`person`.insert(
    { firstName: 'Jo', lastName: 'Schmo' },
    { firstName: 'Bo', lastName: 'Mo' }
  )
  await sq.end()
}

describe('Config', async () => {
  beforeAll(createTestDatabase)
  describe('thenable', async () => {
    test('default = true', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(await sq`person`({ firstName: 'Jo' })`last_name`).toEqual([
          { lastName: 'Schmo' }
        ])
      } finally {
        await sq.end()
      }
    })
    test('true', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        thenable: true
      })
      try {
        expect(await sq`person`({ firstName: 'Jo' })`last_name`).toEqual([
          { lastName: 'Schmo' }
        ])
      } finally {
        await sq.end()
      }
    })
    test('false', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        thenable: false
      })
      try {
        const query = sq`person`({ firstName: 'Jo' })`last_name`
        expect(query.then).toBe(undefined)
        expect(await query).toBe(query)
      } finally {
        await sq.end()
      }
    })
  })
  describe('mapInputKeys', () => {
    test('default snake_case 1', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(
          sq
            .with({ aB: sq.l`select cD`, e_f: sq.l`select g_h` })
            .from({ iJ3: 'kL', mN: [{ oP: 1, q_r: 1 }] })
            .where({ sT: 1, u_v: 1 })
            .return({ wX: 1, y_z: 1 })
            .link('\n').query.text
        ).toEqual(`with a_b as (select cD), e_f as (select g_h)
select $1 as w_x, $2 as y_z
from kL as i_j_3, (values ($3, $4)) as m_n(o_p, q_r)
where (s_t = $5 and u_v = $6)`)
      } finally {
        await sq.end()
      }
    })
    test('default snake_case 2', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(
          sq.with({ 'aB(cD, e_f)': sq.l`select 1, 2` }).from('gH')
            .from`jK`.return({ lM: 'nO' }, 'pQ').query.text
        ).toEqual(
          'with aB(cD, e_f) as (select 1, 2) select nO as l_m, pQ from gH, jK'
        )
      } finally {
        await sq.end()
      }
    })
    test('identity function', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        mapInputKeys: key => key
      })
      try {
        expect(
          sq
            .with({ aB: sq.l`select cD`, e_f: sq.l`select g_h` })
            .from({ iJ3: 'kL', mN: [{ oP: 1, q_r: 1 }] })
            .where({ sT: 1, u_v: 1 })
            .return({ wX: 1, y_z: 1 })
            .link('\n').query.text
        ).toEqual(`with aB as (select cD), e_f as (select g_h)
select $1 as wX, $2 as y_z
from kL as iJ3, (values ($3, $4)) as mN(oP, q_r)
where (sT = $5 and u_v = $6)`)
      } finally {
        await sq.end()
      }
    })
    test('uppercase function', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        mapInputKeys: key => key.toUpperCase()
      })
      try {
        expect(
          sq
            .with({ aB: sq.l`select cD`, e_f: sq.l`select g_h` })
            .from({ iJ3: 'kL', mN: [{ oP: 1, q_r: 1 }] })
            .where({ sT: 1, u_v: 1 })
            .return({ wX: 1, y_z: 1 })
            .link('\n').query.text
        ).toEqual(`with AB as (select cD), E_F as (select g_h)
select $1 as WX, $2 as Y_Z
from kL as IJ3, (values ($3, $4)) as MN(OP, Q_R)
where (ST = $5 and U_V = $6)`)
      } finally {
        await sq.end()
      }
    })
  })
  describe('mapOutputKeys', () => {
    test('default camelCase', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(
          await sq`person`({ firstName: 'Jo' })`id, first_name, last_name`.one()
        ).toEqual({ id: 1, firstName: 'Jo', lastName: 'Schmo' })
      } finally {
        await sq.end()
      }
    })
    test('no rows', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(
          await sq.from`person`.where({ id: 999 }).return`first_name`
        ).toEqual([])
      } finally {
        await sq.end()
      }
    })
    test('two rows camelCase', async () => {
      const sq = sqorn({ pg, pool: new pg.Pool(appConnection) })
      try {
        expect(await sq.from`person`.return`first_name`).toEqual([
          { firstName: 'Jo' },
          { firstName: 'Bo' }
        ])
      } finally {
        await sq.end()
      }
    })
    test('identity function', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        mapOutputKeys: key => key
      })
      try {
        expect(
          await sq`person`({ firstName: 'Jo' })`id, first_name, last_name`.one()
        ).toEqual({ id: 1, first_name: 'Jo', last_name: 'Schmo' })
      } finally {
        await sq.end()
      }
    })
    test('uppercase function', async () => {
      const sq = sqorn({
        pg,
        pool: new pg.Pool(appConnection),
        mapOutputKeys: key => key.toUpperCase()
      })
      try {
        expect(
          await sq`person`({ firstName: 'Jo' })`id, first_name, last_name`.one()
        ).toEqual({ ID: 1, FIRST_NAME: 'Jo', LAST_NAME: 'Schmo' })
      } finally {
        await sq.end()
      }
    })
  })
})
