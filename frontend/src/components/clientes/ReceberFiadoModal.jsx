import { useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function ReceberFiadoModal({ cliente, onClose, onConfirm }) {
  const [valor, setValor] = useState(String(cliente.saldo_devedor.toFixed(2)))
  const [observacao, setObservacao] = useState('Recebimento no caixa')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const val = parseFloat(valor)
    if (isNaN(val) || val <= 0) {
      setErro('Informe um valor de pagamento válido e maior que zero.')
      return
    }

    setSalvando(true)
    try {
      await onConfirm(cliente.id, val, observacao.trim() || undefined)
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao registrar pagamento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Receber Conta de Fiado</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {erro && <div className="alert error">{erro}</div>}

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Cliente</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>{cliente.nome}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>Dívida Atual:</span>
                <strong style={{ fontSize: '1.25rem', color: '#dc2626' }}>
                  {moeda.format(cliente.saldo_devedor)}
                </strong>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Valor a Pagar (R$) *</label>
                <button
                  type="button"
                  className="text-button"
                  style={{ fontSize: '0.8rem', color: '#0284c7' }}
                  onClick={() => setValor(String(cliente.saldo_devedor.toFixed(2)))}
                >
                  Pagar Total
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={cliente.saldo_devedor}
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
              />
              <small style={{ color: '#16a34a', display: 'block', marginTop: '4px' }}>
                💡 Este valor entrará automaticamente no saldo do seu turno de caixa aberto.
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Observação do Recebimento
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Recebido em dinheiro pelo operador"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" style={{ backgroundColor: '#16a34a' }} disabled={salvando}>
              {salvando ? 'Processando...' : 'Confirmar Recebimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
