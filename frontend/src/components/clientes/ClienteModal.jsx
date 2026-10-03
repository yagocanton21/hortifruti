import { useState } from 'react'

export default function ClienteModal({ cliente, onClose, onSave }) {
  const isEditing = Boolean(cliente)
  const [nome, setNome] = useState(cliente?.nome || '')
  const [telefone, setTelefone] = useState(cliente?.telefone || '')
  const [cpf, setCpf] = useState(cliente?.cpf || '')
  const [limite, setLimite] = useState(cliente?.limite_credito != null ? String(cliente.limite_credito) : '300.00')
  const [observacao, setObservacao] = useState(cliente?.observacao || '')
  const [ativo, setAtivo] = useState(cliente ? cliente.ativo : true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) {
      setErro('O nome do cliente é obrigatório.')
      return
    }

    setSalvando(true)
    try {
      await onSave({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        cpf: cpf.trim() || null,
        limite_credito: parseFloat(limite) || 0,
        observacao: observacao.trim() || null,
        ativo,
      })
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {erro && <div className="alert error">{erro}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Dona Maria Silva"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  CPF (opcional)
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Limite de Crédito Fiado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <small style={{ color: '#64748b' }}>Valor máximo de dívidas acumuladas na caderneta.</small>
              </div>

              {isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    Situação Cadastral
                  </label>
                  <select
                    value={ativo ? 'true' : 'false'}
                    onChange={(e) => setAtivo(e.target.value === 'true')}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo / Bloqueado</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Observações / Referência
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Vizinha da padaria, parente do Seu José"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={salvando}>
              {salvando ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
