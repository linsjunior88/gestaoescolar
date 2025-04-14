from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    scopes: list[str] = []


class TokenData(BaseModel):
    username: str
    scopes: list[str] = [] 