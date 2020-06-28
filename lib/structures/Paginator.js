const ReactionPaginator = require("./ReactionPaginator");

const allowedEvents = new Set([
    "MESSAGE_REACTION_ADD",
    "MESSAGE_CREATE"
]);

module.exports = class Paginator {
    constructor(client, data) {
        this.client = client;
        this.maxTime = data.maxTime || 300000;
        this.pageLoop = typeof data.pageLoop !== "boolean" ? false : data.pageLoop;
        this.pageNumber = typeof data.pageNumber !== "boolean" ? false : data.pageNumber;
        this.activeListeners = [];

        this.client.gateway.on("packet", async packet => {
            const {
                d: data,
                t: event
            } = packet;
            if (!data) return;
            if (!allowedEvents.has(event)) return;

            for (const listener of this.activeListeners) {
                if (!(listener instanceof ReactionPaginator)) continue;
                if (!listener.commandMessage) continue;

                if (listener.commandMessage.id === data.message_id &&
                    listener.targetUser === data.user_id) {
                    await this.handleReactionEvent(data, listener);
                } else if (event === "MESSAGE_CREATE" &&
                    listener.commandMessage.channelId === data.channel_id &&
                    listener.message.author.id === data.author.id &&
                    listener.waitingForPage) {
                    await this.handleMessageEvent(data, listener);
                }
            }
        });
    }

    async handleReactionEvent(data, listener) {
        switch (data.emoji.name) {
            case listener.reactions.nextPage:
                listener.next();
                break;
            case listener.reactions.previousPage:
                listener.previous();
                break;
            case listener.reactions.firstPage:
                listener.jumpTo(0);
                break;
            case listener.reactions.lastPage:
                listener.jumpTo(listener.pages.length - 1);
                break;
            case listener.reactions.stop:
                listener.stop();
                break;
            case listener.reactions.skipTo:
                if (listener.waitingForPage) return;
                listener.waitingForPage = await this.client.rest.createMessage(data.channel_id, "What page do you want to go to?");
                break;
            default:
                if (!Object.values(listener.reactions).includes(data.emoji.name)) return;
        }

        listener.emit("raw", data);
        listener.clearReactions();
    }

    async handleMessageEvent(data, listener) {
        const page = parseInt(data.content, 10);
        if (isNaN(page)) {
            return;
        }

        listener.jumpTo(page - 1)
            .then(async () => {
                try {
                    await listener.waitingForPage.delete();
                    await this.client.rest.deleteMessage(data.channel_id, data.id);
                } catch (e) {}

                listener.waitingForPage = null;
            }).catch(() => {});
    }

    async createReactionPaginator(data) {
        if (this.pageNumber && Array.isArray(data.pages)) {
            for (let i = 0; i < data.pages.length; ++i) {
                const element = data.pages[i];
                if (element.embed) {
                    if (element.embed.footer && element.embed.footer.text) {
                        element.embed.footer.text = `${element.embed.footer.text} | Page ${i + 1}/${data.pages.length}`.substr(0, 255);
                    } else {
                        element.embed.footer = {
                            text: `Page ${i + 1}/${data.pages.length}`
                        };
                    }
                } else if (typeof element === "string") {
                    data.pages[i] = (data.pages[i] + `\n\nPage ${i + 1}/${data.pages.length}`).substr(0, 1999);
                }
            }
        }

        const instance = new ReactionPaginator(this, data);
        this.activeListeners.push(instance);

        setTimeout(() => {
            instance.stop();
        }, this.maxTime);

        if (instance.commandMessage === null && data.pages) {
            await instance.init();
        }

        await instance.addReactions();
        return instance;
    }
};