const BasePaginator = require("./BasePaginator");

module.exports = class ReactionPaginator extends BasePaginator {
    constructor(client, data) {
        super(client, data);
        this.waitingForPage = false;
        this.reactions = data.reactions || {
            firstPage: "⏮️",
            previousPage: "⬅️",
            nextPage: "➡️",
            lastPage: "⏭️",
            skipTo: "🔢",
            stop: "⏹️"
        };
    }

    async addReactions() {
        if (!this.commandMessage) return;
        for (const reactions of Object.values(this.reactions)) {
            await this.commandMessage.react(reactions).catch(() => {});
        }
    }

    async clearReactions() {
        for (const reaction of this.commandMessage.reactions.values()) {
            reaction.delete(this.message.author.id).catch(() => {});
        }
    }
};
