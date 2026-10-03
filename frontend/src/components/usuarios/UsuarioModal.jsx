import { useState } from 'react'

export default function UsuarioModal({ usuario, onClose, onSave }) {
  const isEditing = Boolean(usuario)
  const [nome, setNome] = useState(usuario?.nome || '')
  const [username, setUsername] = useState(usuario?.username || '')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState(usuario?.perfil || 'OPERADOR')
  const [ativo, setAtivo] = useState(usuario ? usuario.ativo : true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!nome.trim() || (!isEditing && !username.trim()) || (!isEditing && !senha.trim())) {
      setErro('Preencha os campos obrigatórios.')
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: nome.trim(),
        perfil,
        ativo,
      }
      if (!isEditing) {
        payload.username = username.trim().toLowerCase()
        payload.senha = senha.trim()
      } else if (senha.trim()) {
        payload.senha = senha.trim()
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? `Editar: ${usuario.username}` : 'Novo Operador / Usuário'}</h2>
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
                placeholder="Ex: Carlos Eduardo"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                Usuário / Login *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: carloseduardo"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: isEditing ? '#f1f5f9' : '#fff',
                }}
              />
              {isEditing && <small style={{ color: '#64748b' }}>O nome de usuário não pode ser alterado.</small>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={isEditing ? '••••••••' : 'Digite uma senha segura'}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                  Nível de Acesso (Perfil)
                </label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="OPERADOR">🛒 Operador de Caixa</option>
                  <option value="GERENTE">👑 Gerente / Administrador</option>
                </select>
              </div>

              {isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    Situação
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
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={salvando}>
              {salvando ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
