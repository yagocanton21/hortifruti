import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppHeader from './AppHeader.jsx'

const gruposGerente = [
  {
    titulo: 'Operação',
    itens: [
      { nome: 'Frente de Caixa', icone: '🛒', caminho: '/caixa' },
      { nome: 'Produtos', icone: '📦', caminho: '/produtos' },
      { nome: 'Promoções & Ofertas', icone: '🏷️', caminho: '/promocoes' },
      { nome: 'Clientes & Fiado', icone: '📖', caminho: '/clientes' },
      { nome: 'Pesagem Avulsa', icone: '⚖️', caminho: '/pesagem' },
      { nome: 'Estoque & Perdas', icone: '📊', caminho: '/estoque' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { nome: 'Relatório de Vendas', icone: '📈', caminho: '/relatorios' },
      { nome: 'Usuários & Operadores', icone: '👥', caminho: '/usuarios' },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [
      { nome: 'Backups', icone: '💾' },
      { nome: 'Configurações', icone: '⚙️' },
    ],
  },
]

function AppLayout() {
  const { isGerente, isOperador } = useAuth()
  const location = useLocation()

  // Se o usuário for OPERADOR ou se estiver na tela do Caixa, esconde o painel lateral!
  const isTelaCaixa = location.pathname === '/caixa'
  const esconderSidebar = isOperador || isTelaCaixa

  return (
    <div className={`app-shell ${esconderSidebar ? 'no-sidebar' : ''}`}>
      {!isTelaCaixa && <AppHeader />}
      <div className="app-body">
        {!esconderSidebar && (
          <aside className="sidebar" aria-label="Navegação principal">
            <nav>
              {gruposGerente.map((grupo) => (
                <section className="nav-group" key={grupo.titulo}>
                  <h2>{grupo.titulo}</h2>
                  {grupo.itens.map((item) =>
                    item.caminho ? (
                      <NavLink
                        className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}
                        key={item.nome}
                        to={item.caminho}
                      >
                        <span className="nav-icon" aria-hidden="true">{item.icone}</span>
                        <span>{item.nome}</span>
                      </NavLink>
                    ) : (
                      <div className="nav-item disabled" key={item.nome} title="Funcionalidade futura">
                        <span className="nav-icon" aria-hidden="true">{item.icone}</span>
                        <span>{item.nome}</span>
                        <small>Em breve</small>
                      </div>
                    )
                  )}
                </section>
              ))}
            </nav>
            <div className="sidebar-footer">
              <span className="version-dot" />
              <span>
                <strong>Hortifruti Pro</strong>
                <small>Versão 1.0 Local</small>
              </span>
            </div>
          </aside>
        )}
        <div className={`main-area ${esconderSidebar ? 'full-width' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
