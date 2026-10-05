import { Toaster } from "sonner"

export function ToastContainer() {
  return <Toaster position="top-right" theme="light" richColors closeButton
    duration={4500} toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }} />
}
