import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PromocaoModal from '../components/promocoes/PromocaoModal.jsx'
import {
  alternarStatusPromocao,
  atualizarPromocao,
  criarPromocao,
  listarProdutos,
  listarPromocoes,
} from '../services/api.js'
import { dataHoraFormat, moeda } from '../utils/formatters.js'

export default function PromocoesPage() {
  const [promocoes, setPromocoes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('') // '' = todas, 'ativas', 'inativas'
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [alterandoId, setAlterandoId] = useState(null)

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [promocaoEditando, setPromocaoEditando] = useState(null)

  const carregarLista = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const [promosData, prodsData] = await Promise.all([
        listarPromocoes({ apenasAtivas: filtroStatus === 'ativas' }),
        listarProdutos({ tamanho: 100, ativo: 'true' }),
      ])
      setPromocoes(promosData)
      setProdutos(prodsData.itens || prodsData || [])
    } catch (err) {
      setErro(err.message || 'Erro ao carregar promoções')
    } finally {
      setCarregando(false)
    }
  }, [filtroStatus])

  useEffect(() => {
    carregarLista()
  }, [carregarLista])

  async function handleToggleStatus(promo) {
    setAlterandoId(promo.id)
    setErro('')
    try {
      const updated = await alternarStatusPromocao(promo.id)
      setPromocoes((atuais) => atuais.map((p) => (p.id === updated.id ? updated : p)))
      setMensagemSucesso(`Promoção "${promo.titulo || 'Promoção'}" ${updated.ativa ? 'ativada' : 'pausada'} com sucesso!`)
    } catch (err) {
      setErro(err.message || 'Erro ao alterar status da promoção.')
    } finally {
      setAlterandoId(null)
    }
  }

  async function handleSalvarPromocao(dados) {
    if (promocaoEditando) {
      await atualizarPromocao(promocaoEditando.id, dados)
      setMensagemSucesso('Promoção atualizada com sucesso!')
    } else {
      await criarPromocao(dados)
      setMensagemSucesso('Promoção criada com sucesso!')
    }
    carregarLista()
  }

  const promocoesExibidas = promocoes.filter((p) => {
    if (filtroStatus === 'inativas' && p.ativa) return false
    if (!pesquisa.trim()) return true
    const q = pesquisa.toLowerCase()
    const tituloMatch = p.titulo?.toLowerCase().includes(q)
    const prod = produtos.find((prod) => prod.id === p.produto_id)
    const prodMatch = prod?.nome.toLowerCase().includes(q)
    return tituloMatch || prodMatch
  })

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MARKETING & PREÇOS</span>
          <h1>Promoções e Ofertas</h1>
          <p>Configure ofertas automáticas no PDV ("Quarta da Feira", pontas de estoque e dias especiais).</p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary" to="/produtos" title="Catálogo de Produtos">
            📦 Catálogo
          </Link>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setPromocaoEditando(null)
              setModalAberto(true)
            }}
          >
            + Nova Oferta
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
                placeholder="Buscar por título ou produto da promoção..."
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
                className={`filter-chip ${filtroStatus === '' ? 'active' : ''}`}
                onClick={() => setFiltroStatus('')}
              >
                Todas
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroStatus === 'ativas' ? 'active' : ''}`}
                onClick={() => setFiltroStatus('ativas')}
              >
                🔥 Ativas Agora
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroStatus === 'inativas' ? 'active' : ''}`}
                onClick={() => setFiltroStatus('inativas')}
              >
                ⏸️ Pausadas / Encerradas
              </button>
            </div>

            {(pesquisa || filtroStatus) && (
              <button
                type="button"
                className="text-button reset-filters"
                onClick={() => { setPesquisa(''); setFiltroStatus(''); }}
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
          <div className="empty-state">Carregando ofertas programadas...</div>
        ) : promocoesExibidas.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhuma promoção encontrada</strong>
            <span>Crie uma nova oferta para movimentar as vendas no caixa.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Produto</th>
                  <th>Preço Regular</th>
                  <th>Preço Oferta</th>
                  <th>Período</th>
                  <th>Situação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {promocoesExibidas.map((promo) => {
                  const prod = produtos.find((p) => p.id === promo.produto_id)
                  const precoNormal = prod ? Number(prod.preco_atual) : 0
                  const precoPromo = Number(promo.preco_promocional)
                  const economia = precoNormal > 0 ? ((1 - precoPromo / precoNormal) * 100).toFixed(0) : 0

                  return (
                    <tr key={promo.id}>
                      <td>
                        <strong>{promo.titulo || 'Promoção'}</strong>
                      </td>
                      <td>
                        <div>{prod ? prod.nome : `Produto #${promo.produto_id}`}</div>
                        {prod && <small style={{ color: '#64748b' }}>Cód: {prod.codigo_interno} ({prod.unidade_venda})</small>}
                      </td>
                      <td style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                        {precoNormal > 0 ? moeda.format(precoNormal) : '—'}
                      </td>
                      <td>
                        <strong style={{ color: '#16a34a', fontSize: '1.05rem' }}>{moeda.format(precoPromo)}</strong>
                        {Number(economia) > 0 && (
                          <span
                            style={{
                              marginLeft: '6px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            -{economia}%
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {promo.data_inicio ? dataHoraFormat.format(new Date(promo.data_inicio)) : 'Início imediato'}{' '}
                          →{' '}
                          {promo.data_fim ? dataHoraFormat.format(new Date(promo.data_fim)) : 'Sem término'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${promo.ativa ? 'active' : 'inactive'}`}>
                          {promo.ativa ? '🔥 Ativa' : 'Pausada'}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          type="button"
                          className="text-button"
                          disabled={alterandoId === promo.id}
                          onClick={() => handleToggleStatus(promo)}
                          title={promo.ativa ? 'Pausar promoção' : 'Ativar promoção'}
                        >
                          {alterandoId === promo.id ? 'Salvando...' : promo.ativa ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setPromocaoEditando(promo)
                            setModalAberto(true)
                          }}
                          title="Editar oferta"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <PromocaoModal
          promocao={promocaoEditando}
          produtos={produtos}
          onClose={() => {
            setModalAberto(false)
            setPromocaoEditando(null)
          }}
          onSave={handleSalvarPromocao}
        />
      )}
    </main>
  )
}
