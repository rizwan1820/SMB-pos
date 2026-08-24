from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Category name is required")

        return value


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Category name is required")

        return value
