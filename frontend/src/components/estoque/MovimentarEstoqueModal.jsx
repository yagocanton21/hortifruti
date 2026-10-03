import { useState } from 'react'
import { pesoFmt } from '../../utils/formatters.js'

export default function MovimentarEstoqueModal({ produtos, produtoInicial, onClose, onConfirm }) {
  const [produtoId, setProdutoId] = useState(
    produtoInicial ? String(produtoInicial.id) : (produtos.length > 0 ? String(produtos[0].id) : '')
  )
  const [tipo, setTipo] = useState('ENTRADA')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const prodSelecionado = produtos.find((p) => p.id === parseInt(produtoId, 10))
  const isKg = prodSelecionado?.unidade_venda === 'KG'
  const estoqueAtual = Number(prodSelecionado?.estoque_atual || 0)

  // Previsão do estoque pós-movimentação
  const qtdNum = parseFloat(quantidade.toString().replace(',', '.')) || 0
  let estoquePrevisto = estoqueAtual
  if (tipo === 'ENTRADA') estoquePrevisto = estoqueAtual + qtdNum
  else if (tipo === 'PERDA') estoquePrevisto = Math.max(0, estoqueAtual - qtdNum)
  else if (tipo === 'AJUSTE') estoquePrevisto = qtdNum

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!produtoId) {
      setErro('Selecione um produto.')
      return
    }
    if (isNaN(qtdNum) || (tipo !== 'AJUSTE' && qtdNum <= 0) || (tipo === 'AJUSTE' && qtdNum < 0)) {
      setErro('Informe uma quantidade válida maior que zero.')
      return
    }
    if (!motivo.trim()) {
      setErro('Informe o motivo ou justificativa da movimentação.')
      return
    }

    setSalvando(true)
    try {
      await onConfirm({
        produto_id: parseInt(produtoId, 10),
        tipo,
        quantidade: qtdNum,
        motivo: motivo.trim(),
      })
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao registrar movimentação de estoque.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Movimentar Estoque</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {erro && <div className="alert error">{erro}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Produto *
              </label>
              <select
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Atual: {isKg ? `${pesoFmt.format(p.estoque_atual)} kg` : `${Number(p.estoque_atual)} un`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Tipo de Movimentação *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '42px',
                    borderRadius: '9px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: tipo === 'ENTRADA' ? '2px solid #16a34a' : '1px solid #cfd8ce',
                    background: tipo === 'ENTRADA' ? '#dcfce7' : '#ffffff',
                    color: tipo === 'ENTRADA' ? '#15803d' : '#475569',
                    boxShadow: tipo === 'ENTRADA' ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                  }}
                  onClick={() => setTipo('ENTRADA')}
                >
                  📥 Entrada
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '42px',
                    borderRadius: '9px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: tipo === 'PERDA' ? '2px solid #ef4444' : '1px solid #cfd8ce',
                    background: tipo === 'PERDA' ? '#fee2e2' : '#ffffff',
                    color: tipo === 'PERDA' ? '#dc2626' : '#475569',
                    boxShadow: tipo === 'PERDA' ? '0 2px 8px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                  onClick={() => setTipo('PERDA')}
                >
                  🍂 Perda / Quebra
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '42px',
                    borderRadius: '9px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: tipo === 'AJUSTE' ? '2px solid #2563eb' : '1px solid #cfd8ce',
                    background: tipo === 'AJUSTE' ? '#dbeafe' : '#ffffff',
                    color: tipo === 'AJUSTE' ? '#1d4ed8' : '#475569',
                    boxShadow: tipo === 'AJUSTE' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                  onClick={() => setTipo('AJUSTE')}
                >
                  ⚖️ Balanço
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                {tipo === 'AJUSTE'
                  ? `Novo Saldo Contado (${isKg ? 'kg' : 'unidades'}) *`
                  : `Quantidade da ${tipo === 'ENTRADA' ? 'Entrada' : 'Perda'} (${isKg ? 'kg' : 'unidades'}) *`}
              </label>
              <input
                type="number"
                step={isKg ? '0.001' : '1'}
                min={tipo === 'AJUSTE' ? '0' : '0.001'}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder={isKg ? 'Ex: 15.500' : 'Ex: 24'}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>

            {/* Prévia do Resultado */}
            {qtdNum > 0 && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Saldo Atual:</span>
                  <div style={{ fontWeight: 600 }}>{isKg ? `${pesoFmt.format(estoqueAtual)} kg` : `${estoqueAtual} un`}</div>
                </div>
                <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>➔</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Saldo Resultante:</span>
                  <div style={{ fontWeight: 800, color: tipo === 'PERDA' ? '#ef4444' : '#16a34a', fontSize: '1.1rem' }}>
                    {isKg ? `${pesoFmt.format(estoquePrevisto)} kg` : `${estoquePrevisto} un`}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Motivo / Justificativa *
              </label>
              <input
                type="text"
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={
                  tipo === 'ENTRADA'
                    ? 'Ex: Compra Ceasa / Produtor Local'
                    : tipo === 'PERDA'
                    ? 'Ex: Frutas machucadas / Descarte por maturação excessiva'
                    : 'Ex: Contagem física de estoque semanal'
                }
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={salvando}>
              {salvando ? 'Processando...' : 'Confirmar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
