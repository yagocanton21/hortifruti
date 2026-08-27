import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alterarProduto, listarProdutos } from '../services/api.js'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function ProdutosPage() {
  const [produtos, setProdutos] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [alterandoId, setAlterandoId] = useState(null)

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true)
    setErro('')
    try {
      setProdutos(await listarProdutos(filtros))
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true

    listarProdutos()
      .then((dados) => {
        if (ativo) setProdutos(dados)
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [])

  function pesquisar(event) {
    event.preventDefault()
    carregar({ pesquisa, ativo: filtroAtivo })
  }

  async function alternarStatus(produto) {
    setAlterandoId(produto.id)
    setErro('')
    try {
      const atualizado = await alterarProduto(produto.id, { ativo: !produto.ativo })
      setProdutos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item))
    } catch (error) {
      setErro(error.message)
    } finally {
      setAlterandoId(null)
    }
  }

  return (
    <main className="content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h1>Produtos</h1>
            <p>Gerencie os itens disponíveis para venda na loja.</p>
          </div>
          <Link className="button primary" to="/produtos/novo">+ Novo produto</Link>
        </div>

        <section className="panel">
          <form className="filters" onSubmit={pesquisar}>
            <label className="search-field">
              <span>Pesquisar</span>
              <input
                value={pesquisa}
                onChange={(event) => setPesquisa(event.target.value)}
                placeholder="Código ou nome do produto"
              />
            </label>
            <label>
              <span>Situação</span>
              <select value={filtroAtivo} onChange={(event) => setFiltroAtivo(event.target.value)}>
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </label>
            <button className="button secondary" type="submit">Buscar</button>
          </form>

          {erro && <div className="alert error" role="alert">{erro}</div>}

          {carregando ? (
            <div className="empty-state">Carregando produtos...</div>
          ) : produtos.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum produto encontrado</strong>
              <span>Altere os filtros ou cadastre o primeiro produto.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Produto</th><th>Unidade</th><th>Preço</th><th>Situação</th><th><span className="sr-only">Ações</span></th></tr></thead>
                <tbody>
                  {produtos.map((produto) => (
                    <tr key={produto.id}>
                      <td><span className="code">{produto.codigo_interno}</span></td>
                      <td><strong>{produto.nome}</strong></td>
                      <td>{produto.unidade_venda}</td>
                      <td className="price">{moeda.format(Number(produto.preco_atual))}</td>
                      <td><span className={`badge ${produto.ativo ? 'active' : 'inactive'}`}>{produto.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="actions">
                        <Link className="text-button" to={`/produtos/${produto.id}/editar`}>Editar</Link>
                        <button
                          className="text-button"
                          type="button"
                          disabled={alterandoId === produto.id}
                          onClick={() => alternarStatus(produto)}
                        >
                          {alterandoId === produto.id ? 'Salvando...' : produto.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </main>
  )
}

export default ProdutosPage
