/* 1. Crear base de datos y seleccionar */
CREATE DATABASE IF NOT EXISTS fastservices
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE fastservices;

/* 2. Tabla de usuarios (clientes, prestadores, admin) */
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role            ENUM('client','provider','admin') NOT NULL DEFAULT 'client',
    first_name      VARCHAR(60)                       NOT NULL,
    last_name       VARCHAR(60)                       NOT NULL,
    email           VARCHAR(120)                      NOT NULL UNIQUE,
    phone           VARCHAR(30)                       NOT NULL UNIQUE,
    date_of_birth   DATE,
    password_hash   CHAR(60)                          NOT NULL,
    is_active       TINYINT(1)                        NOT NULL DEFAULT 1,
    created_at      TIMESTAMP                         DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP                         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

/* 3. Perfil extra para prestadores */
CREATE TABLE provider_profiles (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT UNSIGNED NOT NULL,
    bio               TEXT,
    rating_avg        DECIMAL(3,2)   DEFAULT 0.0,
    total_reviews     INT UNSIGNED   DEFAULT 0,
    is_online         TINYINT(1)     NOT NULL DEFAULT 0,
    service_radius_km INT            DEFAULT 10,
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* 4. Tipos de servicio (electricista, plomero, etc.) */
CREATE TABLE service_types (
    id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(80) NOT NULL UNIQUE,
    icon  VARCHAR(120)
) ENGINE=InnoDB;

/* 5. Licencias profesionales + pivot con el prestador */
CREATE TABLE licenses (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE provider_licenses (
    provider_id   BIGINT UNSIGNED NOT NULL,
    license_id    INT UNSIGNED    NOT NULL,
    license_number VARCHAR(60),
    expiry_date   DATE,
    PRIMARY KEY (provider_id, license_id),
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (license_id)  REFERENCES licenses(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

/* 6. Solicitudes de servicio */
CREATE TABLE service_requests (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id          BIGINT UNSIGNED NOT NULL,
    service_type_id    INT UNSIGNED    NOT NULL,
    title              VARCHAR(120)    NOT NULL,
    description        TEXT,
    address            VARCHAR(255),
    latitude           DECIMAL(10,8),
    longitude          DECIMAL(11,8),
    scheduled_at       DATETIME,
    status             ENUM('new','quoted','accepted','in_progress','completed','rated','cancelled')
                       NOT NULL DEFAULT 'new',
    chosen_provider_id BIGINT UNSIGNED,
    total_cost         DECIMAL(10,2),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id)          REFERENCES users(id)             ON DELETE CASCADE,
    FOREIGN KEY (service_type_id)    REFERENCES service_types(id),
    FOREIGN KEY (chosen_provider_id) REFERENCES provider_profiles(id)
) ENGINE=InnoDB;

/* Índices útiles para filtros típicos */
CREATE INDEX idx_sr_client   ON service_requests(client_id, status);
CREATE INDEX idx_sr_provider ON service_requests(chosen_provider_id, status);

/* 7. Cotizaciones / ofertas de los prestadores */
CREATE TABLE quotes (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id          BIGINT UNSIGNED NOT NULL,
    provider_id         BIGINT UNSIGNED NOT NULL,
    message             TEXT,
    proposed_cost       DECIMAL(10,2)  NOT NULL,
    estimated_time_hrs  INT,
    status              ENUM('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id)  REFERENCES service_requests(id)  ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_quote_provider_request (request_id, provider_id)
) ENGINE=InnoDB;

CREATE INDEX idx_quotes_provider ON quotes(provider_id, status);

/* 8. Mensajes de chat asociados a la solicitud */
CREATE TABLE request_messages (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id    BIGINT UNSIGNED NOT NULL,
    sender_id     BIGINT UNSIGNED NOT NULL,
    receiver_id   BIGINT UNSIGNED NOT NULL,
    message_type  ENUM('text','image','file') DEFAULT 'text',
    content       TEXT NOT NULL,
    sent_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seen_at       TIMESTAMP NULL,
    FOREIGN KEY (request_id)  REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)   REFERENCES users(id)           ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id)           ON DELETE CASCADE,
    INDEX idx_req_msg_time (request_id, sent_at)
) ENGINE=InnoDB;

/* 9. Valoraciones del servicio */
CREATE TABLE ratings (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id  BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    client_id   BIGINT UNSIGNED NOT NULL,
    stars       TINYINT UNSIGNED NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id)  REFERENCES service_requests(id)  ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id)   REFERENCES users(id)             ON DELETE CASCADE,
    UNIQUE KEY uq_rating_request (request_id)
) ENGINE=InnoDB;

/* 10. Direcciones de usuarios */
CREATE TABLE addresses (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(100)    NOT NULL COMMENT 'Título de la dirección (ej: Casa, Trabajo, Oficina)',
    street          VARCHAR(200)    NOT NULL COMMENT 'Calle y número',
    city            VARCHAR(100)    NOT NULL COMMENT 'Ciudad',
    state           VARCHAR(100)    NOT NULL COMMENT 'Provincia/Estado',
    postal_code     VARCHAR(20)     NULL COMMENT 'Código postal',
    country         VARCHAR(100)    NOT NULL DEFAULT 'Argentina' COMMENT 'País',
    additional_info TEXT            NULL COMMENT 'Información adicional (departamento, piso, referencias)',
    is_default      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Si es la dirección por defecto del usuario',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Si la dirección está activa',
    latitude        VARCHAR(50)     NULL COMMENT 'Latitud para geolocalización futura',
    longitude       VARCHAR(50)     NULL COMMENT 'Longitud para geolocalización futura',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* Índices para optimizar consultas de direcciones */
CREATE INDEX idx_addr_user_id      ON addresses(user_id);
CREATE INDEX idx_addr_user_default ON addresses(user_id, is_default);
CREATE INDEX idx_addr_user_active  ON addresses(user_id, is_active);
CREATE INDEX idx_addr_city_state   ON addresses(city, state);

/* Triggers para asegurar que solo haya una dirección por defecto por usuario */
DELIMITER //
CREATE TRIGGER tr_addresses_ensure_single_default_before_insert 
BEFORE INSERT ON addresses
FOR EACH ROW
BEGIN
    IF NEW.is_default = 1 THEN
        UPDATE addresses 
        SET is_default = 0 
        WHERE user_id = NEW.user_id AND is_default = 1;
    END IF;
END//

CREATE TRIGGER tr_addresses_ensure_single_default_before_update 
BEFORE UPDATE ON addresses
FOR EACH ROW
BEGIN
    IF NEW.is_default = 1 AND OLD.is_default = 0 THEN
        UPDATE addresses 
        SET is_default = 0 
        WHERE user_id = NEW.user_id AND is_default = 1 AND id != NEW.id;
    END IF;
END//
DELIMITER ;



/* 12. Datos de ejemplo (3 licencias típicas) */
INSERT INTO licenses (code, name, description) VALUES
  ('ELEC', 'Electricista',      'Habilitación para trabajos eléctricos domiciliarios'),
  ('GAS',  'Gasista',           'Instalaciones y mantenimiento de gas'),
  ('LOCK', 'Cerrajero',         'Servicios de cerrajería residenciales');

/* -- Fin del esquema base FastServices -- */
