import { z } from 'zod'

/**
 * Перечисления справочника (PRD §6.2). Одни и те же значения нужны схеме базы,
 * API и фронту, поэтому живут здесь.
 */

/** Форма кузова. Kei — класс автомобиля, а не форма кузова, поэтому он тег модели, а не значение здесь. */
export const bodyTypes = [
  'coupe',
  'sedan',
  'hatchback',
  'wagon',
  'roadster',
  'suv',
  'minivan',
  'pickup',
] as const
export const bodyTypeSchema = z.enum(bodyTypes)
export type BodyType = z.infer<typeof bodyTypeSchema>

/** Наддув двигателя: атмосферный, турбо, битурбо, механический нагнетатель. */
export const aspirations = ['na', 'turbo', 'twin_turbo', 'supercharged'] as const
export const aspirationSchema = z.enum(aspirations)
export type Aspiration = z.infer<typeof aspirationSchema>

export const fuels = ['petrol', 'diesel', 'hybrid'] as const
export const fuelSchema = z.enum(fuels)
export type Fuel = z.infer<typeof fuelSchema>
