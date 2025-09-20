"""
Script para inicializar la base de datos y crear las tablas.
"""

import asyncio
from sqlalchemy import text
from database.database import engine, Base
from models import User, ProviderProfile  # noqa: F401 - Importar todos los modelos para que SQLAlchemy los registre


async def create_tables():
    """Crear todas las tablas en la base de datos."""
    print("Creando tablas en la base de datos...")

    async with engine.begin() as conn:
        # Crear todas las tablas definidas en los modelos
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Tablas creadas exitosamente!")


async def drop_tables():
    """Eliminar todas las tablas de la base de datos."""
    print("⚠️  Eliminando todas las tablas...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    print("🗑️  Tablas eliminadas!")


async def reset_database():
    """Reiniciar la base de datos (eliminar y crear todas las tablas)."""
    await drop_tables()
    await create_tables()


async def check_connection():
    """Verificar la conexión a la base de datos."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            print("✅ Conexión a la base de datos exitosa!")
            return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Inicializando base de datos FastServices...")

    asyncio.run(check_connection())

    # Opciones disponibles
    print("\nOpciones disponibles:")
    print("1. Crear tablas")
    print("2. Eliminar tablas")
    print("3. Reiniciar base de datos (eliminar y crear)")

    choice = input("\nSelecciona una opción (1-3): ").strip()

    if choice == "1":
        asyncio.run(create_tables())
    elif choice == "2":
        asyncio.run(drop_tables())
    elif choice == "3":
        confirm = (
            input("⚠️  ¿Estás seguro? Esto eliminará todos los datos (y/n): ")
            .strip()
            .lower()
        )
        if confirm == "y":
            asyncio.run(reset_database())
        else:
            print("Operación cancelada.")
    else:
        print("❌ Opción inválida.")

    print("\n🏁 Proceso completado!")
