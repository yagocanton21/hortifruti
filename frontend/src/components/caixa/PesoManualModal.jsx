import { useRef, useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function PesoManualModal({ produto, onConfirmar, onClose }) {
  const [pesoManual, setPesoManual] = useState('')
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const p = parseFloat(pesoManual.toString().replace(',', '.'))
    if (isNaN(p) || p <= 0) {
      setErro('Informe um peso válido maior que zero (ex: 0,850 ou 1.250).')
      return
    }
    onConfirmar(produto, p)
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content sm" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>⚖️ Informar Peso do Produto</h3>
        </div>
        <form onSubmit={handleSubmit} className="pos-modal-body">
          {erro && <div className="pos-status-alert erro">{erro}</div>}
          <p>
            Produto: <strong>{produto.nome}</strong> ({moeda.format(Number(produto.preco_atual))}/kg)
          </p>
          <label>
            <span>Peso em quilogramas (kg):</span>
            <input
              ref={inputRef}
              autoFocus
              value={pesoManual}
              onChange={(e) => setPesoManual(e.target.value)}
              placeholder="Ex: 0,850 ou 1.250"
              required
            />
          </label>
          <div className="pos-modal-footer">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button primary">
              Confirmar e Inserir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
