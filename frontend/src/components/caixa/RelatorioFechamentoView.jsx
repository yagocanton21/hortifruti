import { moeda } from '../../utils/formatters.js'

export default function RelatorioFechamentoView({ relatorio, usuario, onConcluir }) {
  const dif = Number(relatorio.diferenca_gaveta)
  const difCor = dif === 0 ? 'green' : (dif > 0 ? 'orange' : 'red')

  return (
    <div className="pos-screen" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div className="receipt-box" style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '12px' }}>
          <header style={{ borderBottomColor: '#aaa' }}>
            <strong style={{ color: '#000', fontSize: '1.3rem' }}>HORTIFRUTI</strong>
            <div style={{ fontWeight: 'bold', margin: '4px 0' }}>RELATÓRIO DE FECHAMENTO DE CAIXA</div>
            <small>Turno #{relatorio.id} · Operador: {usuario?.nome || 'Operador'}</small>
          </header>

          <div style={{ padding: '12px 0', borderBottom: '1px dashed #aaa', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
            <div>Abertura: {new Date(relatorio.aberto_em).toLocaleString('pt-BR')}</div>
            <div>Fechamento: {new Date(relatorio.fechado_em || Date.now()).toLocaleString('pt-BR')}</div>
          </div>

          <div style={{ padding: '12px 0', borderBottom: '1px dashed #aaa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong>MOVIMENTAÇÃO FINANCEIRA</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(+) Fundo Inicial:</span>
              <strong>{moeda.format(Number(relatorio.saldo_inicial))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(+) Vendas em Dinheiro:</span>
              <strong>{moeda.format(Number(relatorio.total_dinheiro))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(+) Suprimentos (Entradas):</span>
              <strong>{moeda.format(Number(relatorio.total_suprimentos))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(-) Sangrias (Retiradas):</span>
              <strong>{moeda.format(Number(relatorio.total_sangrias))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #ddd' }}>
              <strong>(=) ESPERADO NA GAVETA:</strong>
              <strong>{moeda.format(Number(relatorio.saldo_esperado_gaveta))}</strong>
            </div>
          </div>

          <div style={{ padding: '12px 0', borderBottom: '1px dashed #aaa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong>CONFERÊNCIA DA GAVETA</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Valor Contado:</span>
              <strong>{moeda.format(Number(relatorio.saldo_informado_gaveta))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Diferença:</span>
              <span style={{ color: difCor }}>
                {dif === 0
                  ? 'R$ 0,00 (Exato)'
                  : `${moeda.format(dif)} (${dif > 0 ? 'Sobra' : 'Falta'})`}
              </span>
            </div>
          </div>

          <div style={{ padding: '12px 0', borderBottom: '1px dashed #aaa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong>VENDAS ELETRÔNICAS (NÃO AFETAM GAVETA)</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PIX:</span>
              <strong>{moeda.format(Number(relatorio.total_pix))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cartão de Débito:</span>
              <strong>{moeda.format(Number(relatorio.total_debito))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cartão de Crédito:</span>
              <strong>{moeda.format(Number(relatorio.total_credito))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #ddd' }}>
              <strong>TOTAL GERAL VENDIDO:</strong>
              <strong>{moeda.format(Number(relatorio.total_vendas))}</strong>
            </div>
          </div>

          <div style={{ paddingTop: '28px', textAlign: 'center', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>____________________________________________<br />Assinatura do Operador</div>
            <div>____________________________________________<br />Assinatura do Gerente</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="button" className="button primary" style={{ flex: 1 }} onClick={() => window.print()}>
            🖨️ Imprimir Fechamento
          </button>
          <button
            type="button"
            className="button secondary"
            style={{ flex: 1 }}
            onClick={onConcluir}
          >
            Concluir e Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
