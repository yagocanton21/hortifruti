import { Link } from 'react-router-dom'

function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" to="/produtos" aria-label="Início do Hortifruti">
        <span className="brand-mark" aria-hidden="true">H</span>
        <span>
          <strong>Hortifruti</strong>
          <small>Gestão da loja</small>
        </span>
      </Link>
      <div className="connection"><span /> Sistema local</div>
    </header>
  )
}

export default AppHeader
