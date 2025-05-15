-- SQLBook: Code
-- Añadir columna tipo a la tabla microempresas
ALTER TABLE microempresas
ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'base_datos';

-- Asegurar que las microempresas existentes sean de tipo base_datos
UPDATE microempresas
SET tipo = 'base_datos'
WHERE tipo IS NULL;