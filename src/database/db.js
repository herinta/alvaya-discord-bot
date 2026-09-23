const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

/**
 * Inisialisasi pool koneksi MySQL
 */
async function initDatabase() {
    // Cek apakah konfigurasi database tersedia di .env
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'kerang_db';
    const port = parseInt(process.env.DB_PORT, 10) || 3306;

    try {
        pool = mysql.createPool({
            host,
            user,
            password,
            database,
            port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });

        // Test koneksi
        const connection = await pool.getConnection();
        isConnected = true;
        console.log(`🗄️ Terhubung ke Database MySQL [${database}] di ${host}:${port} ✅`);

        // Buat tabel jika belum ada
        await createTables(connection);
        connection.release();
        return true;
    } catch (error) {
        console.warn(`⚠️ Gagal terhubung ke MySQL (${error.message}). Pastikan kredensial DB di .env sudah benar.`);
        isConnected = false;
        return false;
    }
}

/**
 * Membuat tabel otomatis jika belum ada
 */
async function createTables(connection) {
    const createLevelsTable = `
        CREATE TABLE IF NOT EXISTS user_levels (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            xp INT NOT NULL DEFAULT 0,
            level INT NOT NULL DEFAULT 0,
            total_xp INT NOT NULL DEFAULT 0,
            last_xp_gain BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (guild_id, user_id),
            INDEX idx_ranking (guild_id, total_xp DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createRolesTable = `
        CREATE TABLE IF NOT EXISTS level_roles (
            guild_id VARCHAR(32) NOT NULL,
            level_required INT NOT NULL,
            role_id VARCHAR(32) NOT NULL,
            PRIMARY KEY (guild_id, level_required)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createLevelsTable);
    await connection.query(createRolesTable);
    console.log('✅ Tabel database (user_levels & level_roles) siap digunakan!');
}

/**
 * Helper untuk menjalankan query SQL
 */
async function query(sql, params = []) {
    if (!pool || !isConnected) {
        return null;
    }
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('❌ Database Query Error:', error.message);
        throw error;
    }
}

function getPool() {
    return pool;
}

module.exports = {
    initDatabase,
    query,
    getPool,
    get isConnected() {
        return isConnected;
    }
};
