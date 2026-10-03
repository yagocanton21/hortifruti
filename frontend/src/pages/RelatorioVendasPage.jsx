import { useEffect, useState } from 'react'
import DetalhesVendaModal from '../components/relatorios/DetalhesVendaModal.jsx'
import { cancelarVenda, listarVendas, obterResumoVendas } from '../services/api.js'
import { moeda } from '../utils/formatters.js'

export default function RelatorioVendasPage() {
  const [vendas, setVendas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')

  // Modal
  const [vendaSelecionada, setVendaSelecionada] = useState(null)

  async function carregarDados() {
    setCarregando(true)
    setErro('')
    try {
      const [resumoData, vendasData] = await Promise.all([
        obterResumoVendas({ data_inicio: dataInicio, data_fim: dataFim }),
        listarVendas({
          data_inicio: dataInicio,
          data_fim: dataFim,
          forma_pagamento: formaPagamento,
          limite: 100,
        }),
      ])
      setResumo(resumoData)
      setVendas(vendasData)
    } catch (err) {
      setErro(err.message || 'Erro ao carregar dados de vendas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function handleCancelarVenda(vendaId, motivo) {
    await cancelarVenda(vendaId, motivo)
    setMensagemSucesso('Venda cancelada e estornada com sucesso!')
    carregarDados()
  }

  function handleFiltrar(e) {
    e.preventDefault()
    carregarDados()
  }

  function limparFiltros() {
    setDataInicio('')
    setDataFim('')
    setFormaPagamento('')
    setTimeout(() => carregarDados(), 50)
  }

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GESTÃO</span>
          <h1>Relatório de Vendas</h1>
          <p>Visão consolidada do faturamento, formas de pagamento, cancelamentos e fiados.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="button secondary" onClick={carregarDados} title="Atualizar dados">
            🔄 Atualizar
          </button>
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

      {erro && <div className="alert error">{erro}</div>}

      {/* Cards de KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-title">Faturamento Líquido</span>
            <span className="kpi-icon-badge">💰</span>
          </div>
          <div className="kpi-value">
            {moeda.format(Number(resumo?.total_faturado || 0))}
          </div>
          <div className="kpi-footer">
            <span>{resumo?.total_vendas || 0} vendas ativas</span>
          </div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-header">
            <span className="kpi-title">Ticket Médio</span>
            <span className="kpi-icon-badge">📊</span>
          </div>
          <div className="kpi-value">
            {moeda.format(Number(resumo?.ticket_medio || 0))}
          </div>
          <div className="kpi-footer">
            <span>Média por compra</span>
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-header">
            <span className="kpi-title">Vendas em Dinheiro</span>
            <span className="kpi-icon-badge">💵</span>
          </div>
          <div className="kpi-value">
            {moeda.format(Number(resumo?.total_dinheiro || 0))}
          </div>
          <div className="kpi-footer">
            <span>Físico em gaveta</span>
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-title">PIX & Cartões</span>
            <span className="kpi-icon-badge">📱</span>
          </div>
          <div className="kpi-value">
            {moeda.format(
              Number(resumo?.total_pix || 0) +
                Number(resumo?.total_debito || 0) +
                Number(resumo?.total_credito || 0)
            )}
          </div>
          <div className="kpi-footer">
            <span>
              PIX: {moeda.format(Number(resumo?.total_pix || 0))} · Cartões: {moeda.format(Number(resumo?.total_debito || 0) + Number(resumo?.total_credito || 0))}
            </span>
          </div>
        </div>

        {Number(resumo?.total_fiado || 0) > 0 && (
          <div className="kpi-card kpi-amber">
            <div className="kpi-header">
              <span className="kpi-title">Fiado / Caderneta</span>
              <span className="kpi-icon-badge">📖</span>
            </div>
            <div className="kpi-value">
              {moeda.format(Number(resumo?.total_fiado || 0))}
            </div>
            <div className="kpi-footer">
              <span>A receber dos clientes</span>
            </div>
          </div>
        )}

        {Number(resumo?.total_canceladas || 0) > 0 && (
          <div className="kpi-card kpi-red">
            <div className="kpi-header">
              <span className="kpi-title">Vendas Canceladas</span>
              <span className="kpi-icon-badge">❌</span>
            </div>
            <div className="kpi-value">
              {resumo.total_canceladas}
            </div>
            <div className="kpi-footer">
              <span>Estornos registrados</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="panel" style={{ marginBottom: '24px', padding: '18px 22px' }}>
        <form onSubmit={handleFiltrar} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', flex: '1 1 180px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Data Início:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{ height: '42px', border: '1px solid #cfd8ce', borderRadius: '8px', padding: '0 10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', flex: '1 1 180px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Data Fim:</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{ height: '42px', border: '1px solid #cfd8ce', borderRadius: '8px', padding: '0 10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', flex: '1 1 200px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Forma de Pagamento:</span>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              style={{ height: '42px', border: '1px solid #cfd8ce', borderRadius: '8px', padding: '0 10px' }}
            >
              <option value="">Todas as formas</option>
              <option value="DINHEIRO">💵 Dinheiro</option>
              <option value="PIX">📱 PIX</option>
              <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
              <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
              <option value="FIADO">📖 Fiado / Caderneta</option>
            </select>
          </label>

          <button type="submit" className="button primary" style={{ height: '42px' }}>
            Filtrar
          </button>
          <button type="button" className="button ghost" style={{ height: '42px' }} onClick={limparFiltros}>
            Limpar
          </button>
        </form>
      </div>

      {/* Tabela de Vendas */}
      <section className="panel">
        <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>
          Histórico de Vendas Recentes ({vendas.length})
        </h3>

        {carregando ? (
          <div className="empty-state">Carregando vendas...</div>
        ) : vendas.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum registro de venda encontrado</strong>
            <span>Altere o período ou realize novas vendas na Frente de Caixa.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código Venda</th>
                  <th>Data / Hora</th>
                  <th>Itens</th>
                  <th>Pagamento / Situação</th>
                  <th className="text-right">Desconto</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => {
                  const cancelada = Boolean(v.cancelada_em)
                  return (
                    <tr key={v.id} style={{ opacity: cancelada ? 0.65 : 1 }}>
                      <td>
                        <span className="code" style={{ color: cancelada ? '#ef4444' : '#28623b' }}>
                          {v.codigo_venda}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(v.criado_em).toLocaleString('pt-BR')}
                      </td>
                      <td>{v.itens?.length || 0} produto(s)</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {v.forma_pagamento === 'DINHEIRO' && '💵 Dinheiro'}
                            {v.forma_pagamento === 'PIX' && '📱 PIX'}
                            {v.forma_pagamento === 'CARTAO_DEBITO' && '💳 Débito'}
                            {v.forma_pagamento === 'CARTAO_CREDITO' && '💳 Crédito'}
                            {v.forma_pagamento === 'FIADO' && '📖 Fiado'}
                          </span>
                          {cancelada && (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                              }}
                            >
                              CANCELADA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right" style={{ color: '#64748b' }}>
                        {Number(v.desconto) > 0 ? moeda.format(Number(v.desconto)) : '-'}
                      </td>
                      <td
                        className="text-right font-bold"
                        style={{
                          color: cancelada ? '#ef4444' : '#0f172a',
                          fontWeight: 700,
                          fontSize: '1rem',
                          textDecoration: cancelada ? 'line-through' : 'none',
                        }}
                      >
                        {moeda.format(Number(v.total))}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="button ghost"
                          style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem' }}
                          onClick={() => setVendaSelecionada(v)}
                        >
                          Ver Detalhes
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

      {vendaSelecionada && (
        <DetalhesVendaModal
          venda={vendaSelecionada}
          onClose={() => setVendaSelecionada(null)}
          onCancelar={handleCancelarVenda}
        />
      )}
    </main>
  )
}
