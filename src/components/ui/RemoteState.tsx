import { LoadingOverlay } from "./LoadingOverlay"

export function RemoteState({
  loading,
  error,
  retry,
}: {
  loading?: boolean
  error?: string
  retry?: () => void
}) {
  if (loading) return <LoadingOverlay />

  if (error)
    return (
      <div role="alert" className="p-6 space-y-3 text-sm text-red-500">
        <p>{error}</p>
        {retry && (
          <button onClick={retry} className="border rounded-lg px-4 py-2">
            Reintentar
          </button>
        )}
      </div>
    )

  return null
}

export function Pending({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-semibold text-zinc-200">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Pendiente: la API v1 todavía no ofrece esta función.
        </p>
      </div>
    </div>
  )
}
