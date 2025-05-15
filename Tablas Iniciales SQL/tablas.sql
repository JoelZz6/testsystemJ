-- SQLBook: Code
-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de microempresas
CREATE TABLE microempresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    base_datos VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación comerciantes-microempresas
CREATE TABLE comerciantes_microempresas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    microempresa_id INTEGER NOT NULL,
    fecha_asignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_microempresa
        FOREIGN KEY (microempresa_id)
        REFERENCES microempresas(id)
        ON DELETE CASCADE
);

-- Insertar usuario administrador
INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol)
VALUES ('admin', 'admin@empresa.com', '$2a$12$2ZYKXH0tcjtZhqkkEDOLeeEyguIg299C1sHCeCcEWM3i9NULi6WAO', 'administrador');
-- SQLBook: Code
CREATE INDEX idx_usuarios_correo ON usuarios (correo);
CREATE INDEX idx_comerciantes_microempresas_usuario_id ON comerciantes_microempresas (usuario_id);
CREATE INDEX idx_comerciantes_microempresas_microempresa_id ON comerciantes_microempresas (microempresa_id);
ALTER TABLE microempresas ADD CONSTRAINT unique_nombre UNIQUE (nombre);