import { useCallback, useEffect, useState } from "react"

import { errorMessage } from "./api"

export function useRemote<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError("")
    setData(null)

    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [...dependencies, revision])

  const reload = useCallback(() => setRevision((v) => v + 1), [])

  return { data, setData, loading, error, reload }
}
