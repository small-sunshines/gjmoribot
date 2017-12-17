const Sequelize = require('sequelize')
const config = global.config

const db = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  dialect: config.db.type,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  storage: config.db.sqlite_storage,
  operatorsAliases: false
})

const user = db.define('user', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true,
    validate: {
      isInt: true
    }
  },
  lang: {
    type: Sequelize.STRING, allowNull: false
  }
}, {
  timestamps: false
})

db.sync()

module.exports.user = user