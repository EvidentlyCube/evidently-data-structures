import 'mocha';
import {assert} from 'chai';
import {SpatialGrid2D} from "../src/SpatialGrid2D";

function timeCall(callback: () => void): number {
	const startTime = Date.now();
	callback();

	return Date.now() - startTime;
}

function createPopulatedGrid(width: number, height: number, bucketWidth: number, bucketHeight: number, outElements?: any[]): SpatialGrid2D<any> {
	let id = 0;
	outElements = outElements || [];
	const grid = new SpatialGrid2D<any>(width, height, bucketWidth, bucketHeight);
	for(let x = 0; x < 9; x++) {
		for(let y = 0; y < 9; y++) {
			for(let i = 0; i < 3; i++) {
				const item = {id: id++, x, y};
				outElements.push(item);
				grid.insertAt(x, y, item);
			}
		}
	}

	return grid;
}

function sortArrayOfCreatedElements(elements: any[]): void {
	elements.sort((left, right) => left.id - right.id);
}

describe("SpatialGrid2D", () => {
	describe('constructor', () => {
		it("Properties set in constructor are then correctly retrieved", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.equal(grid.gridWidth, 9);
			assert.equal(grid.gridHeight, 7);
			assert.equal(grid.bucketWidth, 3);
			assert.equal(grid.bucketHeight, 4);
		});
		it("Throw error when any property in constructor is less than 1", () => {
			assert.throws(() => new SpatialGrid2D(0, 7, 3, 4));
			assert.throws(() => new SpatialGrid2D(9, 0, 3, 4));
			assert.throws(() => new SpatialGrid2D(9, 7, 0, 4));
			assert.throws(() => new SpatialGrid2D(9, 7, 3, 0));
		});
		it("Throw error when any property in constructor is not an integer", () => {
			assert.throws(() => new SpatialGrid2D(9.3, 7, 3, 4));
			assert.throws(() => new SpatialGrid2D(9, 7.3, 3, 4));
			assert.throws(() => new SpatialGrid2D(9, 7, 3.3, 4));
			assert.throws(() => new SpatialGrid2D(9, 7, 3, 4.3));
		});
		it("Should start with zero size", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.equal(grid.size, 0);
		});
	});
	describe('insert', () => {
		it("Should call `insertAt` internally", () => {
			let wasInsertAtCalled = false;
			const object = {
				x: 3,
				y: 7,
			};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt = () => {
				wasInsertAtCalled = true;
			};

			grid.insert(object);
			assert.isTrue(wasInsertAtCalled);
		});
	});
	describe("insertAt", () => {
		it("Error when insertAting out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.insertAt(-1, 1, {}));
			assert.throws(() => grid.insertAt(1, -1, {}));
			assert.throws(() => grid.insertAt(9, 1, {}));
			assert.throws(() => grid.insertAt(1, 7, {}));
		});
		it("Inserted element can be retrieved", () => {
			const item = {};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 2, item);

			assert.strictEqual(grid.get(1, 2)[0], item);
		});
		it("Inserting elements should increase size", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 2, {});

			assert.strictEqual(1, grid.size);
		});
	});
	describe("get", () => {
		it("Error when position out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.get(-1, 1));
			assert.throws(() => grid.get(1, -1));
			assert.throws(() => grid.get(9, 1));
			assert.throws(() => grid.get(1, 7));
		});
		it("Getting empty should return nothing", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.lengthOf(grid.get(0, 0), 0);
		});
		it("When an array is passed to `get` it should be used to store the results", () => {
			const item = {};
			const outArray = ['test'];
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 1, item);
			grid.get(1, 1, outArray);

			assert.lengthOf(outArray, 2);
			assert.strictEqual(outArray[0], 'test');
			assert.strictEqual(outArray[1], item);
		});
	});
	describe('remove', () => {
		it("Should call `removeAt` internally", () => {
			let wasRemoveAtCalled = false;
			const object = {
				x: 3,
				y: 7,
			};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.removeAt = () => {
				wasRemoveAtCalled = true;
			};

			grid.remove(object);
			assert.isTrue(wasRemoveAtCalled);
		});
	});
	describe("removeAt", () => {
		it("Error when position out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.removeAt(-1, 1, {}));
			assert.throws(() => grid.removeAt(1, -1, {}));
			assert.throws(() => grid.removeAt(9, 1, {}));
			assert.throws(() => grid.removeAt(1, 7, {}));
		});
		it("Error when removing not-added element", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.removeAt(1, 1, {}));
		});
		it("Error when removing added element but in different position", () => {
			const item = {};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 1, item);

			assert.throws(() => grid.removeAt(2, 1, item));
		});
		it("Inserted element can be removed and is no longer retrievable and reduces size", () => {
			const item = {};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 1, item);
			grid.removeAt(1, 1, item);

			assert.isEmpty(grid.get(1, 1));
			assert.equal(grid.size, 0);
		});
		it("Removes the correct item when there are multiple on the same spot", () => {
			const itemToRemove = {id: 3};
			const itemsLeft = [{id: 1}, {id: 2}];
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(1, 1, itemsLeft[0]);
			grid.insertAt(1, 1, itemToRemove);
			grid.insertAt(1, 1, itemsLeft[1]);

			grid.removeAt(1, 1, itemToRemove);

			assert.lengthOf(grid.get(1, 1), 2);
			assert.include(grid.get(1, 1), itemsLeft[0]);
			assert.include(grid.get(1, 1), itemsLeft[1]);
		});
	});
	describe('removeAllAt', () => {
		it("Error when position out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.removeAllAt(-1, 1));
			assert.throws(() => grid.removeAllAt(1, -1));
			assert.throws(() => grid.removeAllAt(9, 1));
			assert.throws(() => grid.removeAllAt(1, 7));
		});

		it("Removes all elements on the given position and updates size", () => {
			const itemsToRemove = [{}, {}, {}];
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(4, 4, itemsToRemove[0]);
			grid.insertAt(4, 4, itemsToRemove[1]);
			grid.insertAt(4, 4, itemsToRemove[2]);
			grid.insertAt(3, 3, {});
			grid.insertAt(4, 3, {});
			grid.insertAt(5, 3, {});
			grid.insertAt(3, 4, {});
			grid.insertAt(5, 4, {});
			grid.insertAt(3, 5, {});
			grid.insertAt(4, 5, {});
			grid.insertAt(5, 5, {});

			grid.removeAllAt(4, 4);
			assert.isEmpty(grid.get(4, 4));
			assert.equal(grid.size, 8);
		});
	});
	describe("move", () => {
		it("Error when moving from out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.move(-1, 1, 1, 1, {}));
			assert.throws(() => grid.move(1, -1, 1, 1, {}));
			assert.throws(() => grid.move(9, 1, 1, 1, {}));
			assert.throws(() => grid.move(1, 7, 1, 1, {}));
		});
		it("Error when moving to out of bounds", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.move(1, 1, -1, 1, {}));
			assert.throws(() => grid.move(1, 1, 1, -1, {}));
			assert.throws(() => grid.move(1, 1, 9, 1, {}));
			assert.throws(() => grid.move(1, 1, 1, 7, {}));
		});
		it("Error when moving not added element", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);

			assert.throws(() => grid.move(1, 1, 2, 2, {}));
		});
		it("Error when moving element from wrong position", () => {
			const item = {};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(0, 0, item);

			assert.throws(() => grid.move(1, 1, 2, 2, {}));
		});
		it("Moved element is not in the old but is in the new position, size unchanged", () => {
			const item = {};
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			grid.insertAt(0, 0, item);

			grid.move(0, 0, 1, 1, item);
			assert.isEmpty(grid.get(0, 0));
			assert.strictEqual(grid.get(1, 1)[0], item);
			assert.equal(grid.size, 1);
		});
	});
	describe("clear", () => {
		it("Should remove everything from the grid and reset size", () => {
			const grid = new SpatialGrid2D(9, 7, 3, 4);
			for(let i = 0; i < 9; i++) {
				for(let j = 0; j < 7; j++) {
					grid.insertAt(i, j, {});
					grid.insertAt(i, j, {});
				}
			}

			grid.clear();
			assert.equal(grid.size, 0);
			for(let i = 0; i < 9; i++) {
				for(let j = 0; j < 7; j++) {
					assert.isEmpty(grid.get(i, j));
				}
			}
		});
	});
	describe("resize", () => {
		it("Updates the properties", () => {
			const grid = new SpatialGrid2D(9, 9, 3, 4);

			grid.resize(4, 3, 2, 1);

			assert.equal(grid.gridWidth, 4);
			assert.equal(grid.gridHeight, 3);
			assert.equal(grid.bucketWidth, 2);
			assert.equal(grid.bucketHeight, 1);
		});

		it("The old elements are still available in the same positions", () => {
			const item = {id: 1};
			const grid = new SpatialGrid2D(9, 9, 3, 4);

			grid.insertAt(2, 3, item);
			grid.resize(8, 7, 2, 3);

			assert.lengthOf(grid.get(2, 3), 1);
			assert.strictEqual(grid.get(2, 3)[0], item);
		});

		it("Elements removed by shrink result in a call to destructor", () => {
			let destructorCalls = 0;
			const item = {id: 1};
			const grid = new SpatialGrid2D(9, 9, 3, 4, {
				destructorCallback: (element, x, y) => {
					destructorCalls++;
					assert.strictEqual(element, item);
					assert.strictEqual(x, 8);
					assert.strictEqual(y, 7);
				},
			});

			grid.insertAt(8, 7, item);
			grid.resize(3, 3);

			assert.equal(grid.size, 0);
			assert.equal(destructorCalls, 1);
		});
	});

	describe('forEach', () => {
		it("Iterates over every item in the spatial grid", () => {
			const expected: any[] = [];
			const grid = createPopulatedGrid(9, 9, 3, 3, expected);

			const given: any[] = [];
			grid.forEach(((element, x, y) => {
				assert.equal(element.x, x);
				assert.equal(element.y, y);
				given.push(element);
			}));

			sortArrayOfCreatedElements(given);
			sortArrayOfCreatedElements(expected);

			assert.deepEqual(given, expected);
		});
	});

	describe("getAll", () => {
		it("Returns all elements in the spatial grid as an array", () => {
			const expected: any[] = [];
			const grid = createPopulatedGrid(9, 9, 3, 3, expected);
			const given = grid.getAll();

			sortArrayOfCreatedElements(expected);
			sortArrayOfCreatedElements(given);

			assert.deepEqual(given, expected);
		});
	});

	describe("getFiltered", () => {
		it("Returns some elements in the spatial grid as an array", () => {
			const elements: any[] = [];
			const grid = createPopulatedGrid(9, 9, 3, 3, elements);
			const given = grid.getFiltered(value => value.id % 3 === 0);
			const expected = elements.filter(value => value.id % 3 === 0);

			sortArrayOfCreatedElements(expected);
			sortArrayOfCreatedElements(given);

			assert.deepEqual(given, expected);
		});
	});

	describe("getFirst", () => {
		it("Returns the first element that returns true on the callback", () => {
			const elements: any[] = [];
			const grid = createPopulatedGrid(9, 9, 3, 3, elements);
			const expected = elements.find(value => value.id === 77);

			assert.deepEqual(grid.getFirst(value => value.id === 77), expected);
		});
	});

	describe("Performance", () => {
		it("Retrieving from a mostly empty bucket should be much faster than from a filled bucket", () => {
			const grid = new SpatialGrid2D(9, 9, 3, 4);

			function fillBucket(bucketX: number, bucketY: number, fillTime: number): void {
				const startTime = Date.now();
				while (Date.now() < startTime + fillTime) {
					for(let i = 0; i < 3; i++) {
						for(let j = 0; j < 4; j++) {
							grid.insertAt(bucketX * 3 + i, bucketY * 4 + j, {});
						}
					}
				}
			}

			fillBucket(0, 0, 400);
			fillBucket(1, 0, 400);
			fillBucket(0, 1, 400);

			const fastBucketGetTime = timeCall(() => grid.get(3, 4));
			const slowBucketGetTime1 = timeCall(() => grid.get(0, 0));
			const slowBucketGetTime2 = timeCall(() => grid.get(3, 0));
			const slowBucketGetTime3 = timeCall(() => grid.get(0, 4));

			assert.isTrue(slowBucketGetTime1 > 5);
			assert.isTrue(slowBucketGetTime2 > 5);
			assert.isTrue(slowBucketGetTime3 > 5);

			assert.isTrue(fastBucketGetTime < slowBucketGetTime1 / 2);
			assert.isTrue(fastBucketGetTime < slowBucketGetTime2 / 2);
			assert.isTrue(fastBucketGetTime < slowBucketGetTime3 / 2);
		});
	});
});