-- Tabla de roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Tabla de permisos
CREATE TABLE permisos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Tabla de relación entre roles y permisos
CREATE TABLE rol_permisos (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER REFERENCES roles(id),
  permiso_id INTEGER REFERENCES permisos(id),
  UNIQUE (rol_id, permiso_id)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena TEXT NOT NULL,
  rol_id INTEGER REFERENCES roles(id) NOT NULL
);

-- Tabla de microempresas
CREATE TABLE microempresas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  nombre_base_datos VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de relación entre usuarios y microempresas
CREATE TABLE usuario_microempresas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  microempresa_id INTEGER REFERENCES microempresas(id),
  UNIQUE (usuario_id, microempresa_id)
);

-- Insertar roles iniciales
INSERT INTO roles (nombre, descripcion)
VALUES 
  ('Administrador', 'Rol con todos los permisos del sistema'),
  ('Gerente', 'Rol para gerentes de microempresas'),
  ('Cliente', 'Rol predeterminado para nuevos usuarios registrados');

-- Insertar permisos iniciales
INSERT INTO permisos (nombre, descripcion)
VALUES 
  ('crear_microempresa', 'Permite crear nuevas microempresas'),
  ('gestionar_categorias', 'Permite gestionar categorías de productos'),
  ('ver_permisos', 'Permite ver la lista de permisos'),
  ('crear_roles', 'Permite crear nuevos roles'),
  ('asignar_permisos', 'Permite asignar permisos a roles'),
  ('ver_roles', 'Permite ver la lista de roles'),
  ('ver_productos', 'Permite ver los productos de una microempresa'),
  ('agregar_productos', 'Permite agregar nuevos productos'),
  ('realizar_ventas', 'Permite realizar ventas'),
  ('ver_historial_ventas', 'Permite ver el historial de ventas'),
  ('ver_usuarios', 'Permite ver la lista de todos los usuarios registrados'),
  ('asignar_gerentes', 'Permite asignar gerentes a microempresas'),
  ('ver_microempresas', 'Permite ver las microempresas asignadas o todas para administradores');

-- Asignar permisos al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Asignar permisos al rol Gerente
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre IN (
  'gestionar_categorias', 
  'ver_productos', 
  'agregar_productos', 
  'realizar_ventas', 
  'ver_historial_ventas',
  'ver_microempresas'
);

-- Asignar permisos al rol Cliente
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE nombre = 'ver_productos';

-- Crear la tabla usuario_microempresas si no existe
CREATE TABLE IF NOT EXISTS usuario_microempresas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  microempresa_id INTEGER REFERENCES microempresas(id),
  UNIQUE (usuario_id, microempresa_id)
);

-- Insertar nuevos permisos
INSERT INTO permisos (nombre, descripcion)
VALUES 
  ('asignar_gerentes', 'Permite asignar gerentes a microempresas'),
  ('ver_microempresas', 'Permite ver las microempresas asignadas o todas para administradores')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar nuevos permisos al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos WHERE nombre IN ('asignar_gerentes', 'ver_microempresas')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- Asignar permisos al rol Gerente
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre = 'ver_microempresas'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;