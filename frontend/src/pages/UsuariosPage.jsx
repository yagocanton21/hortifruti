import { useEffect, useState } from 'react'
import UsuarioModal from '../components/usuarios/UsuarioModal.jsx'
import { atualizarUsuario, criarUsuario, listarUsuarios } from '../services/api.js'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [alterandoId, setAlterandoId] = useState(null)

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)

  async function carregarLista() {
    setCarregando(true)
    setErro('')
    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch (err) {
      setErro(err.message || 'Erro ao carregar usuários')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarLista()
  }, [])

  async function alternarStatus(u) {
    setAlterandoId(u.id)
    setErro('')
    try {
      await atualizarUsuario(u.id, { ativo: !u.ativo })
      setUsuarios((atuais) =>
        atuais.map((item) => (item.id === u.id ? { ...item, ativo: !item.ativo } : item))
      )
    } catch (error) {
      setErro(error.message)
    } finally {
      setAlterandoId(null)
    }
  }

  async function handleSalvarUsuario(dados) {
    if (usuarioEditando) {
      await atualizarUsuario(usuarioEditando.id, dados)
      setMensagemSucesso(`Usuário ${usuarioEditando.username} atualizado com sucesso!`)
    } else {
      await criarUsuario(dados)
      setMensagemSucesso('Usuário cadastrado com sucesso!')
    }
    carregarLista()
  }

  const usuariosExibidos = usuarios.filter((u) => {
    if (filtroPerfil && u.perfil !== filtroPerfil) return false
    if (filtroAtivo !== '' && String(u.ativo) !== filtroAtivo) return false
    if (!pesquisa.trim()) return true
    const q = pesquisa.toLowerCase()
    return u.nome.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
  })

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTROLE DE ACESSO</span>
          <h1>Usuários e Operadores</h1>
          <p>Cadastre operadores de caixa, fiscais e administradores do sistema.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setUsuarioEditando(null)
              setModalAberto(true)
            }}
          >
            + Novo Operador
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="filters-container">
          <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar por nome ou login do usuário..."
              />
              {pesquisa && (
                <button type="button" className="clear-search-btn" onClick={() => setPesquisa('')}>
                  ✕
                </button>
              )}
            </div>
            <button className="button secondary" type="submit">
              Buscar
            </button>
          </form>

          <div className="quick-filters-row">
            <span className="filter-label">Filtros rápidos:</span>
            <div className="filter-chips-group">
              <button
                type="button"
                className={`filter-chip ${filtroPerfil === '' ? 'active' : ''}`}
                onClick={() => setFiltroPerfil('')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroPerfil === 'OPERADOR' ? 'active' : ''}`}
                onClick={() => setFiltroPerfil('OPERADOR')}
              >
                🛒 Operadores
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroPerfil === 'GERENTE' ? 'active' : ''}`}
                onClick={() => setFiltroPerfil('GERENTE')}
              >
                👑 Gerentes
              </button>
            </div>

            <div className="filter-divider" />

            <div className="filter-chips-group">
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === '' ? 'active' : ''}`}
                onClick={() => setFiltroAtivo('')}
              >
                Todas Situações
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === 'true' ? 'active' : ''}`}
                onClick={() => setFiltroAtivo('true')}
              >
                🟢 Ativos
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === 'false' ? 'active' : ''}`}
                onClick={() => setFiltroAtivo('false')}
              >
                ⚪ Inativos
              </button>
            </div>

            {(pesquisa || filtroPerfil || filtroAtivo) && (
              <button
                type="button"
                className="text-button reset-filters"
                onClick={() => { setPesquisa(''); setFiltroPerfil(''); setFiltroAtivo(''); }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {mensagemSucesso && (
          <div className="alert success" role="alert" style={{ marginBottom: '1rem' }}>
            <span>{mensagemSucesso}</span>
            <button
              type="button"
              className="text-button"
              style={{ marginLeft: 'auto', fontWeight: 'bold' }}
              onClick={() => setMensagemSucesso('')}
            >
              ✕
            </button>
          </div>
        )}

        {erro && <div className="alert error" role="alert" style={{ marginBottom: '1rem' }}>{erro}</div>}

        {carregando ? (
          <div className="empty-state">Carregando operadores cadastrados...</div>
        ) : usuariosExibidos.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum usuário encontrado</strong>
            <span>Altere os filtros ou adicione um novo operador.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Login (Usuário)</th>
                  <th>Perfil de Acesso</th>
                  <th>Situação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosExibidos.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nome}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.85rem' }}>{u.username}</code>
                    </td>
                    <td>
                      <span className={`unit-tag ${u.perfil === 'GERENTE' ? 'tag-kg' : 'tag-un'}`}>
                        {u.perfil === 'GERENTE' ? '👑 Gerente' : '🛒 Operador de Caixa'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.ativo ? 'active' : 'inactive'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setUsuarioEditando(u)
                          setModalAberto(true)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        disabled={alterandoId === u.id}
                        onClick={() => alternarStatus(u)}
                      >
                        {alterandoId === u.id ? 'Salvando...' : u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <UsuarioModal
          usuario={usuarioEditando}
          onClose={() => {
            setModalAberto(false)
            setUsuarioEditando(null)
          }}
          onSave={handleSalvarUsuario}
        />
      )}
    </main>
  )
}
