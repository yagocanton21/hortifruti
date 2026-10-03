import { createContext, useContext, useEffect, useState } from 'react'
import { buscarMeuPerfil, clearAuth, getStoredUser, getToken, login as apiLogin } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => getStoredUser())
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCarregando(false)
      return
    }

    buscarMeuPerfil()
      .then((dados) => {
        setUsuario(dados)
      })
      .catch(() => {
        clearAuth()
        setUsuario(null)
      })
      .finally(() => {
        setCarregando(false)
      })
  }, [])

  async function login(username, senha) {
    const data = await apiLogin(username, senha)
    setUsuario(data.usuario)
    return data.usuario
  }

  function logout() {
    clearAuth()
    setUsuario(null)
  }

  const isGerente = usuario?.perfil === 'GERENTE'
  const isOperador = usuario?.perfil === 'OPERADOR'

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        isAuthenticated: !!usuario,
        isGerente,
        isOperador,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
