-- Migración para agregar campo date_of_birth a la tabla users
-- Ejecutar este script en la base de datos para agregar el nuevo campo

USE fastservices;

-- Agregar la columna date_of_birth a la tabla users
ALTER TABLE users 
ADD COLUMN date_of_birth DATE NULL 
AFTER phone;

-- Verificar la estructura de la tabla
DESCRIBE users;