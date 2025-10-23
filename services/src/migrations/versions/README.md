# init y commit - agregar al env los modelos nuevos
alembic revision --autogenerate -m "upgrade"
# push
alembic upgrade head
