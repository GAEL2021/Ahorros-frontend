import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  type User,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/config/firebase'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  authError: string | null
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function mapFirebaseUser(user: User): Promise<AuthUser> {
  const token = await user.getIdToken()
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    token,
  }
}

function parseFirebaseError(err: unknown): string {
  if (!(err instanceof Error)) return 'Error desconocido.'
  const msg = err.message
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) return 'Email o contraseña incorrectos.'
  if (msg.includes('auth/email-already-in-use')) return 'Este email ya está registrado.'
  if (msg.includes('auth/weak-password')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('auth/invalid-email')) return 'El email no es válido.'
  if (msg.includes('auth/too-many-requests')) return 'Demasiados intentos. Intenta más tarde.'
  if (msg.includes('popup-closed-by-user')) return 'Inicio de sesión cancelado.'
  if (msg.includes('auth/configuration-not-found')) return 'Google Sign-In no está habilitado en Firebase Console.'
  return msg
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const initialCheckDone = useRef(false)

  useEffect(() => {
    // Handle redirect result (for Safari compatibility)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const mappedUser = await mapFirebaseUser(result.user)
          localStorage.setItem('authToken', mappedUser.token)
          setUser(mappedUser)
        }
        if (!initialCheckDone.current) {
          initialCheckDone.current = true
          setLoading(false)
        }
      })
      .catch((err) => {
        setAuthError(parseFirebaseError(err))
        if (!initialCheckDone.current) {
          initialCheckDone.current = true
          setLoading(false)
        }
      })

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const mappedUser = await mapFirebaseUser(firebaseUser)
          localStorage.setItem('authToken', mappedUser.token)
          setUser(mappedUser)
          setAuthError(null)
        } else {
          localStorage.removeItem('authToken')
          setUser(null)
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Error al obtener sesión')
      } finally {
        if (!initialCheckDone.current) {
          initialCheckDone.current = true
          setLoading(false)
        }
      }
    })

    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser && initialCheckDone.current) {
        const token = await firebaseUser.getIdToken()
        localStorage.setItem('authToken', token)
        setUser((prev) => (prev ? { ...prev, token } : prev))
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('authToken')
      setUser(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithRedirect(auth, provider)
    } catch (err) {
      setAuthError(parseFirebaseError(err))
    }
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const mappedUser = await mapFirebaseUser(result.user)
      localStorage.setItem('authToken', mappedUser.token)
      setUser(mappedUser)
    } catch (err) {
      setAuthError(parseFirebaseError(err))
    }
  }, [])

  const registerWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setAuthError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      const mappedUser = await mapFirebaseUser(result.user)
      localStorage.setItem('authToken', mappedUser.token)
      setUser(mappedUser)
    } catch (err) {
      setAuthError(parseFirebaseError(err))
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    localStorage.removeItem('authToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
