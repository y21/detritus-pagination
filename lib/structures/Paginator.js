const ReactionPaginator = require("./ReactionPaginator");

module.exports = class Paginator {
    constructor(client, data) {
        this.client = client;
        this.maxTime = data.maxTime || 300000;
        this.pageLoop = typeof data.pageLoop !== "boolean" ? false : data.pageLoop;
        this.activeListeners = [];
        this.client.gateway.on("packet", packet => {
            const { d: data, t: event } = packet;
            for (const listener of this.activeListeners) {
                if (listener instanceof ReactionPaginator && event === "MESSAGE_REACTION_ADD" && listener.message.author.id === data.user_id && listener.commandMessage && listener.commandMessage.id === data.message_id) {
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
        const instance = new ReactionPaginator(this, data);
        this.activeListeners.push(instance);
        setTimeout(() => instance.stop(), this.maxTime);
        await instance.init();
        await instance.addReactions();

        return instance;
    }
};