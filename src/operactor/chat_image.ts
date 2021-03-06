import { Logger } from "log4js"
import * as Telegram from "node-telegram-bot-api"
import { Config } from "../config"
import { command as Command } from "../operactorBase"

export default class ChatImage extends Command {
  constructor(bot: Telegram, logger: Logger, config: Config) {
    super (bot, logger, config)
    this.regexp = /\{(?:img|pic|사진|이미지|짤) (.*)(?:\{|\})/
  }

  protected async module(msg: Telegram.Message, match: RegExpExecArray) {
    if (Math.round((new Date()).getTime() / 1000) - msg.date >= 180) { return }
    const type = "image"
    const chatid = msg.chat.id
    try {
      this.logger.info("command: chat_image, chatid: " + chatid +
        ", username: " + this.helper.getUser(msg.from!) +
        ", command: " + type + ", type: pending")

      const [send, temp] = await Promise.all([
        this.bot.sendChatAction(chatid, "upload_photo"),
        this.helper.getLang(msg, this.logger),
      ])

      let response = await this.helper.image(match[1])

      if (!response) {
        await this.bot.sendChatAction(chatid, "typing")
        await this.bot.sendMessage(chatid, "🖼 " + temp.text("command.img.not_found"), {
          reply_to_message_id: msg.message_id,
        })
        this.logger.info("command: chat_image, chatid: " + chatid +
          ", username: " + this.helper.getUser(msg.from!) +
          ", command: " + type + ", type: success, response: not found")
      } else {
        try {
          await this.bot.sendChatAction(chatid, "upload_photo")
          await this.bot.sendPhoto(chatid, response.img, {
            reply_markup: {
              inline_keyboard: [[{
                text: temp.text("command.img.visit_page"),
                url: response.url,
              }, {
                text: temp.text("command.img.view_image"),
                url: response.img,
              }], [{
                switch_inline_query_current_chat: "img " + match[1],
                text: temp.text("command.img.another"),
              }]],
            },
            reply_to_message_id: msg.message_id,
          })
          this.logger.info("command: chat_image, chatid: " + chatid +
            ", username: " + this.helper.getUser(msg.from!) +
            ", command: " + type + ", type: success, response: search success")
        } catch (e) {
          try {
            await this.bot.sendChatAction(chatid, "upload_photo")
            response = await this.helper.image(match[1])

            await this.bot.sendPhoto(chatid, response!.img, {
              reply_markup: {
                inline_keyboard: [[{
                  text: temp.text("command.img.visit_page"),
                  url: response!.url,
                }, {
                  text: temp.text("command.img.view_image"),
                  url: response!.img,
                }], [{
                  switch_inline_query_current_chat: "img " + match[1],
                  text: temp.text("command.img.another"),
                }]],
              },
              reply_to_message_id: msg.message_id,
            })
            this.logger.info("command: chat_image, chatid: " + chatid +
              ", username: " + this.helper.getUser(msg.from!) +
              ", command: " + type + ", type: success, response: search success")
          } catch (e) {
            this.logger.error("command: chat_image chatid: " + chatid +
              ", username: " + this.helper.getUser(msg.from!) +
              ", command: " + type + ", type: error")
            this.logger.debug(e.stack)
          }
        }
      }
    } catch (e) {
      this.logger.error("command: chat_image chatid: " + chatid +
        ", username: " + this.helper.getUser(msg.from!) +
        ", command: " + type + ", type: error")
      this.logger.debug(e.stack)
    }
  }
}
