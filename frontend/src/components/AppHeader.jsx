import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function AppHeader() {
  const { usuario, logout } = useAuth()

  return (
    <header className="app-header">
      <Link className="brand" to="/produtos" aria-label="Início do Hortifruti">
        <span className="brand-mark" aria-hidden="true">🌿</span>
        <span>
          <strong>Hortifruti</strong>
          <small>Painel de Gestão</small>
        </span>
      </Link>

      <div className="header-right-area">
        <Link to="/caixa" className="button primary sm" title="Abrir Frente de Caixa">
          🛒 Frente de Caixa (PDV)
        </Link>

        {usuario && (
          <div className="user-profile-widget">
            <span className="user-role-badge">
              {usuario.perfil === 'GERENTE' ? '👑 Gerente' : '🛒 Operador'}
            </span>
            <span className="user-display-name">{usuario.nome}</span>
            <button
              type="button"
              className="button ghost sm logout-btn"
              onClick={logout}
              title="Sair do sistema"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default AppHeader
