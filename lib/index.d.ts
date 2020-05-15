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

    interface BasePaginatorData {
        message: Message;
        commandMessage?: Message;
        pages: any[];
        reactions?: PaginatorReactions;
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
        public readonly commandMessage: Message | null;
        public pages: any[];
        public index: number;

        constructor(client: Paginator, data: BasePaginatorData);
        public init(): Promise<Message>;
        public previous(): Promise<Message>;
        public next(): Promise<Message>;
        public jumpTo(page: number): Promise<Message>;
        public stop(): BasePaginator;
    }

    class ReactionPaginator extends BasePaginator {
        public waitingForPage: boolean;
        public reactions: PaginatorReactions;
        constructor(client: Paginator, data: ReactionPaginatorData);
        public addReactions(): Promise<void>;
        public clearReactions(): Promise<void>;
    }
}