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
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalItens, setTotalItens] = useState(0)
  const [tamanho, setTamanho] = useState(6)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [alterandoId, setAlterandoId] = useState(null)

  const carregar = useCallback(async (p = pagina, q = pesquisa, st = filtroAtivo, un = filtroUnidade, tam = tamanho) => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await listarProdutos({
        pagina: p,
        tamanho: tam,
        pesquisa: q,
        ativo: st,
        unidade_venda: un,
      })

      if (resposta && Array.isArray(resposta.itens)) {
        setProdutos(resposta.itens)
        setPagina(resposta.pagina)
        setTotalPaginas(resposta.total_paginas || 1)
        setTotalItens(resposta.total || 0)
      } else if (Array.isArray(resposta)) {
        setProdutos(resposta)
        setTotalItens(resposta.length)
        setTotalPaginas(1)
      }
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [pagina, pesquisa, filtroAtivo, filtroUnidade, tamanho])

  useEffect(() => {
    carregar(pagina, pesquisa, filtroAtivo, filtroUnidade, tamanho)
  }, [pagina, filtroAtivo, filtroUnidade, tamanho, carregar])

  function handleBuscaSubmit(e) {
    e.preventDefault()
    setPagina(1)
    carregar(1, pesquisa, filtroAtivo, filtroUnidade, tamanho)
  }

  function limparFiltros() {
    setPesquisa('')
    setFiltroAtivo('')
    setFiltroUnidade('')
    setPagina(1)
    carregar(1, '', '', '')
  }

  async function alternarStatus(produto) {
    setAlterandoId(produto.id)
    setErro('')
    try {
      const atualizado = await alterarProduto(produto.id, { ativo: !produto.ativo })
      setProdutos((atuais) => atuais.map((item) => (item.id === atualizado.id ? atualizado : item)))
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
        <div className="heading-actions">
          <Link className="button secondary" to="/caixa" title="Abrir Frente de Caixa">
            🛒 Ir para o Caixa
          </Link>
          <Link className="button primary" to="/produtos/novo">
            + Novo produto
          </Link>
        </div>
      </div>

      <section className="panel">
        {/* Barra de Filtros e Busca */}
        <div className="filters-container">
          <form className="search-bar" onSubmit={handleBuscaSubmit}>
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar por código ou nome do produto..."
              />
              {pesquisa && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setPesquisa('')
                    carregar(1, '', filtroAtivo, filtroUnidade)
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <button className="button secondary" type="submit">
              Buscar
            </button>
          </form>

          {/* Chips de Filtros Rápidos */}
          <div className="quick-filters-row">
            <span className="filter-label">Filtros rápidos:</span>

            {/* Status */}
            <div className="filter-chips-group">
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === '' ? 'active' : ''}`}
                onClick={() => { setFiltroAtivo(''); setPagina(1); }}
              >
                Todos
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === 'true' ? 'active' : ''}`}
                onClick={() => { setFiltroAtivo('true'); setPagina(1); }}
              >
                🟢 Ativos
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroAtivo === 'false' ? 'active' : ''}`}
                onClick={() => { setFiltroAtivo('false'); setPagina(1); }}
              >
                ⚪ Inativos
              </button>
            </div>

            <div className="filter-divider" />

            {/* Unidade */}
            <div className="filter-chips-group">
              <button
                type="button"
                className={`filter-chip ${filtroUnidade === '' ? 'active' : ''}`}
                onClick={() => { setFiltroUnidade(''); setPagina(1); }}
              >
                Todas Unidades
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroUnidade === 'KG' ? 'active' : ''}`}
                onClick={() => { setFiltroUnidade('KG'); setPagina(1); }}
              >
                ⚖️ Por Quilo (KG)
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroUnidade === 'UN' ? 'active' : ''}`}
                onClick={() => { setFiltroUnidade('UN'); setPagina(1); }}
              >
                📦 Por Unidade (UN)
              </button>
            </div>

            {(pesquisa || filtroAtivo || filtroUnidade) && (
              <button type="button" className="text-button reset-filters" onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {erro && <div className="alert error" role="alert">{erro}</div>}

        {/* Tabela de Produtos */}
        {carregando ? (
          <div className="empty-state">Carregando catálogo de produtos...</div>
        ) : produtos.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum produto encontrado</strong>
            <span>Altere os filtros ou adicione um novo produto ao catálogo.</span>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Preço Atual</th>
                    <th>Situação</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((produto) => (
                    <tr key={produto.id}>
                      <td><span className="code">{produto.codigo_interno}</span></td>
                      <td>
                        <strong>{produto.nome}</strong>
                      </td>
                      <td>
                        <span className={`unit-tag ${produto.unidade_venda === 'KG' ? 'tag-kg' : 'tag-un'}`}>
                          {produto.unidade_venda === 'KG' ? '⚖️ Balança (KG)' : '📦 Unidade (UN)'}
                        </span>
                      </td>
                      <td className="price">
                        {moeda.format(Number(produto.preco_atual))}
                        <small className="unit-label">/{produto.unidade_venda}</small>
                      </td>
                      <td>
                        <span className={`badge ${produto.ativo ? 'active' : 'inactive'}`}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="actions">
                        <Link
                          className="text-button"
                          to={`/produtos/${produto.id}/historico-precos`}
                          title="Ver histórico de alterações de preços"
                        >
                          Histórico
                        </Link>
                        <Link
                          className="text-button"
                          to={`/produtos/${produto.id}/editar`}
                        >
                          Editar
                        </Link>
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

            {/* Barra de Paginação */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Mostrando <strong>{produtos.length}</strong> de <strong>{totalItens}</strong> produtos
                <span className="page-size-selector">
                  · Exibir:
                  {[6, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`size-btn ${tamanho === num ? 'active' : ''}`}
                      onClick={() => {
                        setTamanho(num)
                        setPagina(1)
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </span>
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  ◀ Anterior
                </button>

                <span className="pagination-current">
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                </span>

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                >
                  Próxima ▶
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default ProdutosPage
