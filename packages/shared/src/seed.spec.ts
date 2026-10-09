import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { referenceSeedSchema, type ReferenceSeed } from './seed.js'

const readSeedFile = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`../seed/${name}.json`, import.meta.url), 'utf8'))

const issueMessages = (seed: unknown): string[] =>
  referenceSeedSchema.safeParse(seed).error?.issues.map((issue) => issue.message) ?? []

/** Маленький правильный сид — от него отталкиваются проверки ошибок. */
const validSeed = (): ReferenceSeed => ({
  makes: [{ slug: 'mazda', name: 'Mazda' }],
  models: [
    {
      slug: 'mazda-roadster-na',
      make: 'mazda',
      name: 'Roadster',
      generation: 'NA',
      chassisCodes: ['NA6CE'],
      bodyType: 'roadster',
      yearsFrom: 1989,
      yearsTo: 1997,
      tags: ['touge'],
      isLegend: false,
    },
  ],
  engines: [
    {
      model: 'mazda-roadster-na',
      code: 'B6-ZE',
      displacementCc: 1597,
      powerHp: 120,
      aspiration: 'na',
      fuel: 'petrol',
      isRotary: false,
    },
  ],
})

describe('сид справочника из packages/shared/seed', () => {
  const seed = {
    makes: readSeedFile('makes'),
    models: readSeedFile('models'),
    engines: readSeedFile('engines'),
  }

  it('проходит схему вместе со связями между файлами', () => {
    expect(issueMessages(seed)).toEqual([])
  })

  it('содержит 6 марок и 24 модели', () => {
    const parsed = referenceSeedSchema.parse(seed)
    expect(parsed.makes).toHaveLength(6)
    expect(parsed.models).toHaveLength(24)
  })
})

describe('схема сида справочника', () => {
  it('принимает правильный сид', () => {
    expect(issueMessages(validSeed())).toEqual([])
  })

  it('отклоняет повтор кода двигателя внутри одной модели', () => {
    const seed = validSeed()
    seed.engines.push({ ...seed.engines[0]!, powerHp: 125 })
    expect(issueMessages(seed)).toContain('Повтор двигателя B6-ZE в модели mazda-roadster-na')
  })

  it('отклоняет двигатель несуществующей модели', () => {
    const seed = validSeed()
    seed.engines.push({ ...seed.engines[0]!, model: 'mazda-roadster-nc' })
    expect(issueMessages(seed)).toContain('Нет такой модели: mazda-roadster-nc')
  })

  it('отклоняет модель несуществующей марки', () => {
    const seed = validSeed()
    seed.models[0]!.make = 'eunos'
    expect(issueMessages(seed)).toContain('Нет такой марки: eunos')
  })

  it('отклоняет модель без двигателей', () => {
    const seed = validSeed()
    seed.engines = [{ ...seed.engines[0]!, model: 'mazda-roadster-nb' }]
    seed.models.push({ ...seed.models[0]!, slug: 'mazda-roadster-nb', generation: 'NB' })
    expect(issueMessages(seed)).toContain('У модели нет двигателей: mazda-roadster-na')
  })

  it('считает повтором две модели одной марки с одним названием и без поколения', () => {
    const seed = validSeed()
    seed.models[0]!.generation = null
    seed.models.push({ ...seed.models[0]!, slug: 'mazda-roadster-copy' })
    seed.engines.push({ ...seed.engines[0]!, model: 'mazda-roadster-copy' })
    expect(issueMessages(seed)).toContain('Повтор модели: mazda Roadster (без поколения)')
  })

  it('отклоняет модель, у которой год начала позже года окончания', () => {
    const seed = validSeed()
    seed.models[0]!.yearsFrom = 1998
    expect(issueMessages(seed)).toContain('Год начала выпуска позже года окончания')
  })

  it('не принимает kei как тип кузова — это тег', () => {
    const seed = validSeed()
    Object.assign(seed.models[0]!, { bodyType: 'kei' })
    expect(issueMessages(seed)).not.toEqual([])
  })

  it('не пропускает лишние поля из архивного каталога', () => {
    const seed = validSeed()
    Object.assign(seed.models[0]!, { tier: 'legend' })
    expect(issueMessages(seed)).not.toEqual([])
  })
})
