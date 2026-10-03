import { useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function PromocaoModal({ promocao, produtos, onClose, onSave }) {
  const isEditing = Boolean(promocao)
  const [produtoId, setProdutoId] = useState(
    promocao ? String(promocao.produto_id) : (produtos.length > 0 ? String(produtos[0].id) : '')
  )
  const [titulo, setTitulo] = useState(promocao?.titulo || 'Oferta Especial')
  const [preco, setPreco] = useState(promocao ? String(promocao.preco_promocional) : '')
  const [dataInicio, setDataInicio] = useState(
    promocao?.data_inicio ? new Date(promocao.data_inicio).toISOString().slice(0, 16) : ''
  )
  const [dataFim, setDataFim] = useState(
    promocao?.data_fim ? new Date(promocao.data_fim).toISOString().slice(0, 16) : ''
  )
  const [ativa, setAtiva] = useState(promocao ? promocao.ativa : true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const prodSelecionado = produtos.find((p) => p.id === parseInt(produtoId, 10))

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!produtoId) {
      setErro('Selecione um produto para a promoção.')
      return
    }
    const val = parseFloat(preco)
    if (isNaN(val) || val <= 0) {
      setErro('Informe um preço promocional válido.')
      return
    }

    setSalvando(true)
    try {
      await onSave({
        produto_id: parseInt(produtoId, 10),
        titulo: titulo.trim() || 'Promoção',
        preco_promocional: val,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : null,
        data_fim: dataFim ? new Date(dataFim).toISOString() : null,
        ativa,
      })
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar promoção.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Oferta' : 'Nova Oferta / Promoção'}</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {erro && <div className="alert error">{erro}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Título / Campanha *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Quarta da Feira - Tomate"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {!isEditing && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Selecione o Produto *
                </label>
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Atual: {moeda.format(p.preco_atual)}/{p.unidade_venda})
                    </option>
                  ))}
                </select>
                {prodSelecionado && (
                  <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Preço de tabela atual: <strong>{moeda.format(prodSelecionado.preco_atual)}</strong> por {prodSelecionado.unidade_venda}
                  </small>
                )}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Preço Promocional (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 4.99"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Início da Promoção
                </label>
                <input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <small style={{ color: '#64748b' }}>Vazio = Início imediato</small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Término da Promoção
                </label>
                <input
                  type="datetime-local"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <small style={{ color: '#64748b' }}>Vazio = Até desativar</small>
              </div>
            </div>

            {isEditing && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Situação da Oferta
                </label>
                <select
                  value={ativa ? 'true' : 'false'}
                  onChange={(e) => setAtiva(e.target.value === 'true')}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="true">🔥 Ativa no Caixa</option>
                  <option value="false">⏸️ Pausada</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={salvando}>
              {salvando ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Publicar Promoção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
