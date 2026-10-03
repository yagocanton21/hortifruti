import { moeda } from '../../utils/formatters.js'

export default function ReciboModal({ venda, onNovaVenda }) {
  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content md" onClick={(e) => e.stopPropagation()}>
        <div className="pos-receipt-success">
          <div className="success-icon">✓</div>
          <h2>Venda Finalizada com Sucesso!</h2>
          <div className="receipt-box">
            <header>
              <strong>HORTIFRUTI</strong>
              <small>Cupom Não Fiscal · Venda #{venda.codigo_venda}</small>
            </header>
            <div className="receipt-items">
              {venda.itens.map((item) => (
                <div key={item.id} className="receipt-item-row">
                  <span>
                    {item.nome} ({item.quantidade_ou_peso} {item.unidade_venda})
                  </span>
                  <strong>{moeda.format(Number(item.subtotal))}</strong>
                </div>
              ))}
            </div>
            <div className="receipt-totals">
              <div>
                <span>Total:</span>
                <strong>{moeda.format(Number(venda.total))}</strong>
              </div>
              <div>
                <span>Forma:</span>
                <strong>{venda.forma_pagamento}</strong>
              </div>
              {venda.forma_pagamento === 'DINHEIRO' && (
                <>
                  <div>
                    <span>Pago:</span>
                    <span>{moeda.format(Number(venda.valor_pago))}</span>
                  </div>
                  <div>
                    <span>Troco:</span>
                    <strong>{moeda.format(Number(venda.troco))}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="pos-modal-footer">
            <button type="button" className="button ghost" onClick={() => window.print()}>
              🖨️ Imprimir Recibo
            </button>
            <button type="button" className="button primary lg" onClick={onNovaVenda} autoFocus>
              Nova Venda (Enter)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
