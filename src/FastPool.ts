import {Pool, PoolConfig, PoolHydrateCallback, PoolReleaseCallback} from "./Pool";

export class FastPool<TItem extends object> implements Pool<TItem>{
	private _indexInPool: number;

	private readonly _pool: TItem[];
	private readonly _onHydrate: PoolHydrateCallback<TItem>;
	private readonly _onRelease: PoolReleaseCallback<TItem>;
	private readonly _config: PoolConfig;

	constructor(
		onHydrate: PoolHydrateCallback<TItem>,
		onRelease?: PoolReleaseCallback<TItem>,
		config?: PoolConfig,
	) {
		config = config || {};
		config.initialSize = config.initialSize ?? 10;
		config.autoHydrateSize = config.autoHydrateSize ?? 10;

		this._onHydrate = onHydrate;
		this._onRelease = onRelease;
		this._config = config;
		this._indexInPool = 0;
		this._pool = [];

		this.hydrate(config.initialSize);
	}

	public getOne(): TItem {
		if (this._indexInPool === 0) {
			this.hydrate(this._config.autoHydrateSize);
		}

		return this._pool[--this._indexInPool];
	}

	public release(item: TItem): void {
		this._pool[this._indexInPool++] = item;
		this._onRelease?.(item);
	}

	private hydrate(number: number): void {
		while (number-- > 0) {
			this._pool[this._indexInPool++] = this._onHydrate();
		}
	}
}