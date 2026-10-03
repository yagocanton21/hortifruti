import { moeda } from '../../utils/formatters.js'

export default function EstoqueKpiCards({ resumo }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card kpi-emerald">
        <div className="kpi-header">
          <span className="kpi-title">Produtos Controlados</span>
          <span className="kpi-icon-badge">📦</span>
        </div>
        <div className="kpi-value">
          {resumo?.total_produtos_controlados || 0}
        </div>
        <div className="kpi-footer">
          <span>Itens com controle ativo</span>
        </div>
      </div>

      <div className="kpi-card kpi-amber">
        <div className="kpi-header">
          <span className="kpi-title">Reposição Urgente</span>
          <span className="kpi-icon-badge">⚠️</span>
        </div>
        <div className="kpi-value">
          {resumo?.total_baixo_ou_critico || 0}
        </div>
        <div className="kpi-footer">
          <span>Abaixo do estoque mínimo</span>
        </div>
      </div>

      <div className="kpi-card kpi-red">
        <div className="kpi-header">
          <span className="kpi-title">Produtos Zerados</span>
          <span className="kpi-icon-badge">🔴</span>
        </div>
        <div className="kpi-value">
          {resumo?.total_zerados || 0}
        </div>
        <div className="kpi-footer">
          <span>Estoque físico esgotado</span>
        </div>
      </div>

      <div className="kpi-card kpi-green">
        <div className="kpi-header">
          <span className="kpi-title">Valor em Estoque</span>
          <span className="kpi-icon-badge">💰</span>
        </div>
        <div className="kpi-value">
          {moeda.format(Number(resumo?.valor_total_estoque || 0))}
        </div>
        <div className="kpi-footer">
          <span>Patrimônio em mercadorias</span>
        </div>
      </div>
    </div>
  )
}
