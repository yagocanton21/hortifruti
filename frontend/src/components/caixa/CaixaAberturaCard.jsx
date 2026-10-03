import { useState } from 'react'

export default function CaixaAberturaCard({ usuario, onLogout, onAbrirCaixa }) {
  const [fundoAbertura, setFundoAbertura] = useState('100.00')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const val = parseFloat(fundoAbertura.replace(',', '.'))
    if (isNaN(val) || val < 0) {
      setErro('Informe um valor de fundo de troco válido (ex: 100.00).')
      return
    }

    setProcessando(true)
    try {
      await onAbrirCaixa(val)
    } catch (err) {
      setErro(err.message || 'Erro ao abrir caixa.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="pos-screen" style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#0a0f0d' }}>
      <div className="pos-modal-content sm" style={{ background: '#121a15', border: '1px solid #1f3326', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h2 style={{ color: '#fff', margin: '8px 0 4px', fontSize: '1.5rem' }}>Caixa Fechado</h2>
          <p style={{ color: '#8fa897', fontSize: '0.9rem', margin: 0 }}>
            Operador: <strong>{usuario?.nome || 'Operador'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && <div className="pos-status-alert erro" style={{ marginBottom: '16px' }}>{erro}</div>}

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <span style={{ display: 'block', color: '#cfded4', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              Fundo de Troco Inicial (R$):
            </span>
            <input
              autoFocus
              type="number"
              step="0.01"
              min="0"
              value={fundoAbertura}
              onChange={(e) => setFundoAbertura(e.target.value)}
              placeholder="100.00"
              style={{
                width: '100%',
                height: '52px',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                textAlign: 'center',
                background: '#080d0a',
                border: '1px solid #284433',
                color: '#4eed84',
                borderRadius: '8px',
              }}
              required
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="submit"
              className="button primary lg"
              style={{ height: '52px', fontSize: '1.1rem', fontWeight: 700 }}
              disabled={processando}
            >
              {processando ? 'Abrindo...' : '🔓 Abrir Caixa e Iniciar Vendas'}
            </button>
            <button type="button" className="button ghost" onClick={onLogout}>
              Sair do Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
