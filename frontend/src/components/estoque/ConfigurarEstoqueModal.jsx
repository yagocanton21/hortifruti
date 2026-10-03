import { useState } from 'react'
import { pesoFmt } from '../../utils/formatters.js'

export default function ConfigurarEstoqueModal({ produto, onClose, onConfirm }) {
  const isKg = produto?.unidade_venda === 'KG'
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    produto?.estoque_minimo !== undefined && produto?.estoque_minimo !== null
      ? String(produto.estoque_minimo)
      : '0'
  )
  const [controlaEstoque, setControlaEstoque] = useState(
    produto?.controla_estoque !== undefined ? Boolean(produto.controla_estoque) : true
  )
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const minNum = parseFloat(estoqueMinimo.toString().replace(',', '.'))
    if (isNaN(minNum) || minNum < 0) {
      setErro('Informe um estoque mínimo válido (maior ou igual a zero).')
      return
    }

    setSalvando(true)
    try {
      await onConfirm(produto.id, {
        estoque_minimo: minNum,
        controla_estoque: controlaEstoque,
      })
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar configurações de estoque.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Parâmetros de Estoque</h2>
            <small style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {produto?.nome} ({isKg ? '⚖️ Balança / KG' : '📦 Unidade / UN'})
            </small>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {erro && <div className="alert error">{erro}</div>}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <input
                id="check-controla"
                type="checkbox"
                checked={controlaEstoque}
                onChange={(e) => setControlaEstoque(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="check-controla" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                Controlar estoque deste produto
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                  Quando desativado, o produto não gera avisos de reposição nem bloqueios.
                </div>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Estoque Mínimo de Alerta ({isKg ? 'kg' : 'unidades'}) *
              </label>
              <input
                type="number"
                step={isKg ? '0.001' : '1'}
                min="0"
                required
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                placeholder={isKg ? 'Ex: 10.000' : 'Ex: 12'}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>
                Quando o saldo atingir ou ficar abaixo deste valor, o sistema exibirá o alerta amarelo de reposição.
              </small>
            </div>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#475569',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Saldo físico atual no sistema:</span>
              <strong>
                {isKg
                  ? `${pesoFmt.format(produto?.estoque_atual || 0)} kg`
                  : `${Number(produto?.estoque_atual || 0)} un`}
              </strong>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}
          >
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
