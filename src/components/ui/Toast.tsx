import { Toaster } from "sonner"

export function ToastContainer() {
  return <Toaster position="top-right" theme="light" richColors closeButton
    mobileOffset={{ top: 76, right: 12, left: 12, bottom: 12 }}
    duration={4500} toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }} />
}
