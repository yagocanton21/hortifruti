from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.produto import UnidadeVenda


class ProdutoBase(BaseModel):
    codigo_interno: str = Field(min_length=1, max_length=20, examples=["0001"])
    nome: str = Field(min_length=1, max_length=120, examples=["Tomate Italiano"])
    unidade_venda: UnidadeVenda = Field(examples=[UnidadeVenda.KG])
    preco_atual: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
        examples=["14.90"],
    )
    ativo: bool = Field(default=True, examples=[True])

    @field_validator("codigo_interno", "nome")
    @classmethod
    def remover_espacos_externos(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("não pode conter apenas espaços")
        return value


class ProdutoCreate(ProdutoBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "codigo_interno": "0001",
                "nome": "Tomate Italiano",
                "unidade_venda": "KG",
                "preco_atual": "14.90",
                "ativo": True,
            }
        }
    )


class ProdutoUpdate(ProdutoBase):
    ativo: bool


class ProdutoPatch(BaseModel):
    codigo_interno: str | None = Field(default=None, min_length=1, max_length=20)
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    unidade_venda: UnidadeVenda | None = None
    preco_atual: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    ativo: bool | None = None

    @field_validator("codigo_interno", "nome")
    @classmethod
    def remover_espacos_externos(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("não pode conter apenas espaços")
        return value

    @model_validator(mode="after")
    def validar_campos_enviados(self) -> "ProdutoPatch":
        if not self.model_fields_set:
            raise ValueError("informe ao menos um campo para alterar")
        if any(getattr(self, campo) is None for campo in self.model_fields_set):
            raise ValueError("os campos enviados não podem ser nulos")
        return self


class ProdutoResponse(ProdutoBase):
    id: int
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "codigo_interno": "0001",
                "nome": "Tomate Italiano",
                "unidade_venda": "KG",
                "preco_atual": "14.90",
                "ativo": True,
                "id": 1,
                "criado_em": "2026-08-22T15:22:01.615918Z",
                "alterado_em": "2026-08-22T15:22:01.615918Z",
            }
        },
    )


class HistoricoPrecoResponse(BaseModel):
    id: int
    produto_id: int
    preco: Decimal
    registrado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class HistoricoPrecosPage(BaseModel):
    itens: list[HistoricoPrecoResponse]
    pagina: int
    tamanho: int
    total: int
    total_paginas: int
