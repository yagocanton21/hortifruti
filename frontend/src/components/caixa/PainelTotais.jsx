import { moeda } from '../../utils/formatters.js'

export default function PainelTotais({
  total,
  subtotal,
  descontoNum,
  itensCount,
  totalProdutosCatalogo,
  totalAtendimentos,
  onAbrirPagamento,
  onCancelarVenda,
}) {
  return (
    <aside className="pos-summary-section">
      <div className="pos-total-card">
        <span className="total-title">TOTAL A PAGAR</span>
        <div className="total-big-value">{moeda.format(total)}</div>
        <div className="total-meta-info">
          <span>{itensCount} item(ns) bipado(s)</span>
          {descontoNum > 0 && <span>Desconto: {moeda.format(descontoNum)}</span>}
        </div>
      </div>

      <div className="pos-actions-bar">
        <button
          className="button primary pos-btn-pay"
          disabled={itensCount === 0}
          onClick={onAbrirPagamento}
        >
          💳 FINALIZAR VENDA (F10)
        </button>
        <button
          className="button ghost pos-btn-cancel"
          disabled={itensCount === 0}
          onClick={onCancelarVenda}
        >
          ✕ Cancelar Venda
        </button>
      </div>

      <div className="pos-system-status">
        <div className="status-item">
          <span>Catálogo:</span>
          <strong>{totalProdutosCatalogo} produtos ativos</strong>
        </div>
        <div className="status-item">
          <span>Balança EAN-13:</span>
          <strong className="status-online">● Ativa (Prefix 2)</strong>
        </div>
        <div className="status-item">
          <span>Clientes Hoje:</span>
          <strong>{totalAtendimentos || 0} atendimentos</strong>
        </div>
      </div>
    </aside>
  )
}
