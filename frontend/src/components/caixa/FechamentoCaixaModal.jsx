import { useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function FechamentoCaixaModal({ caixaStatus, onClose, onConfirmar }) {
  const [dinheiroInformado, setDinheiroInformado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  const informado = parseFloat(dinheiroInformado.replace(',', '.')) || 0
  const esperado = Number(caixaStatus?.saldo_atual_gaveta || 0)
  const dif = informado - esperado
  const difArredondada = Math.round(dif * 100) / 100

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const val = parseFloat(dinheiroInformado.replace(',', '.'))
    if (isNaN(val) || val < 0) {
      setErro('Informe o valor total em dinheiro contado na gaveta.')
      return
    }

    setProcessando(true)
    try {
      await onConfirmar(val, observacoes)
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao fechar caixa.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content md" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>🔒 Fechamento de Caixa</h3>
          <button className="pos-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="pos-modal-body">
          {erro && <div className="pos-status-alert erro">{erro}</div>}

          <div className="pos-shift-summary-grid">
            <div className="col">
              <div className="row">
                <span>Fundo Inicial:</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.saldo_inicial || 0))}</strong>
              </div>
              <div className="row">
                <span>Vendas Dinheiro:</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_dinheiro || 0))}</strong>
              </div>
              <div className="row">
                <span>Suprimentos (+):</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_suprimentos || 0))}</strong>
              </div>
              <div className="row">
                <span>Sangrias (-):</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_sangrias || 0))}</strong>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <span>Vendas PIX:</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_pix || 0))}</strong>
              </div>
              <div className="row">
                <span>Vendas Débito:</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_debito || 0))}</strong>
              </div>
              <div className="row">
                <span>Vendas Crédito:</span>
                <strong>{moeda.format(Number(caixaStatus?.turno?.total_credito || 0))}</strong>
              </div>
              <div className="row" style={{ borderTop: '1px solid #233429', paddingTop: '4px' }}>
                <span>ESPERADO NA GAVETA:</span>
                <strong className="text-green">{moeda.format(esperado)}</strong>
              </div>
            </div>
          </div>

          <label>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Dinheiro Físico Contado na Gaveta (R$):</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dinheiroInformado}
              onChange={(e) => setDinheiroInformado(e.target.value)}
              placeholder="0.00"
              autoFocus
              required
              style={{ height: '48px', fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          </label>

          {dinheiroInformado !== '' && (
            difArredondada === 0 ? (
              <div className="pos-diff-banner ok">
                <span>✓ Caixa Bateu Exatamente!</span>
                <strong>Diferença: R$ 0,00</strong>
              </div>
            ) : difArredondada > 0 ? (
              <div className="pos-diff-banner sobra">
                <span>⚠️ Sobra de Caixa:</span>
                <strong>+ {moeda.format(difArredondada)}</strong>
              </div>
            ) : (
              <div className="pos-diff-banner falta">
                <span>❌ Falta de Caixa:</span>
                <strong>- {moeda.format(Math.abs(difArredondada))}</strong>
              </div>
            )
          )}

          <label style={{ marginTop: '12px' }}>
            <span>Observações de Fechamento (Opcional):</span>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Turno da manhã sem intercorrências"
            />
          </label>

          <div className="pos-modal-footer">
            <button type="button" className="button ghost" onClick={onClose} disabled={processando}>
              Cancelar
            </button>
            <button type="submit" className="button primary lg" disabled={processando}>
              {processando ? 'Fechando...' : '🔒 Confirmar e Fechar Caixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
