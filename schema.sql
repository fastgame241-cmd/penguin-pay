CREATE DATABASE IF NOT EXISTS penguin_pay;
USE penguin_pay;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(10) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS verifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  phone VARCHAR(10) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  problem VARCHAR(64) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  experience VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verifications_created (created_at),
  CONSTRAINT fk_verifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);
