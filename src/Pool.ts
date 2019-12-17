export type PoolHydrateCallback<TObject> = { (): TObject };
export type PoolReleaseCallback<TObject> = { (element: TObject): void };

/**
 * Configuration for a Pool
 */
export interface PoolConfig {
	/**
	 * How many instances should be hydrated into the pool on creation.
	 */
	initialSize?: number;

	/**
	 * How many instances should be created when `getOne` is called but there are no
	 * objects available anymore.
	 */
	autoHydrateSize?: number;
}

/**
 * An object pool allows to reuse the same instance of an object multiple times without the relatively costly operation
 * of instantiating it. It's especially useful when you need to create and destroy objects quickly (eg.
 * bullets/particles) or create a lot of them at once (eg. loading a level).
 *
 * There are two implementations of Pool:
 *  - `SlowPool` is useful for development and debugging, as it prevents a few incorrect usage patterns
 *  - `FastPoo` is intended to be used in the playable builds, it has no internal checks and is faster
 *
 *  ### Tips
 *
 *  1. On modern machines memory is usually not a real restriction so for most intents and purposes it's safe to create
 *     slightly larger pools than you expec you'll need.
 *  2. Pools require quasi-manual memory management - it's more error prone. Don't just use pools for everything,
 *     know [when to optimize](https://www.evidentlycube.com/blog/when-to-optimize#content) and only do it when
 *     you know you can save some time. An additional read: [Optimizing level loading in Trans Neuronica](https://www.evidentlycube.com/blog/optimizing-level-loading-in-trans-neuronica).
 *  3. During development use `SlowPool` to avoid a certain class of errors from occuring, but when building
 *     the game for release go with `FastPool`.
 *  4. When measuring speed ALWAYS use `FastPool`, unless you intend to use `SlowPool` in the final build.
 *  5. The object returned from pool should ideally be stored in as few places as possible, preferably one. This
 *     ensures when you need to release the object you won't forget to remove it everywhere.
 *  6. **Always** release an object back to the pool once you stop using it, otherwise it'll create a nasty
 *     memory leak.
 */
export interface Pool<TObject extends object> {
	/**
	 * The number of objects left in the pool
	 */
	readonly availableObjects: number;

	/**
	 * The number of used objects in the pool
	 */
	readonly usedObjects: number;

	/**
	 * The total number of objects created by this pool
	 */
	readonly totalObjects: number;

	/**
	 * Retrieves a single object. If the pool has no available objects it first hydrates the pool.
	 * @return {TObject} The object retrieved from the pool
	 */
	getOne(): TObject;

	/**
	 * Releases an object back into the pool
	 * @param {TObject} object The object to be released. It should be an object previously retrieved from the pool (enforced in `SlowPool`)
	 */
	release(object: TObject): void;

	/**
	 * Enlarges the list of available objects by the specified number.
	 *
	 * @param {TObject} objectsToCreate
	 */
	hydrate(objectsToCreate: number): void;
}