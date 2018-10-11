import { message as Message } from '../functionBase'
import * as Telegram from 'node-telegram-bot-api'
import Whatanime = require('whatanimega-helper')
import Format from '../modules/timeFormat'
import { Logger } from 'log4js';
import { Config } from '../config'

export default class MessageWhatanime extends Message {
  constructor (bot: Telegram, logger: Logger, config: Config) {
    super (bot, logger, config)
  }

  protected async module (msg: Telegram.Message) {
    const regex = new RegExp('^(?:(?:무슨 ?애니|whatanime|anime)\\?*|\\/(?:무슨애니|whatanime)+(?:@' +
      this.config.bot.username + ')? ?)$')
    try {
      if (Math.round((new Date()).getTime() / 1000) - msg.date >= 180) return

      if (msg.photo) {
        if (regex.test((<string>msg.caption))) {
          await this.success(msg.chat.id, msg,
            msg.photo[msg.photo.length - 1].file_id)
          return
        } else if (msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.text &&
          msg.reply_to_message.from.username === this.config.bot.username &&
          msg.reply_to_message.text.match(/📺❗️/)) {
          await this.success(msg.chat.id, msg,
            msg.photo[msg.photo.length - 1].file_id)
          return
        }
      } else if (msg.document && msg.document.thumb) {
        if (msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.text &&
          msg.reply_to_message.from.username === this.config.bot.username &&
          msg.reply_to_message.text.match(/📺❗️/)) {
          await this.success(msg.chat.id, msg,
            (<Telegram.PhotoSize>(<Telegram.Document>msg.document).thumb).file_id)
          return
        }
      } else if (msg.video && msg.video.thumb) {
        if (msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.text &&
          msg.reply_to_message.from.username === this.config.bot.username &&
          msg.reply_to_message.text.match(/📺❗️/)) {
          await this.success(msg.chat.id, msg,
            msg.video.thumb.file_id)
          return
      }
     } else {
        if (regex.test((<string>msg.text))) {
          if (msg.reply_to_message && msg.reply_to_message.photo) {
            await this.success(msg.chat.id, msg,
              msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1]
              .file_id)
            return
          } else if (msg.reply_to_message && msg.reply_to_message.document &&
              msg.reply_to_message.document.thumb) {
            await this.success(msg.chat.id, msg,
              msg.reply_to_message.document.thumb.file_id)
            return
          } else if (msg.reply_to_message && msg.reply_to_message.video &&
            msg.reply_to_message.video.thumb) {
            await this.success(msg.chat.id, msg,
              msg.reply_to_message.video.thumb.file_id)
            return
          }
        }
      }
    } catch (e) {
      this.logger.error('message: whatanime, chatid: ' + msg.chat.id +
        ', username: ' + this.helper.getUser(msg.from!) +
        ', command: whatanime, type: error')
      this.logger.debug(e.stack)
    }
  }
  
  private async success(chatid: number, msg: Telegram.Message, photo: string) {
    const query = new Whatanime(this.config.apiKey.whatanime)
    try {
      this.logger.info('message: whatanime, chatid: ' + chatid +
        ', username: ' + this.helper.getUser(msg.from!) +
        ', command: whatanime, type: pending')

      let [send, temp] = await Promise.all([
        this.bot.sendChatAction(chatid, 'typing'),
        this.helper.getLang(msg, this.logger)
      ])

      const url = await this.bot.getFileLink(photo)

      const response = await query.search(url)

      if (!response.docs[0]) {
        this.bot.sendMessage(chatid, '❗️ ' + 
          temp.text('command.whatanime.not_found'), {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_to_message_id: msg.message_id
          })
      } else {
        const result = response.docs[0]
        let resultMessage = ''
        if ((<string>result.title_native).toLowerCase() !==
          (<string>result.title_english).toLowerCase()) {
          resultMessage = temp.text('command.whatanime.name') +
            ': <code>' + result.title_native + '</code>\n' +
            temp.text('command.whatanime.english') + ': <code>'
            + result.title_english + '</code>\n'
        } else {
          resultMessage = temp.text('command.whatanime.name') +
            ': <code>' + result.title_native + '</code>\n'
        }

        const time = new Format(result.at)
        resultMessage = resultMessage +
          temp.text('command.whatanime.episode') + ' <code>'
            + result.episode + '</code>\n' +
            temp.text('command.whatanime.time') + ': <code>' +
            (time.hour === '00' ? '' : time.hour + ' : ') +
            time.min + ' : ' + time.sec + '</code>\n' +
            temp.text('command.whatanime.match') + ': <code>' +
            (result.similarity * 100).toFixed(2) + '%</code>'

        if (result.similarity < 0.9) {
          resultMessage = resultMessage + '\n\n<b>' +
            temp.text('command.whatanime.incorrect') + '</b>'
        }

        if (result.is_adult) {
          resultMessage = resultMessage + '\n\n<b>' +
            temp.text('command.whatanime.isAdult') + '</b>'
          await this.bot.sendMessage(chatid, resultMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_to_message_id: msg.message_id
          })
        } else {
          const animeVideo = await query.previewVideo(result.anilist_id,
            result.filename, result.at, result.tokenthumb)
            
          await Promise.all([
            this.bot.sendMessage(chatid, resultMessage, {
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_to_message_id: msg.message_id
            }),
            this.bot.sendVideo(chatid, animeVideo, {
              reply_to_message_id: msg.message_id
            })
          ])
        }
      }
      this.logger.info('message: whatanime, chatid: ' + chatid +
        ', username: ' + this.helper.getUser(msg.from!) +
        ', command: whatanime, type: success')
    } catch (e) {
      this.logger.error('chatid: ' + chatid +
        ', username: ' + this.helper.getUser(msg.from!) +
        ', command: whatanime, type: error')
      this.logger.debug(e.stack)
    }
  }
}
