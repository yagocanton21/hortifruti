import { useEffect, useState } from 'react'
import { obterExtratoCliente } from '../../services/api.js'
import { dataHoraFormat, moeda } from '../../utils/formatters.js'

export default function ExtratoClienteModal({ cliente, onClose }) {
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let montado = true
    setCarregando(true)
    obterExtratoCliente(cliente.id)
      .then((data) => {
        if (montado) setRegistros(data.registros || [])
      })
      .catch((err) => {
        if (montado) setErro(err.message || 'Erro ao carregar extrato.')
      })
      .finally(() => {
        if (montado) setCarregando(false)
      })

    return () => {
      montado = false
    }
  }, [cliente.id])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '780px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Extrato da Caderneta de Fiado</h2>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {cliente.nome} • Limite: {moeda.format(cliente.limite_credito)}
            </div>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: '#f1f5f9',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TOTAL EM ABERTO</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                {moeda.format(cliente.saldo_devedor)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>CRÉDITO DISPONÍVEL</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>
                {moeda.format(Math.max(0, cliente.limite_credito - cliente.saldo_devedor))}
              </div>
            </div>
          </div>

          {erro && <div className="alert error">{erro}</div>}

          {carregando ? (
            <div className="empty-state">Carregando movimentações do cliente...</div>
          ) : registros.length === 0 ? (
            <div className="empty-state">Nenhum registro encontrado nesta caderneta.</div>
          ) : (
            <div className="table-wrap">
              <table style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Tipo</th>
                    <th>Detalhe / Motivo</th>
                    <th>Valor</th>
                    <th>Saldo Posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const isPagamento = r.tipo === 'PAGAMENTO' || r.tipo === 'ESTORNO_VENDA'
                    return (
                      <tr key={r.id}>
                        <td>{dataHoraFormat.format(new Date(r.criado_em))}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: isPagamento ? '#dcfce7' : '#fee2e2',
                              color: isPagamento ? '#166534' : '#991b1b',
                            }}
                          >
                            {r.tipo === 'COMPRA'
                              ? '🛒 COMPRA'
                              : r.tipo === 'PAGAMENTO'
                              ? '💵 PAGAMENTO'
                              : r.tipo === 'ESTORNO_VENDA'
                              ? '↩️ ESTORNO'
                              : r.tipo}
                          </span>
                        </td>
                        <td>
                          <div>{r.observacao || '—'}</div>
                          {r.venda_id && <small style={{ color: '#64748b' }}>Venda #{r.venda_id}</small>}
                        </td>
                        <td>
                          <strong style={{ color: isPagamento ? '#16a34a' : '#dc2626' }}>
                            {isPagamento ? '-' : '+'} {moeda.format(r.valor)}
                          </strong>
                        </td>
                        <td style={{ fontWeight: 600 }}>{moeda.format(r.saldo_posterior)}</td>
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
