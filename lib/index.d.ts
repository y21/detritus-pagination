import { ShardClient, ClusterClient } from "detritus-client";
import { EventEmitter } from "eventemitter3";
import { Message } from "detritus-client/lib/structures";

declare module "detritus-pagination" {
    interface PaginatorReactions {
        firstPage?: string;
        previousPage?: string;
        nextPage?: string;
        lastPage?: string;
        skipto?: string;
        stop?: string;
    }

    interface PaginatorOptions {
        maxTime?: number;
        pageLoop?: boolean;
        pageNumber?: boolean;
        reactions?: PaginatorReactions;
    }

    interface ReactionPaginatorData extends BasePaginatorData {}

    interface PageEventData {
        page: number,
        paginator: BasePaginator
    }

    interface BasePaginatorData {
        message?: Message;
        commandMessage?: Message | Map<string, Message>;
        pages?: any[];
        reactions?: PaginatorReactions;
        maxTime?: number;
    }

    class Paginator {
        public readonly client: ShardClient;
        public maxTime: number;
        public pageLoop: boolean;
        public pageNumber: boolean;
        public reactions: PaginatorReactions | undefined;
        public activeListeners: Array<BasePaginator> | Array<ReactionPaginator>;
        constructor(shardClient: ShardClient | ClusterClient, options: PaginatorOptions);
        public createReactionPaginator(options: ReactionPaginatorData): ReactionPaginator;
    }

    class BasePaginator extends EventEmitter {
        public readonly client: Paginator;
        public readonly message: Message;
        public readonly commandMessage: Message | Map<string, Message> | null;
        public readonly targetUser: string | Set<string>;
        public readonly isShared: boolean;
        public pages: any[];
        public index: number;

        constructor(client: Paginator, data: BasePaginatorData);
        public init(): Promise<Message>;
        public previous(): Promise<Message>;
        public next(): Promise<Message>;
        public jumpTo(page: number): Promise<Message>;
        public stop(): BasePaginator;
        public on(event: "next", fn: (paginator: BasePaginator) => any): BasePaginator;
        public on(event: "previous", fn: (paginator: BasePaginator) => any): BasePaginator;
        public on(event: "page", fn: (data: PageEventData) => any): BasePaginator;
        public on(event: "raw", fn: (data: any) => any): BasePaginator;
        public on(event: "stop", fn: (data: BasePaginator) => any): BasePaginator;
        public isCommandMessage(messageId: string): boolean;
        public isInChannel(channelId: string): boolean;
        public isTarget(user: string): boolean;
        public update(data: any): Promise<void>;

    }

    class ReactionPaginator extends BasePaginator {
        public waitingForPage: boolean;
        public reactions: PaginatorReactions;
        constructor(client: Paginator, data: ReactionPaginatorData);
        public addReactions(): Promise<void>;
        public clearReactions(): Promise<void>;
    }
}
