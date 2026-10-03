export default function EstoqueFiltros({
  pesquisa,
  setPesquisa,
  filtroStatus,
  setFiltroStatus,
  filtroUnidade,
  setFiltroUnidade,
  onBuscar,
  onLimpar,
}) {
  return (
    <div className="filters-container">
      <form className="search-bar" onSubmit={onBuscar}>
        <div className="search-input-box">
          <span className="search-icon">🔍</span>
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Buscar por código ou nome do produto..."
          />
          {pesquisa && (
            <button type="button" className="clear-search-btn" onClick={() => setPesquisa('')}>
              ✕
            </button>
          )}
        </div>
        <button className="button secondary" type="submit">
          Buscar
        </button>
      </form>

      <div className="quick-filters-row">
        <span className="filter-label">Filtros rápidos:</span>
        <div className="filter-chips-group">
          <button
            type="button"
            className={`filter-chip ${filtroStatus === '' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`filter-chip ${filtroStatus === 'baixo' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('baixo')}
          >
            ⚠️ Abaixo do Mínimo
          </button>
          <button
            type="button"
            className={`filter-chip ${filtroStatus === 'zerado' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('zerado')}
          >
            🔴 Zerados
          </button>
        </div>

        <div className="filter-divider" />

        <div className="filter-chips-group">
          <button
            type="button"
            className={`filter-chip ${filtroUnidade === '' ? 'active' : ''}`}
            onClick={() => setFiltroUnidade('')}
          >
            Todas Unidades
          </button>
          <button
            type="button"
            className={`filter-chip ${filtroUnidade === 'KG' ? 'active' : ''}`}
            onClick={() => setFiltroUnidade('KG')}
          >
            ⚖️ Por Quilo (KG)
          </button>
          <button
            type="button"
            className={`filter-chip ${filtroUnidade === 'UN' ? 'active' : ''}`}
            onClick={() => setFiltroUnidade('UN')}
          >
            📦 Por Unidade (UN)
          </button>
        </div>

        {(pesquisa || filtroStatus || filtroUnidade) && (
          <button type="button" className="text-button reset-filters" onClick={onLimpar}>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
