import { z } from 'zod'
import { aspirationSchema, bodyTypeSchema, fuelSchema } from './reference.js'

/**
 * Схемы сид-данных справочника: `packages/shared/seed/*.json`.
 * Связи — по слагам: модель ссылается на марку, двигатель — на модель;
 * сидер переводит слаги в идентификаторы при вставке.
 */

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Слаг: строчные латинские буквы, цифры и дефисы')

const yearSchema = z.int().min(1950).max(2030)

export const seedMakeSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().min(1),
})

export const seedModelSchema = z
  .strictObject({
    slug: slugSchema,
    make: slugSchema,
    name: z.string().min(1),
    generation: z.string().min(1).nullable(),
    chassisCodes: z
      .array(z.string().regex(/^[A-Z0-9]+$/, 'Код кузова: заглавные буквы и цифры'))
      .min(1),
    bodyType: bodyTypeSchema,
    yearsFrom: yearSchema,
    yearsTo: yearSchema,
    tags: z.array(slugSchema),
    isLegend: z.boolean(),
  })
  .refine((model) => model.yearsFrom <= model.yearsTo, {
    message: 'Год начала выпуска позже года окончания',
    path: ['yearsTo'],
  })

/** Одна запись — один код двигателя с конкретными мощностью и объёмом (решение 14.09). */
export const seedEngineSchema = z.strictObject({
  model: slugSchema,
  code: z.string().regex(/^[0-9A-Z][0-9A-Z-]*$/, 'Код двигателя: заглавные буквы, цифры и дефисы'),
  displacementCc: z.int().min(50).max(10_000),
  powerHp: z.int().min(1).max(2_000),
  aspiration: aspirationSchema,
  fuel: fuelSchema,
  isRotary: z.boolean(),
})

export type SeedMake = z.infer<typeof seedMakeSchema>
export type SeedModel = z.infer<typeof seedModelSchema>
export type SeedEngine = z.infer<typeof seedEngineSchema>

/** Весь сид целиком: каждая запись по своей схеме плюс ограничения между файлами, которые потом проверит база. */
export const referenceSeedSchema = z
  .object({
    makes: z.array(seedMakeSchema).min(1),
    models: z.array(seedModelSchema).min(1),
    engines: z.array(seedEngineSchema).min(1),
  })
  .superRefine(({ makes, models, engines }, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message })
    }

    const makeSlugs = new Set<string>()
    makes.forEach((make, i) => {
      if (makeSlugs.has(make.slug)) issue(['makes', i, 'slug'], `Повтор слага марки: ${make.slug}`)
      makeSlugs.add(make.slug)
    })

    const modelSlugs = new Set<string>()
    const modelKeys = new Set<string>()
    models.forEach((model, i) => {
      if (modelSlugs.has(model.slug))
        issue(['models', i, 'slug'], `Повтор слага модели: ${model.slug}`)
      modelSlugs.add(model.slug)
      if (!makeSlugs.has(model.make)) issue(['models', i, 'make'], `Нет такой марки: ${model.make}`)
      // Как UNIQUE NULLS NOT DISTINCT (make, name, generation): две модели без поколения — тоже повтор.
      const key = JSON.stringify([model.make, model.name, model.generation])
      if (modelKeys.has(key)) {
        issue(
          ['models', i],
          `Повтор модели: ${model.make} ${model.name} ${model.generation ?? '(без поколения)'}`,
        )
      }
      modelKeys.add(key)
    })

    const engineKeys = new Set<string>()
    const modelsWithEngine = new Set<string>()
    engines.forEach((engine, i) => {
      if (!modelSlugs.has(engine.model))
        issue(['engines', i, 'model'], `Нет такой модели: ${engine.model}`)
      const key = JSON.stringify([engine.model, engine.code])
      if (engineKeys.has(key)) {
        issue(['engines', i, 'code'], `Повтор двигателя ${engine.code} в модели ${engine.model}`)
      }
      engineKeys.add(key)
      modelsWithEngine.add(engine.model)
    })

    models.forEach((model, i) => {
      if (!modelsWithEngine.has(model.slug))
        issue(['models', i], `У модели нет двигателей: ${model.slug}`)
    })
  })

export type ReferenceSeed = z.infer<typeof referenceSeedSchema>
