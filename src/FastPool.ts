import {Pool, PoolConfig, PoolHydrateCallback, PoolReleaseCallback} from "./Pool";

/**
 * An object pool allows to reuse the same instance of an object multiple times without the relatively costly operation
 * of instantiating it. It's especially useful when you need to create and destroy objects quickly (eg.
 * bullets/particles) or create a lot of them at once (eg. loading a level).
 *
 * @typeparam TObject Type of the objects stored in the pool
 */
export class FastPool<TObject extends object> implements Pool<TObject> {
	private _indexInPool: number;

	private readonly _pool: TObject[];
	private readonly _onHydrate: PoolHydrateCallback<TObject>;
	private readonly _onRelease: PoolReleaseCallback<TObject>;
	private readonly _config: PoolConfig;

	/**
	 * The number of objects left in the pool
	 */
	public get availableObjects(): number {
		return this._indexInPool;
	};

	/**
	 * The number of used objects in the pool
	 */
	public get totalObjects(): number {
		return this._pool.length;
	};

	/**
	 * The total number of objects created by this pool
	 */
	public get usedObjects(): number {
		return this.totalObjects - this.availableObjects;
	};

	/**
	 * @param {PoolHydrateCallback<TObject>} onHydrate A function that's called when hydrating the pool,
	 *  which must return new instances of objects to populate it.
	 * @param {PoolReleaseCallback<TObject>|undefined} onRelease An optional function called when an object
	 *  is released.
	 * @param {PoolConfig} config Configuration
	 */
	constructor(
		onHydrate: PoolHydrateCallback<TObject>,
		onRelease?: PoolReleaseCallback<TObject>,
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

	/**
	 * Retrieves a single object. If the pool has no available objects it first hydrates the pool.
	 * @return {TObject} The object retrieved from the pool
	 */
	public getOne(): TObject {
		if (this._indexInPool === 0) {
			this.hydrate(this._config.autoHydrateSize);
		}

		return this._pool[--this._indexInPool];
	}

	/**
	 * Releases an object back into the pool
	 * @param {TObject} object The object to be released. It should be an object previously retrieved from the pool.)
	 */
	public release(object: TObject): void {
		this._pool[this._indexInPool++] = object;
		this._onRelease?.(object);
	}

	/**
	 * Enlarges the list of available objects by the specified number.
	 *
	 * @param {TObject} objectsToCreate Number of objects to create
	 */
	public hydrate(objectsToCreate: number): void {
		this._pool.length += objectsToCreate;

		while (objectsToCreate-- > 0) {
			this._pool[this._indexInPool++] = this._onHydrate();
		}
	}
}