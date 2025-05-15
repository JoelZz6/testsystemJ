------------------------------------------------------------------------------------------------------------------
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
------------------------------------------------------------------------------------------------------------------
INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol)
VALUES ('admin', 'admin@empresa.com', '$2a$12$2ZYKXH0tcjtZhqkkEDOLeeEyguIg299C1sHCeCcEWM3i9NULi6WAO', 'administrador');
------------------------------------------------------------------------------------------------------------------
UPDATE usuarios
SET contrasena = 'tu_hash_generado'
WHERE nombre_usuario = 'admin';
------------------------------------------------------------------------------------------------------------------
SELECT id, nombre_usuario, correo, rol FROM usuarios;
------------------------------------------------------------------------------------------------------------------
UPDATE usuarios
SET nombre_usuario = 'admin'
WHERE correo = 'admin@empresa.com';
------------------------------------------------------------------------------------------------------------------
CREATE TABLE microempresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    base_datos VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
------------------------------------------------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'microempresas';
------------------------------------------------------------------------------------------------------------------
SELECT * FROM pg_roles WHERE rolname = 'postgres';
------------------------------------------------------------------------------------------------------------------
ALTER ROLE postgres WITH CREATEDB;
------------------------------------------------------------------------------------------------------------------
SELECT * FROM microempresas;
------------------------------------------------------------------------------------------------------------------
ALTER TABLE microempresas
ADD COLUMN mongo_categoria_ref VARCHAR(100);
------------------------------------------------------------------------------------------------------------------
CREATE TABLE permisos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
------------------------------------------------------------------------------------------------------------------
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
------------------------------------------------------------------------------------------------------------------
CREATE TABLE rol_permisos (
  rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id INTEGER REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);
------------------------------------------------------------------------------------------------------------------
ALTER TABLE usuarios
ADD COLUMN rol_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
------------------------------------------------------------------------------------------------------------------
INSERT INTO permisos (nombre, descripcion) VALUES
('crear_microempresa', 'Permite crear nuevas microempresas'),
('gestionar_categorias', 'Permite crear y gestionar categorías de productos'),
('ver_permisos', 'Permite ver la lista de permisos'),
('crear_roles', 'Permite crear nuevos roles'),
('asignar_permisos', 'Permite asignar permisos a roles'),
('ver_roles', 'Permite ver la lista de roles'),
('ver_productos', 'Permite ver productos'),
('agregar_productos', 'Permite agregar nuevos productos'),
('realizar_ventas', 'Permite realizar ventas'),
('ver_historial_ventas', 'Permite consultar el historial de ventas');
------------------------------------------------------------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Rol con todos los permisos');
------------------------------------------------------------------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;
------------------------------------------------------------------------------------------------------------------
UPDATE usuarios
SET rol_id = 1
WHERE correo = 'admin@empresa.com';
------------------------------------------------------------------------------------------------------------------
SELECT * FROM permisos;
SELECT * FROM roles;
SELECT * FROM rol_permisos;
SELECT id, nombre_usuario, correo, rol_id FROM usuarios;
------------------------------------------------------------------------------------------------------------------
INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol_id)
VALUES ('gerente1', 'gerente@empresa.com', 'hash_de_contraseña', 2);

INSERT INTO roles (nombre, descripcion) VALUES
('Cliente', 'Rol para usuarios clientes con permisos limitados');

SELECT id FROM permisos WHERE nombre = 'ver_productos';

INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (2, 7);

SELECT r.nombre, ARRAY_AGG(p.nombre) as permisos
FROM roles r
LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
LEFT JOIN permisos p ON rp.permiso_id = p.id
WHERE r.nombre = 'Cliente'
GROUP BY r.id;

INSERT INTO permisos (nombre, descripcion) VALUES
('ver_usuarios', 'Permite ver la lista de usuarios'),
('ver_microempresas', 'Permite ver la lista de microempresas'),
('ver_categorias', 'Permite ver la lista de categorías');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos WHERE nombre IN ('ver_usuarios', 'ver_microempresas', 'ver_categorias');

SELECT u.nombre_usuario, r.nombre as rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE u.correo = 'cliente1@ejemplo.com';

INSERT INTO roles (nombre, descripcion)
VALUES ('Cliente', 'Rol predeterminado para nuevos usuarios registrados')
RETURNING id;

SELECT * FROM roles WHERE nombre = 'Cliente';
SELECT * FROM rol_permisos WHERE rol_id = 2;

ALTER TABLE usuarios
ALTER COLUMN rol_id SET NOT NULL;

UPDATE usuarios
SET rol_id = 2
WHERE rol_id IS NULL;

SELECT u.id, u.nombre_usuario, u.correo, u.rol_id, r.nombre AS rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE u.correo = 'cliente1@ejemplo.com';

SELECT u.id, u.nombre_usuario, u.correo, u.rol_id, r.nombre AS rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE u.correo = 'cliente2@ejemplo.com';




+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++