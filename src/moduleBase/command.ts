import * as model from '../db'
import helper from '../helper'
import { Logger } from 'log4js'
import * as Telegram from 'node-telegram-bot-api'
import * as types from '../types'

import { Config } from '../config'

export default class Command {
  protected config: Config;
  protected bot: Telegram;
  protected logger: Logger;
  protected helper: types.helper.default;
  protected model: types.i18n.i18n
  protected regexp: RegExp

  constructor (bot: Telegram, logger: Logger, config: Config) {
    this.config = config
    this.bot = bot
    this.logger = logger
    this.helper = helper
    this.regexp = new RegExp('')
    this.model = model
  }

  public run (): void {
    this.bot.onText(this.regexp, (msg, match) => this.module(msg, match))
  }

  protected async module (msg: Telegram.Message, match: RegExpExecArray | null): Promise<void> {
  }
}