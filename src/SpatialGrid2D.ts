import {FastPool} from "./FastPool";

/**
 * @private
 */
interface Item<TElement> {
	x: number;
	y: number;
	value: TElement;
}

interface WithPosition {
	x: number;
	y: number;
}

/**
 * This is a type alias for a function that's called on each element that is removed
 * in the resize operation, as well as in `forEach` method.
 * @typeparam TElement The type of the element as provided by SpatialGrid2D used.
 */
type SpatialGrid2DDestroyCallback<TElement> =
/**
 * @param {TElement} element Element in question
 * @param {number} x X position in the grid.
 * @param {number} y Y position in the grid.
 */
	{ (element: TElement, x: number, y: number): void };


/**
 * This is a type alias for a function that's called in `getFiltered`
 * @typeparam TElement The type of the element as provided by SpatialGrid2D used.
 */
type SpatialGrid2DFilterCallback<TElement> =
/**
 * @param {TElement} element Element in question
 * @param {number} x X position in the grid.
 * @param {number} y Y position in the grid.
 * @return {boolean} True when element should be kept in the resulting array
 */
	{ (element: TElement, x: number, y: number): boolean };

/**
 * Optional configuration for the  [[SpatialGrid2D]] class
 */
export interface SpatialGrid2DConfig<TElement> {
	/**
	 * Optional callback called whenever an element is removed via the `resize` operation (or any other
	 * structure modifying operation that might be added in the future)
	 */
	destructorCallback?: SpatialGrid2DDestroyCallback<TElement>;
}

/**
 * @private
 */
const itemPool = new FastPool<Item<any>>(() => {
	return {x: 0, y: 0, value: undefined as any};
});
itemPool.hydrate(1024);

/**
 * A two dimensional grid that allows multiple elements to occupy the same space and divides its space into buckets in order to speed up
 * operations. It's a combiation of spatial hash and a 2D grid created specifically for grid-based games.
 *
 * The specific way it works is:
 *
 *  * The grid is divided into buckets, each bucket the size specific in the constructor
 *  * When an element is inserted into the grid it's added to a bucket that matches its position
 *  * When retrieving elements at a certain position only one bucket has to be iterated over to find all the items
 *
 * @typeparam TElement identifies the data stored in the spatial grid.
 *
 * @example
 *
 * ```
 * const grid = new SpatialGrid2D<Entity>(20, 15, 3, 3, {
 *     destructorCallback: (entity) => entity && entity.releaseToPool()
 * });
 *
 * // Inserts a bunch of entities at a specific spot
 * grid.insertAt(3, 3, new GoldPiece());
 * grid.insertAt(3, 3, new GoldPiece());
 * grid.insertAt(3, 3, new GoldPiece());
 *
 * // Will return the three inserted GoldPieces
 * console.log(grid.get(3, 3));
 *
 * // Removes everything from a given space
 * grid.removeAllAt(3, 3);
 *
 * // Removes a specific item from a specific position
 * grid.removeAt(1, 2, player);
 *
 * // Shrinks one dimension and expands another - the removed positions will call `destructorCallback`
 * // and the new ones will be populated by a call to `defaultValueProvider`
 * grid.resize(15, 20);
 *
 * // Changes the buckets' dimensions
 * grid.resize(undefined, undefined, 2, 2);
 * ```
 *
 * @typ
 */
export class SpatialGrid2D<TElement> {
	private _gridWidth: number;
	private _gridHeight: number;
	private _bucketWidth: number;
	private _bucketHeight: number;
	private _size: number;
	private _config: SpatialGrid2DConfig<TElement>;

	private _buckets: Item<TElement>[][][];

	/**
	 * Width of the grid
	 */
	public get gridWidth(): number {
		return this._gridWidth;
	}

	/**
	 * Height of the grid
	 */
	public get gridHeight(): number {
		return this._gridHeight;
	}

	/**
	 * Width of a single bucket
	 */
	public get bucketWidth(): number {
		return this._bucketWidth;
	}

	/**
	 * Height of a single bucket
	 */
	public get bucketHeight(): number {
		return this._bucketHeight;
	}

	/**
	 * Number of elements stored in the grid
	 */
	public get size(): number {
		return this._size;
	}

	/**
	 * @param {number} gridWidth Width of the grid, must be an integer larger than zero
	 * @param {number} gridHeight Height of the grid, must be an integer larger than zero
	 * @param {number} bucketWidth Width of the bucket, must be an integer larger than zero
	 * @param {number} bucketHeight Height of the bucket, must be an integer larger than zero
	 * @param {SpatialGrid2DConfig<TElement>|undefined} config Optional configuration
	 */
	constructor(gridWidth: number, gridHeight: number, bucketWidth: number, bucketHeight: number, config?: SpatialGrid2DConfig<TElement>) {
		if (gridWidth < 1 || !Number.isInteger(gridWidth)) {
			throw new Error(`'gridWidth' expected to be an integer greater than zero, got '${gridWidth}' instead`);
		}

		if (gridHeight < 1 || !Number.isInteger(gridHeight)) {
			throw new Error(`'gridHeight' expected to be an integer greater than zero, got '${gridHeight}' instead`);
		}

		if (bucketWidth < 1 || !Number.isInteger(bucketWidth)) {
			throw new Error(`'bucketWidth' expected to be an integer greater than zero, got '${bucketWidth}' instead`);
		}

		if (bucketHeight < 1 || !Number.isInteger(bucketHeight)) {
			throw new Error(`'bucketHeight' expected to be an integer greater than zero, got '${bucketHeight}' instead`);
		}

		config = config || {};

		this._gridWidth = gridWidth;
		this._gridHeight = gridHeight;
		this._bucketWidth = bucketWidth;
		this._bucketHeight = bucketHeight;
		this._config = config;
		this._size = 0;

		const bucketsInX = Math.ceil(gridWidth / bucketWidth);
		const bucketsInY = Math.ceil(gridHeight / bucketHeight);

		this._buckets = [];
		for(let x = 0; x < bucketsInX; x++) {
			this._buckets[x] = [];
			for(let y = 0; y < bucketsInY; y++) {
				this._buckets[x][y] = [];
			}
		}
	}

	/**
	 * Retrieves all elements that occupy the specified position
	 * @param {number} x
	 * @param {number} y
	 * @param {TElement[]|undefined} out When provided instead of creating a new array to store the elements they will
	 *  be pushed on top of this array. Useful both as an [out param](https://en.wikipedia.org/wiki/Parameter_(computer_programming)#Output_parameters) and to avoid unnecessary
	 *  instantiation of arrays
	 * @return {TElement[]} An array of elements. When `out` param is provided it will be returned
	 * @throws {Error} Thrown when x or y is out of bounds
	 */
	public get(x: number, y: number, out?: TElement[]): TElement[] {
		if (x < 0 || x >= this._gridWidth || y < 0 || y >= this._gridHeight) {
			throw new Error(`'x' and 'y' expected to be inside grid's bounds, got '${x}x${y}' instead`);
		}

		out = out || [];

		for(const item of this._buckets[x / this._bucketWidth | 0][y / this._bucketHeight | 0]) {
			if (item.x === x && item.y === y) {
				out.push(item.value);
			}
		}

		return out;
	}

	/**
	 * The same as `insertAt` but `x` and `y` are taken from the element
	 * @param {TElement & WithPosition} element An element that has `x` and `y` fields
	 * @throws Throws the same exceptions as `insertAt`
	 */
	public insert(element: TElement & WithPosition): void {
		this.insertAt(element.x, element.y, element);
	}

	/**
	 * Inserts an element into the grid at specified position.
	 * @param {number} x X position to insert at
	 * @param {number} y Y position to insert at
	 * @param {TElement} element ELement to insert
	 * @throws {Error} Thrown when position is out of bounds.
	 */
	public insertAt(x: number, y: number, element: TElement): void {
		if (x < 0 || x >= this._gridWidth || y < 0 || y >= this._gridHeight) {
			throw new Error(`'x' and 'y' expected to be inside grid's bounds, got '${x}x${y}' instead`);
		}

		const item = itemPool.getOne();
		item.x = x;
		item.y = y;
		item.value = element;

		this._buckets[x / this._bucketWidth | 0][y / this._bucketHeight | 0].push(item);
		this._size++;
	}

	/**
	 * The same as `insertAt` but `x` and `y` are taken from the element
	 * @param {TElement & WithPosition} element An element that has `x` and `y` fields
	 * @throws Throws the same exceptions as `removeAt`
	 */
	public remove(element: TElement & WithPosition): void {
		this.removeAt(element.x, element.y, element);
	}

	/**
	 * Removes an element from the grid.
	 * @param {number} x X position to remove from
	 * @param {number} y Y position to remove from
	 * @param {TElement} element Element to remove
	 * @throws {Error} Thrown when position is out of bounds.
	 * @throws {Error} Thrown when element does not reside in the specified position.
	 */
	public removeAt(x: number, y: number, element: TElement): void {
		if (x < 0 || x >= this._gridWidth || y < 0 || y >= this._gridHeight) {
			throw new Error(`'x' and 'y' expected to be inside grid's bounds, got '${x}x${y}' instead`);
		}

		const bucket = this._buckets[x / this._bucketWidth | 0][y / this._bucketHeight | 0];
		let itemFound = false;
		let bucketLength = bucket.length;

		for(let i = 0; i < bucketLength; i++) {
			const item = bucket[i];
			if (item.x === x && item.y === y && item.value === element) {
				itemFound = true;

				bucket[i--] = bucket[--bucketLength];
				item.value = undefined;
				itemPool.release(item);

				this._size--;
			}
		}

		bucket.length = bucketLength;

		if (!itemFound) {
			throw new Error(`Element was not found at position '${x}x${y}'`);
		}
	}

	/**
	 * Removes all elements occupying the specified position.
	 * @param {number} x X position to remove from
	 * @param {number} y Y position to remove from
	 * @throws {Error} Thrown when position is out of bounds.
	 */
	public removeAllAt(x: number, y: number): void {
		if (x < 0 || x >= this._gridWidth || y < 0 || y >= this._gridHeight) {
			throw new Error(`'x' and 'y' expected to be inside grid's bounds, got '${x}x${y}' instead`);
		}

		const bucket = this._buckets[x / this._bucketWidth | 0][y / this._bucketHeight | 0];
		let bucketLength = bucket.length;

		for(let i = 0; i < bucketLength; i++) {
			const item = bucket[i];
			if (item.x === x && item.y === y) {
				bucket[i--] = bucket[--bucketLength];
				this._size--;
				item.value = null;
				itemPool.release(item);
			}
		}

		bucket.length = bucketLength;
	}

	/**
	 * A shortcut for `removeAt` followed by `insertAt`
	 * @warning The operation is not atomic. If the element is removed successfully but the
	 * insertion fails the item will no longer exist in the grid.
	 * @throws {Error} Throws the same errors as `removeAt` and `insertAt`
	 */
	public move(fromX: number, fromY: number, toX: number, toY: number, element: TElement): void {
		this.removeAt(fromX, fromY, element);
		this.insertAt(toX, toY, element);
	}

	/**
	 * Resizes the grid dimensions and the dimensions of the buckets
	 * @param {number|undefined} gridWidth New width of the grid, uses the current `gridWidth` if `undefined`.
	 * @param {number|undefined} gridHeight New height of the grid, uses the current `gridHeight` if `undefined`.
	 * @param {number|undefined} bucketWidth New width of the bucket, uses the current `bucketWidth` if `undefined`.
	 * @param {number|undefined} bucketHeight New height of the bucket, uses the current `bucketHeight` if `undefined`.
	 */
	public resize(gridWidth?: number, gridHeight?: number, bucketWidth?: number, bucketHeight?: number): void {
		gridWidth = gridWidth ?? this._gridWidth;
		gridHeight = gridHeight ?? this._gridHeight;
		bucketWidth = bucketWidth ?? this._bucketWidth;
		bucketHeight = bucketHeight ?? this._bucketHeight;

		const newBuckets: Item<TElement>[][][] = [];

		const bucketsInX = Math.ceil(gridWidth / bucketWidth);
		const bucketsInY = Math.ceil(gridHeight / bucketHeight);

		for(let x = 0; x < bucketsInX; x++) {
			newBuckets[x] = [];
			for(let y = 0; y < bucketsInY; y++) {
				newBuckets[x][y] = [];
			}
		}

		for(const row of this._buckets) {
			for(const bucket of row) {
				for(const item of bucket) {
					if (item.x >= gridWidth || item.y >= gridHeight) {
						this._config.destructorCallback?.(item.value, item.x, item.y);
						item.value = undefined;
						itemPool.release(item);
						this._size--;
					} else {
						newBuckets[item.x / bucketWidth | 0][item.y / bucketHeight | 0].push(item);
					}
				}
			}
		}

		this._gridWidth = gridWidth;
		this._gridHeight = gridHeight;
		this._bucketWidth = bucketWidth;
		this._bucketHeight = bucketHeight;
		this._buckets = newBuckets;
	}

	/**
	 * Iterates over every element in the grid
	 * @param {SpatialGrid2DDestroyCallback<TElement>} callback Function called on each element
	 */
	public forEach(callback: SpatialGrid2DDestroyCallback<TElement>): void {
		for(const row of this._buckets) {
			for(const bucket of row) {
				for(const item of bucket) {
					callback(item.value, item.x, item.y);
				}
			}
		}
	}

	/**
	 * Removes every element from the grid.
	 */
	public clear(): void {
		for(const row of this._buckets) {
			for(const bucket of row) {
				for(const item of bucket) {
					item.value = undefined;
					itemPool.release(item);
					this._size--;
				}
				bucket.length = 0;
			}
		}
	}

	/**
	 * Returns every element from the spatial grid in an array.
	 * @return {TElement[]}
	 */
	public getAll(): TElement[] {
		const elements = [];

		for(const row of this._buckets) {
			for(const bucket of row) {
				for(const item of bucket) {
					elements.push(item.value);
				}
			}
		}

		return elements;
	}

	/**
	 * Returns all elements from the spatial grid for which the callback returns true.
	 * @param {SpatialGrid2DFilterCallback<TElement>} callback
	 * @return {TElement[]}
	 */
	public getFiltered(callback: SpatialGrid2DFilterCallback<TElement>): TElement[] {
		const elements = [];

		for (let x = 0; x < this._buckets.length; x++){
			const row = this._buckets[x];
			for(let y = 0; y < row.length; y++) {
				const bucket = row[y];
				for(const item of bucket) {
					if (callback(item.value, x, y)) {
						elements.push(item.value);
					}
				}
			}
		}

		return elements;
	}

	/**
	 * Returns the first element from the spatial grid for which the callback returns true
	 * or undefined when nothing is found.
	 * @param {SpatialGrid2DFilterCallback<TElement>} callback
	 * @return {TElement|undefined}
	 */
	public getFirst(callback: SpatialGrid2DFilterCallback<TElement>): TElement|undefined {
		for (let x = 0; x < this._buckets.length; x++){
			const row = this._buckets[x];
			for(let y = 0; y < row.length; y++) {
				const bucket = row[y];
				for(const item of bucket) {
					if (callback(item.value, x, y)) {
						return item.value;
					}
				}
			}
		}

		return undefined;
	}
}