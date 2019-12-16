export type PoolHydrateCallback<TItem> = { (): TItem };
export type PoolReleaseCallback<TItem> = { (element: TItem): void };

export interface PoolConfig {
	initialSize?: number;
	autoHydrateSize?: number;
}

export interface Pool<TItem extends object> {
	getOne(): TItem;
	release(item: TItem): void;
}