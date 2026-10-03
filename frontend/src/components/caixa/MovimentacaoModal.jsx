import { useState } from 'react'

export default function MovimentacaoModal({ onClose, onConfirmar }) {
  const [tipoMov, setTipoMov] = useState('SANGRIA')
  const [valorMov, setValorMov] = useState('')
  const [motivoMov, setMotivoMov] = useState('')
  const [erroMov, setErroMov] = useState('')
  const [processando, setProcessando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErroMov('')
    const val = parseFloat(valorMov.replace(',', '.'))
    if (isNaN(val) || val <= 0) {
      setErroMov('Informe um valor válido maior que zero.')
      return
    }
    if (!motivoMov.trim()) {
      setErroMov('Informe a justificativa/motivo da movimentação.')
      return
    }

    setProcessando(true)
    try {
      await onConfirmar(tipoMov, val, motivoMov.trim())
      onClose()
    } catch (err) {
      setErroMov(err.message || 'Erro ao registrar movimentação.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content sm" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>💵 Movimentação de Gaveta</h3>
          <button className="pos-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="pos-modal-body">
          {erroMov && <div className="pos-status-alert erro">{erroMov}</div>}

          <div className="pos-mov-type-selector">
            <button
              type="button"
              className={`pos-mov-btn ${tipoMov === 'SANGRIA' ? 'active sangria' : ''}`}
              onClick={() => setTipoMov('SANGRIA')}
            >
              - SANGRIA (Retirada)
            </button>
            <button
              type="button"
              className={`pos-mov-btn ${tipoMov === 'SUPRIMENTO' ? 'active suprimento' : ''}`}
              onClick={() => setTipoMov('SUPRIMENTO')}
            >
              + SUPRIMENTO (Entrada)
            </button>
          </div>

          <label>
            <span>Valor (R$):</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valorMov}
              onChange={(e) => setValorMov(e.target.value)}
              placeholder="Ex: 50.00"
              autoFocus
              required
            />
          </label>

          <label style={{ marginTop: '10px' }}>
            <span>Motivo / Justificativa:</span>
            <input
              type="text"
              value={motivoMov}
              onChange={(e) => setMotivoMov(e.target.value)}
              placeholder={tipoMov === 'SANGRIA' ? 'Ex: Recolhimento para o cofre' : 'Ex: Troco de moedas'}
              required
            />
          </label>

          <div className="pos-modal-footer">
            <button type="button" className="button ghost" onClick={onClose} disabled={processando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={processando}>
              {processando ? 'Salvando...' : 'Confirmar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
