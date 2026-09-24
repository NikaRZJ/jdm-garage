import { Stack, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { ApiStatus } from '../components/api-status'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Каталог появится здесь
      </Typography>
      <ApiStatus />
    </Stack>
  )
}
