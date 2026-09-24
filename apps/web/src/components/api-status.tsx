import { Alert, CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../api/health'

export function ApiStatus() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
  })

  if (isPending) {
    return <CircularProgress size={24} aria-label="Проверяем API" />
  }

  if (isError) {
    return <Alert severity="error">API недоступен</Alert>
  }

  return <Alert severity="success">API работает, запущен {data.uptimeSeconds} с назад</Alert>
}
