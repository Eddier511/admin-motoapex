import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"

import { auth, setToken, onUnauthorized, errorMessage } from "../lib/api"

import type { User } from "../types"

import { can as hasPermission } from "../lib/permissions"

import { toast } from "sonner"

import type { Page, Toast } from "../types"

interface AppContextType {
  currentPage: Page

  navigate: (page: Page, params?: Record<string, string>) => void

  pageParams: Record<string, string>

  addToast: (type: Toast["type"], message: string) => void

  sidebarCollapsed: boolean

  toggleSidebar: () => void

  isAuthenticated: boolean

  user: User | null

  can: (permission: string) => boolean

  loggingOut: boolean

  login: (email: string, password: string) => Promise<void>

  logout: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("login")

  const [pageParams, setPageParams] = useState<Record<string, string>>({})

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [user, setUser] = useState<User | null>(null)

  const [loggingOut, setLoggingOut] = useState(false)

  const isAuthenticated = !!user

  const can = (permission: string) => hasPermission(user, permission)

  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null)
        setCurrentPage("login")
        setPageParams({})
      }),
    [],
  )

  const navigate = useCallback(
    (page: Page, params: Record<string, string> = {}) => {
      setCurrentPage(page)

      setPageParams(params)
    },
    [],
  )

  const addToast = useCallback((type: Toast["type"], message: string) => {
    toast[type](message)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await auth.login(email.trim(), password)

    setToken(session.token)

    try {
      const identity = await auth.me()

      setUser(identity)
      setCurrentPage("dashboard")
      setPageParams({})
    } catch (error) {
      setToken(null)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await auth.logout()
      addToast("success", "Sesión cerrada")
    } catch (error) {
      addToast(
        "error",
        "No se pudo confirmar la revocación en el servidor. " +
          errorMessage(error),
      )
    } finally {
      setToken(null)
      setUser(null)
      setCurrentPage("login")
      setPageParams({})
      setLoggingOut(false)
    }
  }, [loggingOut, addToast])

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigate,
        pageParams,

        addToast,

        sidebarCollapsed,
        toggleSidebar,

        isAuthenticated,
        user,
        can,
        loggingOut,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)

  if (!ctx) throw new Error("useApp must be inside AppProvider")

  return ctx
}
