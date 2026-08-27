import { NavLink, Outlet } from 'react-router-dom'
import AppHeader from './AppHeader.jsx'

const grupos = [
  {
    titulo: 'Operação',
    itens: [
      { nome: 'Produtos', icone: 'P', caminho: '/produtos' },
      { nome: 'Pesagem', icone: 'B', caminho: '/pesagem' },
      { nome: 'Caixa', icone: 'C' },
      { nome: 'Estoque', icone: 'E' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { nome: 'Relatórios', icone: 'R' },
      { nome: 'Usuários', icone: 'U' },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [
      { nome: 'Backups', icone: 'B' },
      { nome: 'Configurações', icone: 'A' },
    ],
  },
]

function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-body">
        <aside className="sidebar" aria-label="Navegação principal">
          <nav>
            {grupos.map((grupo) => (
              <section className="nav-group" key={grupo.titulo}>
                <h2>{grupo.titulo}</h2>
                {grupo.itens.map((item) => item.caminho ? (
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
                ))}
              </section>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="version-dot" />
            <span><strong>Servidor local</strong><small>Versão 0.1</small></span>
          </div>
        </aside>
        <div className="main-area"><Outlet /></div>
      </div>
    </div>
  )
}

export default AppLayout
