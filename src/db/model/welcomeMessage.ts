import db from '../table'
import redis from '../_redis'
import * as types from '../../types';

const SUCCESS = true
const PREFIX = 'welcome:'
const EXPIRE = 60*60*24

class Message {
  static async find (id: number): Promise<types.model.returnWelcomeMessage> {
    let query = await redis.getAsync(PREFIX + id)

    if (query) {
      return {
        id,
        message: query
      }
    } else {
      let result = await db.WelcomeMessage.findOne({
        where: {
          _id: id
        },
        attributes: [
          'id',
          'message'
        ],
        raw: true
      })

      if (result && result.message) {
        redis.setAsync(PREFIX + id, result.message, 'EX', EXPIRE)
      }
      
      return result
    }
  }

  static async create (id: number, message: string): Promise<boolean> {
    await db.WelcomeMessage.create({
      _id: id,
      message
    })

    redis.setAsync(PREFIX + id, message, 'EX', EXPIRE)

    return SUCCESS
  }

  static async update (id: number, message: string): Promise<boolean> {
    await db.WelcomeMessage.update({
      message
    }, {
      where: {
        _id: id
      }
    })

    redis.setAsync(PREFIX + id, message, 'EX', EXPIRE)

    return SUCCESS
  }
}

export default Message