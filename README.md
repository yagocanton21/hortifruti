# Hortifruti - Sistema de Gestão & Frente de Caixa (PDV)

Sistema comercial completo para hortifrutis, mercearias e quitandas, construído com React, FastAPI, PostgreSQL e Docker Compose.

---

## 🚀 Como Inicializar

### No Windows (1 Clique)
Basta dar dois cliques no arquivo:
```cmd
iniciar_sistema.bat
```
O script verifica o Docker, sobe os serviços, aplica as migrações e abre o navegador automaticamente.

### Via Linha de Comando (Docker Compose)
```bash
docker compose up -d
```

Acesse:
- **Sistema Web**: [http://localhost:5173](http://localhost:5173)
- **Documentação da API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Saúde do Banco e API**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🔑 Credenciais Padrão de Acesso

| Perfil | Usuário | Senha | Acesso e Visibilidade |
| :--- | :--- | :--- | :--- |
| **Gerente** | `admin` | `admin` | Painel gerencial completo, barra lateral, cadastro e reajuste de preços de produtos, histórico de preços, relatórios e acesso ao Caixa. |
| **Operador de Caixa** | `caixa` | `123` | Direcionado imediatamente à **Frente de Caixa (PDV)**, em tela cheia e com **barra lateral gerencial 100% oculta**. |

---

## ✨ Funcionalidades Principais

### 🛒 1. Frente de Caixa (PDV)
- **Operação ágil com teclado e atalhos**:
  - `F2`: Foca no campo de código/leitor de código de barras.
  - `F3`: Abre consulta rápida de produtos com busca visual.
  - `F10`: Finaliza a venda e abre tela de pagamento.
  - `ESC`: Fecha modais.
- **Suporte nativo à Balança Etiquetadora (Toledo, Filizola, Elgin)**:
  - Lê automaticamente etiquetas de código de barras padrão EAN-13 iniciando em `2` (ex: `2000010012503`).
  - Decodifica o produto, peso e preço com 1 bip.
- **Multiplicador de quantidade**: Permite digitar `3*1001` para adicionar 3 unidades.
- **Finalização e Formas de Pagamento**: Dinheiro (com cálculo automático de troco), PIX, Cartão de Débito e Cartão de Crédito.
- **Cupom / Recibo**: Visualização e impressão de comprovante não fiscal.

### 📦 2. Gestão de Produtos & Catálogo
- **Filtros rápidos em chips**: *Todos*, *Ativos*, *Inativos*, *Por Quilo (KG)*, *Por Unidade (UN)*.
- **Busca em tempo real**: Localiza itens instantaneamente por código interno ou nome.
- **Paginação completa**: Controle de página, totalizador de itens e navegação leve.
- **Histórico e auditoria de preços**: Toda alteração de valor fica registrada com data e hora.

### ⚖️ 3. Pesagem Avulsa (Contingência)
- Permite pesagem manual e emissão de etiqueta Code 128 (60 × 40 mm) para casos em que a balança do setor não estiver operando.

### 💵 4. Gestão de Caixa & Gaveta (Padrão Pegasus)
- **Abertura Obrigatória**: Exige informação do fundo de troco antes de iniciar as vendas.
- **Controle de Gaveta em Tempo Real**: Monitora o saldo físico em dinheiro na gaveta.
- **Sangria & Suprimento**: Retirada para cofre com bloqueio de saldo insuficiente e entrada de troco com justificativa.
- **Recebimento de Fiado no Caixa**: Entra automaticamente como suprimento na gaveta física.
- **Fechamento de Caixa com Conferência**: Aponta automaticamente sobra ou falta de caixa.
- **Cupom Z de Fechamento**: Emissão de relatório de fechamento impresso com campos de assinatura para malote.

### 📖 5. Caderneta de Clientes & Venda Fiada
- **Cadastro e Limite de Crédito**: Gestão de clientes com limite individual de compras a prazo na caderneta.
- **Venda a Prazo no PDV**: Seleção de cliente no pagamento do caixa com cálculo instantâneo do limite disponível e bloqueio caso ultrapassado.
- **Recebimento no Caixa**: Quitação total ou parcial de dívidas de fiado diretamente pelo caixa com entrada física de dinheiro.
- **Extrato Completo**: Histórico detalhado de compras, pagamentos e estornos com saldo resultante em cada movimentação.

### 🏷️ 6. Promoções & Campanhas ("Quarta da Feira")
- **Descontos Automáticos no PDV**: Configure preços promocionais especiais para produtos com cálculo imediato ao bipar no caixa.
- **Programação de Vigência**: Início e término agendados (ex: ofertas semanais ou pontas de estoque).
- **Indicador Visual**: Selo `🔥 OFERTA` exibido na busca F3 e no cupom fiscal.

### ❌ 7. Cancelamento e Estorno de Vendas
- **Estorno Completo**: Cancelamento de vendas realizadas com justificativa obrigatória.
- **Recálculo do Caixa**: Ajusta o saldo físico esperado na gaveta e no relatório de turno.
- **Estorno de Débito**: Se a compra cancelada foi em Fiado, remove automaticamente o valor da dívida da caderneta do cliente.

### 📊 8. Relatório Gerencial de Vendas
- **Indicadores (KPIs)**: Faturamento líquido, ticket médio por cliente, total de vendas, faturamento por método (Dinheiro, PIX, Débito, Crédito e Fiado) e estornos.
- **Filtros por Data e Forma de Pagamento**: Análise por dia, semana ou mês.
- **Detalhamento de Compras**: Visualização item a item com pesos, valores e opção de cancelamento.

### 👥 9. Gestão de Usuários & Operadores
- Cadastro de novos operadores de caixa com login próprio.
- Troca de senhas e ativação/desativação de acessos.
- Separação estrita de perfis (`OPERADOR` vs `GERENTE`).

### 📊 10. Controle de Estoque & Gestão de Perdas (Hortifruti)
- **Precisão Decimal e Unidades**: Suporte nativo a 3 casas decimais (`Numeric(12, 3)`) para pesáveis (KG) e números inteiros para unidades (UN).
- **Baixa e Estorno Automáticos no PDV**: Cada venda finalizada baixa o estoque físico imediatamente; cancelamentos devolvem as mercadorias ao saldo.
- **Movimentações Manuais**: Entradas por compras/produtores, descartes/quebras de hortifruti (`PERDA`) e balanço/contagem física (`AJUSTE`).
- **Alertas de Reposição & Estoque Mínimo**: Indicadores visuais claros (`🟢 Normal`, `⚠️ Reposição Urgente`, `🔴 Zerado`).
- **Auditoria Completa**: Rastreabilidade com saldo anterior, posterior, motivo e operador responsável.

---

## 🧪 Testes Automatizados

O backend conta com **44 testes automatizados** cobrindo todas as regras de negócio, autenticação, vendas, estoque, fiado, promoções, estornos, pesagens, fechamento de caixa e blindagem contra erros:

```bash
docker compose exec -T backend pytest
```

---

## 💾 Backup de Segurança

### Em 1 Clique (Windows):
Basta dar dois cliques no arquivo:
```cmd
fazer_backup.bat
```
Ele gera automaticamente um arquivo `.sql` compactado na pasta `backups/` com a data e hora atual.

### Restauração do Banco:
```bash
docker compose exec -T db psql -U hortifruti -d hortifruti < backups/backup_hortifruti_XXXX.sql
```

