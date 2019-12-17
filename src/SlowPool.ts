import {Pool, PoolConfig, PoolHydrateCallback, PoolReleaseCallback} from "./Pool";

/**
 * An object pool allows to reuse the same instance of an object multiple times without the relatively costly operation
 * of instantiating it. It's especially useful when you need to create and destroy objects quickly (eg.
 * bullets/particles) or create a lot of them at once (eg. loading a level).
 *
 * This class will prevent the following incorrect usages:
 *  - Hydrating the pool with an instance that's already stored in the pool.
 *  - Releasing an instance that's already released/never was retrieved.
 *  - Releasing an instance that has not been retrieved form the pool in the first place.
 *
 * @typeparam TObject Type of the objects stored in the pool
 */
export class SlowPool<TObject extends object> implements Pool<TObject> {
	private _indexInPool: number;

	private readonly _isAvailableMap: Map<TObject, boolean>;
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
	 *  which must return new instances of objects to populate it. It **must** return a different instance
	 *  each time.
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
		this._isAvailableMap = new Map();

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

		const object = this._pool[--this._indexInPool];
		this._isAvailableMap.set(object, false);
		return object;
	}

	/**
	 * Releases an object back into the pool
	 * @param {TObject} object The object to be released. It should be an object previously retrieved from the pool.)
	 * @throws {Error} Thrown when releasing an object that's not been retrieved from the pool in the first place.
	 * @throws {Error} Thrown when releasing an object that's already available for use.
	 */
	public release(object: TObject): void {
		if (!this._isAvailableMap.has(object)) {
			throw new Error("Cannot release an object to pool that did not originate from it in the first place.");
		}
		if (this._isAvailableMap.get(object) === true) {
			throw new Error("Cannot release an object to pool that is already released.");
		}
		this._pool[this._indexInPool++] = object;
		this._onRelease?.(object);
	}

	/**
	 * Enlarges the list of available objects by the specified number.
	 *
	 * @param {TObject} objectsToCreate Number of objects to create
	 * @throws {Error} Thrown when the `onHydrate` callback provided in the constructor returns
	 *  an instance that is already in the pool.
	 */
	public hydrate(objectsToCreate: number): void {
		this._pool.length += objectsToCreate;
		while (objectsToCreate-- > 0) {
			const nextObject = this._onHydrate();

			if (this._isAvailableMap.has(nextObject)) {
				throw new Error("Hydrate returned an object that already exists in the pool");
			}

			this._isAvailableMap.set(nextObject, true);
			this._pool[this._indexInPool++] = nextObject;
		}
	}
}