import mysql from '../_mysql'

import language from './language'
import leaveMessage from './leaveMessage'
import welcomeMessage from './welcomeMessage'
import user from './user'

const tables = {
  User: user,
  Language: language,
  LeaveMessage: leaveMessage,
  WelcomeMessage: welcomeMessage
}

tables.User.hasOne(tables.Language, {
  foreignKey: 'user_id'
})
tables.User.hasOne(tables.LeaveMessage, {
  foreignKey: 'user_id'
})
tables.User.hasOne(tables.WelcomeMessage, {
  foreignKey: 'user_id'
})

tables.Language.belongsTo(tables.User)
tables.LeaveMessage.belongsTo(tables.User)
tables.WelcomeMessage.belongsTo(tables.User)

mysql.sync()

export default tables