import { useRef, useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function PagamentoModal({
  subtotal,
  total,
  clientesFiado,
  onClose,
  onConfirmarVenda,
}) {
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO')
  const [valorPago, setValorPago] = useState(total.toFixed(2))
  const [desconto, setDesconto] = useState('0.00')
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const inputValorPagoRef = useRef(null)

  const descontoNum = Number(desconto) || 0
  const valorPagoNum = Number(valorPago) || 0
  const troco = Math.max(0, valorPagoNum - total)

  const clienteSelecionado = clientesFiado.find((c) => c.id === parseInt(clienteSelecionadoId, 10))
  const limite = Number(clienteSelecionado?.limite_credito || 0)
  const divida = Number(clienteSelecionado?.saldo_devedor || 0)
  const disp = Math.max(0, limite - divida)
  const excede = total > disp

  async function handleConfirmar() {
    setErro('')
    if (descontoNum < 0) {
      setErro('O desconto não pode ser negativo.')
      return
    }
    if (descontoNum > subtotal) {
      setErro('O desconto não pode ser maior que o subtotal da compra.')
      return
    }
    if (formaPagamento === 'FIADO' && !clienteSelecionadoId) {
      setErro('Por favor, selecione o cliente para debitar na caderneta de fiado.')
      return
    }
    if (formaPagamento === 'DINHEIRO' && valorPagoNum < total) {
      setErro(`Valor recebido (${moeda.format(valorPagoNum)}) é menor que o total (${moeda.format(total)}).`)
      return
    }

    setSalvando(true)
    try {
      await onConfirmarVenda({
        formaPagamento,
        valorPago: formaPagamento === 'FIADO' ? '0.00' : (formaPagamento === 'DINHEIRO' ? valorPagoNum.toFixed(2) : total.toFixed(2)),
        desconto: descontoNum.toFixed(2),
        clienteId: formaPagamento === 'FIADO' ? parseInt(clienteSelecionadoId, 10) : undefined,
      })
    } catch (err) {
      setErro(err.message || 'Erro ao processar venda.')
      setSalvando(false)
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content md" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>💳 Finalizar Pagamento</h3>
          <button className="pos-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="pos-modal-body">
          {erro && <div className="pos-status-alert erro">{erro}</div>}

          <div className="pos-payment-methods">
            {[
              { id: 'DINHEIRO', label: '💵 Dinheiro' },
              { id: 'PIX', label: '📱 PIX' },
              { id: 'CARTAO_DEBITO', label: '💳 Débito' },
              { id: 'CARTAO_CREDITO', label: '💳 Crédito' },
              { id: 'FIADO', label: '📖 Fiado / Caderneta' },
            ].map((metodo) => (
              <button
                key={metodo.id}
                type="button"
                className={`payment-method-btn ${formaPagamento === metodo.id ? 'active' : ''}`}
                onClick={() => {
                  setFormaPagamento(metodo.id)
                  if (metodo.id === 'FIADO') {
                    setValorPago('0.00')
                  } else if (metodo.id !== 'DINHEIRO') {
                    setValorPago(total.toFixed(2))
                  }
                }}
              >
                {metodo.label}
              </button>
            ))}
          </div>

          {formaPagamento === 'FIADO' && (
            <div
              style={{
                margin: '14px 0',
                padding: '12px 14px',
                background: '#1c150b',
                border: '1px solid #4a3512',
                borderRadius: '8px',
              }}
            >
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b', marginBottom: '6px' }}>
                Selecione o Cliente (Caderneta de Fiado) *
              </label>
              <select
                value={clienteSelecionadoId}
                onChange={(e) => setClienteSelecionadoId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#0d1510',
                  color: '#fff',
                  border: '1px solid #78350f',
                  fontSize: '1rem',
                }}
              >
                <option value="">-- Escolha um cliente cadastrado --</option>
                {clientesFiado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} (Dívida: {moeda.format(c.saldo_devedor)} / Limite: {moeda.format(c.limite_credito)})
                  </option>
                ))}
              </select>

              {clienteSelecionado && (
                <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fed7aa', marginBottom: '4px' }}>
                    <span>Limite: <strong>{moeda.format(limite)}</strong></span>
                    <span>Dívida Atual: <strong style={{ color: '#fca5a5' }}>{moeda.format(divida)}</strong></span>
                    <span>Disponível: <strong style={{ color: disp > 0 ? '#86efac' : '#f87171' }}>{moeda.format(disp)}</strong></span>
                  </div>
                  {excede && (
                    <div style={{ color: '#f87171', fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ Atenção: Esta compra ({moeda.format(total)}) ultrapassa o limite restante de {moeda.format(disp)}.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pos-payment-details">
            <div className="payment-row">
              <span>Total dos Produtos:</span>
              <strong>{moeda.format(subtotal)}</strong>
            </div>

            <div className="payment-row">
              <span>Desconto (R$):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="payment-discount-input"
              />
            </div>

            <div className="payment-row highlight">
              <span>VALOR A PAGAR:</span>
              <strong className="text-green">{moeda.format(total)}</strong>
            </div>

            {formaPagamento === 'DINHEIRO' && (
              <>
                <div className="payment-row">
                  <span>Valor Recebido (R$):</span>
                  <input
                    ref={inputValorPagoRef}
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="payment-received-input"
                    autoFocus
                  />
                </div>
                <div className="payment-row change-row">
                  <span>TROCO A DEVOLVER:</span>
                  <strong className="text-orange">{moeda.format(troco)}</strong>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="pos-modal-footer">
          <button type="button" className="button ghost" disabled={salvando} onClick={onClose}>
            Voltar (ESC)
          </button>
          <button
            type="button"
            className="button primary lg"
            disabled={salvando || (formaPagamento === 'DINHEIRO' && valorPagoNum < total) || (formaPagamento === 'FIADO' && !clienteSelecionadoId)}
            onClick={handleConfirmar}
          >
            {salvando ? 'Processando...' : 'Confirmar Venda (Enter)'}
          </button>
        </div>
      </div>
    </div>
  )
}
