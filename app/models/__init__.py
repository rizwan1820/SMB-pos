from importlib import import_module
from pkgutil import iter_modules


def import_all_models() -> None:
    """Import model modules so SQLAlchemy registers them on Base.metadata."""
    package_name = __name__

    for module in iter_modules(__path__):
        if module.ispkg or module.name.startswith("_"):
            continue

        import_module(f"{package_name}.{module.name}")


import_all_models()
