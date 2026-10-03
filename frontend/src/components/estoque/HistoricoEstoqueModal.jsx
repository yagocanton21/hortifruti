import { useEffect, useState } from 'react'
import { obterHistoricoEstoque } from '../../services/api.js'
import { dataHoraFormat, pesoFmt } from '../../utils/formatters.js'

export default function HistoricoEstoqueModal({ produto, onClose }) {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const isKg = produto.unidade_venda === 'KG'

  useEffect(() => {
    let montado = true
    setCarregando(true)
    obterHistoricoEstoque(produto.id)
      .then((data) => {
        if (montado) setHistorico(data || [])
      })
      .catch((err) => {
        if (montado) setErro(err.message || 'Erro ao carregar histórico.')
      })
      .finally(() => {
        if (montado) setCarregando(false)
      })

    return () => {
      montado = false
    }
  }, [produto.id])

  function getBadgeEstilo(tipo) {
    switch (tipo) {
      case 'ENTRADA':
        return { bg: '#dcfce7', color: '#166534', label: '📥 ENTRADA' }
      case 'PERDA':
        return { bg: '#fee2e2', color: '#991b1b', label: '🍂 PERDA / DESCARTE' }
      case 'AJUSTE':
        return { bg: '#e0f2fe', color: '#0369a1', label: '⚖️ BALANÇO' }
      case 'VENDA':
        return { bg: '#f1f5f9', color: '#475569', label: '🛒 VENDA PDV' }
      case 'ESTORNO_VENDA':
        return { bg: '#fef3c7', color: '#92400e', label: '↩️ ESTORNO VENDA' }
      default:
        return { bg: '#f1f5f9', color: '#334155', label: tipo }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '780px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Histórico de Movimentações</h2>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {produto.nome} ({produto.codigo_interno}) • Estoque Atual:{' '}
              <strong>{isKg ? `${pesoFmt.format(produto.estoque_atual)} kg` : `${Number(produto.estoque_atual)} un`}</strong>
            </div>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {erro && <div className="alert error">{erro}</div>}

          {carregando ? (
            <div className="empty-state">Carregando histórico de movimentações...</div>
          ) : historico.length === 0 ? (
            <div className="empty-state">Nenhuma movimentação registrada para este produto ainda.</div>
          ) : (
            <div className="table-wrap">
              <table style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Tipo</th>
                    <th>Motivo / Descrição</th>
                    <th>Qtd</th>
                    <th>Saldo Anterior</th>
                    <th>Saldo Posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((m) => {
                    const badge = getBadgeEstilo(m.tipo)
                    const isAdicao = m.tipo === 'ENTRADA' || m.tipo === 'ESTORNO_VENDA'
                    return (
                      <tr key={m.id}>
                        <td>{dataHoraFormat.format(new Date(m.criado_em))}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td>{m.motivo || '—'}</td>
                        <td>
                          <strong style={{ color: isAdicao ? '#16a34a' : '#dc2626' }}>
                            {isAdicao ? '+' : '-'} {isKg ? `${pesoFmt.format(m.quantidade)} kg` : `${Number(m.quantidade)} un`}
                          </strong>
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {isKg ? `${pesoFmt.format(m.estoque_anterior)} kg` : `${Number(m.estoque_anterior)} un`}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {isKg ? `${pesoFmt.format(m.estoque_posterior)} kg` : `${Number(m.estoque_posterior)} un`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="button secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
