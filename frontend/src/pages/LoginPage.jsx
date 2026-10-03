import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const user = await login(username.trim(), senha)
      if (user.perfil === 'OPERADOR') {
        navigate('/caixa')
      } else {
        navigate('/produtos')
      }
    } catch (err) {
      setErro(err.message || 'Erro ao realizar login')
    } finally {
      setCarregando(false)
    }
  }

  function preencherRapido(user, pass) {
    setUsername(user)
    setSenha(pass)
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">🌿</span>
            <span className="logo-badge">PRO</span>
          </div>
          <h1>Hortifruti</h1>
          <p>Sistema Integrado de Gestão e Frente de Caixa</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {erro && (
            <div className="alert error" role="alert">
              {erro}
            </div>
          )}

          <label>
            <span>Usuário</span>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
              disabled={carregando}
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              disabled={carregando}
            />
          </label>

          <button className="button primary login-button" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="login-quick-access">
          <span className="quick-access-label">Acesso rápido para testes:</span>
          <div className="quick-access-buttons">
            <button
              type="button"
              className="button secondary sm"
              onClick={() => preencherRapido('admin', 'admin')}
            >
              👑 Gerente (admin)
            </button>
            <button
              type="button"
              className="button secondary sm"
              onClick={() => preencherRapido('caixa', '123')}
            >
              🛒 Operador (caixa)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
