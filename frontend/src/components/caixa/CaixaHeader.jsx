import { moeda } from '../../utils/formatters.js'

export default function CaixaHeader({
  usuario,
  saldoGaveta,
  onAbrirMovimentacao,
  onAbrirFechamento,
  onLogout,
}) {
  return (
    <header className="pos-header">
      <div className="pos-brand">
        <span className="pos-logo-icon">🌿</span>
        <div>
          <h1>HORTIFRUTI</h1>
          <small>Frente de Caixa #01</small>
        </div>
      </div>

      <div className="pos-drawer-badge" title="Dinheiro disponível na gaveta agora">
        <span>💵 Gaveta:</span>
        <strong>{moeda.format(saldoGaveta || 0)}</strong>
      </div>

      <div className="pos-shortcuts-bar">
        <span className="shortcut-badge"><strong>F3</strong> Consultar</span>
        <span className="shortcut-badge"><strong>F10</strong> Finalizar</span>
        <span className="shortcut-badge"><strong>ESC</strong> Cancelar</span>
      </div>

      <div className="pos-header-actions">
        <button
          type="button"
          className="button ghost sm"
          onClick={onAbrirMovimentacao}
          title="Retirada para cofre ou entrada de troco"
        >
          💵 Sangria / Suprimento
        </button>

        <button
          type="button"
          className="button secondary sm"
          onClick={onAbrirFechamento}
          title="Conferir gaveta e fechar o caixa do dia"
        >
          🔒 Fechar Caixa
        </button>
      </div>

      <div className="pos-user-area">
        <div className="pos-operator-info">
          <span className="operator-role">{usuario?.perfil === 'GERENTE' ? '👑 Gerente' : '🛒 Operador'}</span>
          <strong>{usuario?.nome || 'Operador'}</strong>
        </div>
        <button className="button ghost sm" onClick={onLogout} title="Sair do sistema">
          Sair
        </button>
      </div>
    </header>
  )
}
