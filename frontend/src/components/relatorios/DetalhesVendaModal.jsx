import { useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function DetalhesVendaModal({ venda, onClose, onCancelar }) {
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelamento, setErroCancelamento] = useState('')

  async function handleConfirmarCancelamento(e) {
    e.preventDefault()
    if (!motivo.trim()) {
      setErroCancelamento('Por favor, informe o motivo do cancelamento / devolução.')
      return
    }

    setCancelando(true)
    setErroCancelamento('')
    try {
      await onCancelar(venda.id, motivo.trim())
      onClose()
    } catch (err) {
      setErroCancelamento(err.message || 'Erro ao cancelar venda.')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal-content md" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>Detalhes da Venda #{venda.codigo_venda}</h3>
          <button className="pos-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="pos-modal-body">
          {venda.cancelada_em && (
            <div
              style={{
                backgroundColor: '#450a0a',
                border: '1px solid #7f1d1d',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                color: '#fca5a5',
                fontSize: '0.9rem',
              }}
            >
              <strong>⚠️ Esta venda foi CANCELADA em {new Date(venda.cancelada_em).toLocaleString('pt-BR')}</strong>
              <div>Motivo: {venda.motivo_cancelamento || 'Não especificado'}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.9rem', color: '#9cb4a4' }}>
            <div>
              Data: <strong>{new Date(venda.criado_em).toLocaleString('pt-BR')}</strong>
            </div>
            <div>
              Forma: <strong>{venda.forma_pagamento}</strong>
            </div>
          </div>

          <table className="table" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-right">Qtd / Peso</th>
                <th className="text-right">Unitário</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens?.map((it) => (
                <tr key={it.id}>
                  <td>
                    <strong>{it.nome}</strong> <small style={{ color: '#688c74' }}>({it.codigo_interno})</small>
                  </td>
                  <td className="text-right">
                    {it.quantidade_ou_peso} {it.unidade_venda}
                  </td>
                  <td className="text-right">{moeda.format(Number(it.preco_unitario))}</td>
                  <td className="text-right font-bold">{moeda.format(Number(it.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #23352a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              {Number(venda.desconto) > 0 && (
                <span style={{ color: '#ffb84d', marginRight: '16px' }}>
                  Desconto: {moeda.format(Number(venda.desconto))}
                </span>
              )}
              {venda.forma_pagamento === 'DINHEIRO' && (
                <span style={{ color: '#8fa897' }}>Troco: {moeda.format(Number(venda.troco))}</span>
              )}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: venda.cancelada_em ? '#ef4444' : '#4eed84' }}>
              Total: {moeda.format(Number(venda.total))}
            </div>
          </div>

          {!venda.cancelada_em && !modalCancelarAberto && (
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #23352a', textAlign: 'right' }}>
              <button
                type="button"
                className="button"
                style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' }}
                onClick={() => setModalCancelarAberto(true)}
              >
                ❌ Cancelar / Estornar Venda
              </button>
            </div>
          )}

          {modalCancelarAberto && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#1f1313',
                border: '1px solid #991b1b',
                borderRadius: '8px',
              }}
            >
              <h4 style={{ color: '#fca5a5', margin: '0 0 8px' }}>
                Confirmar Cancelamento da Venda #{venda.codigo_venda}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#f87171', margin: '0 0 12px' }}>
                Atenção: O cancelamento estornará a transação do caixa e, se a venda foi em Fiado, o débito será retirado da conta do cliente.
              </p>

              {erroCancelamento && <div className="alert error" style={{ marginBottom: '8px' }}>{erroCancelamento}</div>}

              <label style={{ display: 'block', fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '6px' }}>
                Motivo do Cancelamento / Devolução *
              </label>
              <input
                type="text"
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Erro de digitação / Desistência do cliente"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0d1510',
                  border: '1px solid #4a1515',
                  color: '#fff',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setModalCancelarAberto(false)}
                  disabled={cancelando}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ backgroundColor: '#dc2626', color: '#fff' }}
                  onClick={handleConfirmarCancelamento}
                  disabled={cancelando}
                >
                  {cancelando ? 'Cancelando...' : 'Confirmar Estorno'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="pos-modal-footer">
          <button type="button" className="button ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
