const ReactionPaginator = require("./ReactionPaginator");

module.exports = class Paginator {
    constructor(client, data) {
        this.client = client;
        this.maxTime = data.maxTime || 300000;
        this.pageLoop = typeof data.pageLoop !== "boolean" ? false : data.pageLoop;
        this.pageNumber = typeof data.pageNumber !== "boolean" ? false : data.pageNumber;
        this.activeListeners = [];
        this.client.gateway.on("packet", packet => {
            const { d: data, t: event } = packet;
            for (const listener of this.activeListeners) {
                if (listener instanceof ReactionPaginator && 
                    event === "MESSAGE_REACTION_ADD" && 
                    listener.message.author.id === data.user_id && 
                    listener.commandMessage && 
                    listener.commandMessage.id === data.message_id) {
                    if (data.emoji.name === listener.reactions.nextPage)
                        listener.next();
                    else if (data.emoji.name === listener.reactions.previousPage)
                        listener.previous();
                    listener.clearReactions();
                }
            }
        });
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