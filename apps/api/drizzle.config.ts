import { defineConfig } from 'drizzle-kit'
import { loadConfig } from './src/config/env.js'

const { database } = loadConfig()

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: { ...database, ssl: false },
})
