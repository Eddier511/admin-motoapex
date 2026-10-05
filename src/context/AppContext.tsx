import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"

import {
  auth,
  setToken,
  onUnauthorized,
  errorMessage,
  post,
  type LoginResult,
} from "../lib/api"
import {
  Reauthenticate,
  type SensitiveAction,
  type SensitiveTask,
} from "../components/ui/Reauthenticate"

import type { User } from "../types"

import { can as hasPermission } from "../lib/permissions"

import { toast } from "sonner"

import type { Page, Toast } from "../types"
import { RecoveryCodes } from "../components/ui/RecoveryCodes"
import {
  Confirmation,
  type ConfirmationOptions,
} from "../components/ui/Confirmation"

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
  challenge: Extract<LoginResult, { challenge: string }> | null
  completeChallenge: (fields: {
    code?: string
    recoveryCode?: string
    newPassword?: string
  }) => Promise<void>
  clearSession: () => void
  updateUser: (user: User) => void
  sensitive: <T>(
    action: SensitiveAction,
    run: (token: string) => Promise<T>,
  ) => Promise<T>
  revealCodes: (codes: string[]) => void
  confirmAction: (options: ConfirmationOptions) => Promise<boolean>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("login")

  const [pageParams, setPageParams] = useState<Record<string, string>>({})

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  )

  const [user, setUser] = useState<User | null>(null)

  const [loggingOut, setLoggingOut] = useState(false)
  const [challenge, setChallenge] = useState<Extract<
    LoginResult,
    { challenge: string }
  > | null>(null)
  const [expiresAt, setExpiresAt] = useState("")
  const [task, setTask] = useState<SensitiveTask | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(
    null,
  )
  const confirmationResolve = useRef<((value: boolean) => void) | null>(null)
  const closeConfirmation = (accepted: boolean) => {
    const resolve = confirmationResolve.current
    confirmationResolve.current = null
    setConfirmation(null)
    resolve?.(accepted)
  }
  const confirmAction = (options: ConfirmationOptions): Promise<boolean> => {
    if (confirmationResolve.current) return Promise.resolve(false)
    return new Promise((resolve) => {
      confirmationResolve.current = resolve
      setConfirmation(options)
    })
  }
  useEffect(() => {
    if (!user) closeConfirmation(false)
  }, [user])
  useEffect(() => () => confirmationResolve.current?.(false), [])
  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    setChallenge(null)
    setExpiresAt("")
    setCurrentPage("login")
    setPageParams({})
  }, [])
  useEffect(() => {
    if (!expiresAt) return
    const timer = setTimeout(
      clearSession,
      Math.min(2147483647, Math.max(0, Date.parse(expiresAt) - Date.now())),
    )
    return () => clearTimeout(timer)
  }, [expiresAt, clearSession])
  useEffect(() => {
    if (!challenge) return
    const timer = setTimeout(
      () => setChallenge(null),
      Math.min(
        2147483647,
        Math.max(0, Date.parse(challenge.expiresAt) - Date.now()),
      ),
    )
    return () => clearTimeout(timer)
  }, [challenge])
  useEffect(() => {
    if (!user && task) {
      task.reject(new Error("La sesión terminó."))
      setTask(null)
    }
  }, [user, task])
  const sensitive = <T,>(
    action: SensitiveAction,
    run: (token: string) => Promise<T>,
  ): Promise<T> =>
    new Promise((resolve, reject) => {
      if (task) {
        reject(new Error("Hay una confirmación pendiente."))
        return
      }
      setTask({ action, run, resolve: (value) => resolve(value as T), reject })
    })

  const isAuthenticated = !!user

  const can = (permission: string) => hasPermission(user, permission)

  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null)
        setCurrentPage("login")
        setPageParams({})
        setChallenge(null)
        setExpiresAt("")
      }),
    [],
  )

  const navigate = useCallback(
    (page: Page, params: Record<string, string> = {}) => {
      setCurrentPage(page)

      setPageParams(params)
      if (window.matchMedia("(max-width: 767px)").matches)
        setSidebarCollapsed(true)
    },
    [],
  )

  const addToast = useCallback((type: Toast["type"], message: string) => {
    toast[type](message)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [])

  const acceptSession = useCallback(async (session: LoginResult) => {
    if (
      !Number.isFinite(Date.parse(session.expiresAt)) ||
      Date.parse(session.expiresAt) <= Date.now()
    )
      throw new Error("La autenticación venció. Inicia sesión de nuevo.")
    if ("challenge" in session) {
      setChallenge(session)
      return
    }
    if (!session.token || !session.expiresAt)
      throw new Error("Respuesta de autenticación inválida.")

    setToken(session.token)

    try {
      const identity = await auth.me()

      setUser(identity)
      setExpiresAt(session.expiresAt)
      setChallenge(null)
      setCurrentPage("dashboard")
      setPageParams({})
      toast.success("Sesión iniciada")
    } catch (error) {
      setToken(null)
      throw error
    }
  }, [])
  const login = useCallback(
    async (email: string, password: string) => {
      setChallenge(null)
      await acceptSession(await auth.login(email.trim(), password))
    },
    [acceptSession],
  )
  const completeChallenge = async (fields: {
    code?: string
    recoveryCode?: string
    newPassword?: string
  }) => {
    if (!challenge)
      throw new Error("El desafío venció. Inicia sesión de nuevo.")
    try {
      await acceptSession(
        await post<LoginResult>(
          challenge.challenge === "mfa_login"
            ? "/auth/mfa/challenge"
            : "/auth/password/required",
          { challengeToken: challenge.challengeToken, ...fields },
        ),
      )
    } catch (e) {
      setChallenge(null)
      throw e
    }
  }

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
      clearSession()
      setLoggingOut(false)
    }
  }, [loggingOut, addToast, clearSession])

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
        challenge,
        completeChallenge,
        clearSession,
        updateUser: setUser,
        sensitive,
        revealCodes: setCodes,
        confirmAction,
      }}
    >
      {children}
      {confirmation && (
        <Confirmation
          {...confirmation}
          onConfirm={() => closeConfirmation(true)}
          onCancel={() => closeConfirmation(false)}
        />
      )}
      {task && <Reauthenticate task={task} close={() => setTask(null)} />}
      {!!codes.length && (
        <RecoveryCodes codes={codes} close={() => setCodes([])} />
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)

  if (!ctx) throw new Error("useApp must be inside AppProvider")

  return ctx
}
