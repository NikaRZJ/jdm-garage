import { ruRU } from '@mui/material/locale'
import { createTheme } from '@mui/material/styles'

/** Одна светлая тема на всё приложение (PRD §7). `ruRU` переводит встроенные тексты компонентов. */
export const theme = createTheme({ palette: { mode: 'light' } }, ruRU)
