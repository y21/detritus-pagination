const EventEmitter = require("eventemitter3");

module.exports = class BasePaginator extends EventEmitter {
    constructor(client, data) {
        super();
        this.client = client;
        this.message = data.message;
        this.commandMessage = data.commandMessage || null;
        this.pages = data.pages;
        this.index = 0;
    }

    async init() {
        return this.commandMessage = await this.message.reply(this.pages[this.index]);
    }

    async previous() {
        if (Array.isArray(this.pages) && this.pages.length > 0) {
            if (this.client.pageLoop) {
                await this.commandMessage.edit(this.pages[this.index === 0 ? this.index = this.pages.length - 1 : --this.index]);
            } else if (this.index !== 0) {
                await this.commandMessage.edit(this.pages[--this.index]);
            } else {
                return this.commandMessage;
            }
        }
        this.emit("previous", this);
        return this.commandMessage;
    }

    async next() {
        if (Array.isArray(this.pages) && this.pages.length > 0) {
            if (this.client.pageLoop) {
                await this.commandMessage.edit(this.pages[this.index === this.pages.length - 1 ? this.index = 0 : ++this.index]);
            } else if (this.index !== this.pages.length -1) {
                await this.commandMessage.edit(this.pages[++this.index]);
            } else {
                return this.commandMessage;
            }
        }
        this.emit("next", this);
        return this.commandMessage;
    }

    stop() {
        this.removeAllListeners();
        const targetIndex = this.client.activeListeners.findIndex(v => v.message.id === this.message.id);
        this.client.activeListeners.splice(targetIndex, 1);
        return this;
    }
};