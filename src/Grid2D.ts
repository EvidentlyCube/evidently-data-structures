/**
 * This is a type alias for a function that's supposed to provide Grid2D with a value for
 * a specific space.
 * @typeparam TElement The type of the element as provided by Grid2D used.
 */
type Grid2DValueProvider<TElement> =
/**
 * @param {number} x X position in the grid.
 * @param {number} y Y position in the grid.
 * @return {TElement} The value to store in that space
 */
	{ (x: number, y: number): TElement };

/**
 * This is a type alias for a function that's called when iterating over values in the
 * Grid2D, and called by the destructive operation.
 * @typeparam TElement The type of the element as provided by Grid2D used.
 */
type Grid2DIterateCallback<TElement> =
/**
 * @param {TElement} element Element in question
 * @param {number} x X position in the grid.
 * @param {number} y Y position in the grid.
 */
	{ (element: TElement, x: number, y: number): void };

/**
 * Optional configuration for the  [[Grid2D]] class
 */
export interface Grid2DConfig<TElement> {
	/**
	 * A callback for creating a default value for any grid tile
	 */
	defaultValueProvider: Grid2DValueProvider<TElement>;
	/**
	 * Optional callback called whenever an element is removed via the `resize` operation (or any other
	 * structure modifying operation that might be added in the future)
	 */
	destructorCallback?: Grid2DIterateCallback<TElement>;
}

/**
 * A two dimensional grid.
 *
 * @typeparam TElement identifies the data stored in the Grid. By default this class does not allow
 * nullable or optional values, but this can be accomplished by using [Union types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types),
 * eg. `Grid2D<Entity|undefined>`.
 *
 * @example
 *
 * ```
 * const grid = new Grid2D<Entity|undefined>(20, 15, {
 *     defaultValueProvider: () => undefined,
 *     destructorCallback: (entity) => entity && entity.releaseToPool()
 * });
 *
 * // Sets the value at the specified position
 * grid.set(0, 0, undefined);
 *
 * // Gets a value at the specified position
 * console.log(grid.get(0, 0));
 *
 * // Checks if a given position is valid
 * console.log(grid.isValidPosition(90, 90));
 *
 * // Populate all grid position with the same value
 * grid.setAll(undefined);
 *
 * // Populate all grid positions by a callback
 * grid.setAllCallback((x, y) => levelBlueprint.createEntityFor(x, y));
 *
 * // Iterate over every position in the grid
 * grid.forEach(entity => entity.update());
 *
 * // Shrinks one dimension and expands another - the removed positions will call `destructorCallback`
 * // and the new ones will be populated by a call to `defaultValueProvider`
 * grid.resize(15, 20);
 * ```
 */
export class Grid2D<TElement> {
	private _width: number;

	private _height: number;

	private _config: Grid2DConfig<TElement>;

	private readonly _squares: TElement[][];

	/**
	 * The current width of the grid
	 */
	public get width(): number {
		return this._width;
	}

	/**
	 * The current height of the grid
	 */
	public get height(): number {
		return this._height;
	}

	/**
	 * Returns the array internally used by the Grid. It's asdvisable to not modify the return value of this getter,
	 * only ever reference it for faster access or quick serialization.
	 *
	 * This is an unsafe method because the way the array is stored internally may be changed without warning.
	 *
	 * @format The structure used is a jagged array (an array of arrays) where the first dimension is X and second is Y.
	 * For example: the equivalent of `get(1,2)` is `UNSAFE_internalArray[1][2]`.
	 * For example: Structure of a 2x3 grid is:
	 * ```
	 * [
	 *   [0x0, 0x1, 0x2]
	 *   [1x0, 1x1, 1x2]
	 * ]
	 * ```
	 */
	public get UNSAFE_internalArray(): readonly TElement[][] {
		return this._squares;
	}

	/**
	 * @param {number} width Width of the grid, must be an integer larger than 0.
	 * @param {number} height Height of the grid, must be an integer larger than 0.
	 * @param {Grid2DConfig<TElement>|Grid2DValueProvider<TElement>} config The creation callback or the full configuration.
	 * In order to easily set the the same value for every space just use `() => undefined`.
	 * @throws {Error} Thrown when either `width` or `height` is non-integer or less than 1.
	 */
	public constructor(width: number, height: number, config: Grid2DConfig<TElement> | Grid2DValueProvider<TElement>) {
		if (width < 1 || !Number.isInteger(width)) {
			throw new Error(`Width has to be an integer greater than zero, get ${width} instead`);
		}

		if (height < 1 || !Number.isInteger(height)) {
			throw new Error(`Height has to be an integer greater than zero, get ${height} instead`);
		}

		this._width = width;
		this._height = height;
		this._config = typeof config === "function" ? {defaultValueProvider: config} : config;
		this._squares = [];

		for(let x = 0; x < width; x++) {
			this._squares[x] = [];

			for(let y = 0; y < height; y++) {
				this._squares[x][y] = this._config.defaultValueProvider(x, y);
			}
		}
	}

	/**
	 * Retrieved the element stored at the specified space.
	 * @param {number} x X position in the grid to read from.
	 * @param {number} y Y position in the grid to read from.
	 * @return {TElement} The element at the specified position in the grid.
	 * @throws {Error} Thrown when X or Y is outside bounds of the grid.
	 */
	public get(x: number, y: number): TElement {
		if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
			throw new Error(`Can't get when position is outside bounds, got ${x}x${y}`);
		}

		return this._squares[x][y];
	}

	/**
	 * Stores an element at the specified space.
	 * @param {number} x X position in the grid to write to.
	 * @param {number} y Y position in the grid to write to.
	 * @param {TElement} element Element to store
	 * @throws {Error} Thrown when X or Y is outside bounds of the grid.
	 */
	public set(x: number, y: number, element: TElement): void {
		if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
			throw new Error(`Can't set when position is outside bounds, got ${x}x${y}`);
		}

		this._squares[x][y] = element;
	}

	/**
	 * Checks whether a given position falls inside the bounds of the grid.
	 * @param {number} x X position in the grid to check.
	 * @param {number} y Y position in the grid to check.
	 * @return {boolean} True if the position is inside the grid.
	 */
	public isValidPosition(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < this._width && y < this._height;
	}

	/**
	 * Resizes the grid. If any of the values are "lost" due to shrinking, `destructorCallback` from the configuration
	 * will be called (if specified).
	 *
	 * @param {number} newWidth New width of the grid, must be an integer larger than 0.
	 * @param {number} newHeight New height of the grid, must be an integer larger than 0.
	 * @throws {Error} Thrown when either `newWidth` or `newHeight` is non-integer or less than 1.
	 */
	public resize(newWidth: number, newHeight: number): void {
		if (newWidth < 1 || !Number.isInteger(newWidth)) {
			throw new Error(`Width has to be an integer greater than zero, get ${newWidth} instead`);
		}

		if (newHeight < 1 || !Number.isInteger(newHeight)) {
			throw new Error(`Height has to be an integer greater than zero, get ${newHeight} instead`);
		}

		const maxWidth = Math.max(newWidth, this._width);
		const maxHeight = Math.max(newHeight, this._height);

		for(let x = 0; x < maxWidth; x++) {
			if (x >= this._width) {
				this._squares[x] = [];
			}
			for(let y = 0; y < maxHeight; y++) {
				if (x >= newWidth || y >= newHeight) {
					if (x < this.width && y < this.height) {
						this._config.destructorCallback?.(this._squares[x][y], x, y);
					}
				} else if (x >= this.width || y >= this.height) {
					if (x < newWidth && y < newHeight) {
						this._squares[x][y] = this._config.defaultValueProvider(x, y);
					}
				}
			}

			if (newHeight < this._height) {
				this._squares[x].length = newHeight;
			}
		}

		this._width = newWidth;
		this._height = newHeight;
	}

	/**
	 * Sets all spaces in the grid to the specified value.
	 * @param {TElement} value The new value
	 */
	public setAll(value: TElement): void {
		for(let x = 0; x < this._width; x++) {
			for(let y = 0; y < this._height; y++) {
				this._squares[x][y] = value;
			}
		}
	}

	/**
	 * Sets all spaces in the grid to a value returned from the callback.
	 * @param {Grid2DValueProvider<TElement>} callback A function that accepts the X and Y coordinate of the grid square
	 * and returns the new value for that square.
	 */
	public setAllCallback(callback: Grid2DValueProvider<TElement>): void {
		for(let x = 0; x < this._width; x++) {
			for(let y = 0; y < this._height; y++) {
				this._squares[x][y] = callback(x, y);
			}
		}
	}

	/**
	 * Iterates over every square in the array.
	 * @param {Grid2DIterateCallback<TElement>} callback Function called with every element and its position in the grid.
	 */
	public forEach(callback: Grid2DIterateCallback<TElement>): void {
		for(let x = 0; x < this._width; x++) {
			for(let y = 0; y < this._height; y++) {
				callback(this._squares[x][y], x, y);
			}
		}
	}

	/**
	 * Creates a copy of the internal array.
	 *
	 * @return {TElement[][]} A jagged array (an array of arrays) where the first dimension is X and second is Y.
	 * For example: the equivalent of `get(1,2)` is `UNSAFE_internalArray[1][2]`.
	 * For example: Structure of a 2x3 grid is:
	 * ```
	 * [
	 *   [0x0, 0x1, 0x2]
	 *   [1x0, 1x1, 1x2]
	 * ]
	 * ```
	 */
	public toArray(): TElement[][] {
		return [...this._squares.map(x => x.concat())];
	}
}