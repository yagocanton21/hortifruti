from decimal import Decimal
from app.database.database import SessionLocal
from app.models.historico_preco import HistoricoPreco
from app.models.produto import Produto, UnidadeVenda

PRODUTOS_SEMENTE = [
    {"codigo_interno": "1001", "nome": "Banana Prata", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("6.99")},
    {"codigo_interno": "1002", "nome": "Maçã Gala Nacional", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("9.90")},
    {"codigo_interno": "1003", "nome": "Tomate Italiano", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("8.50")},
    {"codigo_interno": "1004", "nome": "Cebola Amarela", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("5.90")},
    {"codigo_interno": "1005", "nome": "Batata Inglesa Especial", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("6.50")},
    {"codigo_interno": "1006", "nome": "Cenoura Selecionada", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("7.20")},
    {"codigo_interno": "1007", "nome": "Laranja Pera Rio", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("4.99")},
    {"codigo_interno": "1008", "nome": "Melancia Inteira", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("2.80")},
    {"codigo_interno": "1009", "nome": "Mamão Papaya", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("11.90")},
    {"codigo_interno": "1010", "nome": "Limão Tahiti", "unidade_venda": UnidadeVenda.KG, "preco_atual": Decimal("5.50")},
    {"codigo_interno": "2001", "nome": "Alface Crespa Hidropônica", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("3.90")},
    {"codigo_interno": "2002", "nome": "Alface Americana", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("4.50")},
    {"codigo_interno": "2003", "nome": "Abacaxi Pérola Unidade", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("7.99")},
    {"codigo_interno": "2004", "nome": "Coco Verde Gelado", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("5.00")},
    {"codigo_interno": "2005", "nome": "Ovos Caipira (Bandeja 12un)", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("12.90")},
    {"codigo_interno": "2006", "nome": "Morango Selecionado 250g", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("8.90")},
    {"codigo_interno": "2007", "nome": "Cheiro Verde / Coentro Maço", "unidade_venda": UnidadeVenda.UN, "preco_atual": Decimal("2.50")},
]


def popular_catalogo_hortifruti():
    with SessionLocal() as db:
        adicionados = 0
        for item in PRODUTOS_SEMENTE:
            existente = db.query(Produto).filter_by(codigo_interno=item["codigo_interno"]).first()
            if not existente:
                prod = Produto(
                    codigo_interno=item["codigo_interno"],
                    nome=item["nome"],
                    unidade_venda=item["unidade_venda"],
                    preco_atual=item["preco_atual"],
                    ativo=True,
                )
                db.add(prod)
                db.flush()
                hist = HistoricoPreco(produto_id=prod.id, preco=item["preco_atual"])
                db.add(hist)
                adicionados += 1

        db.commit()
        print(f"Sucesso! {adicionados} produtos semente inseridos no catálogo.")


if __name__ == "__main__":
    popular_catalogo_hortifruti()
