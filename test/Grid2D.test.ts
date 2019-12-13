import 'mocha';
import {assert} from 'chai';
import {Grid2D} from "../src/Grid2D";

describe("Grid2D", () => {
	describe("constructor", () => {
		it("Should set dimensions on create", () => {
			const grid = new Grid2D(7, 13, () => undefined);

			assert.equal(grid.width, 7);
			assert.equal(grid.height, 13);
		});
		it("Should set squares through the callback", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.equal(grid.get(0, 0), 0);
			assert.equal(grid.get(1, 0), 1);
			assert.equal(grid.get(0, 1), 100);
			assert.equal(grid.get(1, 1), 101);
			assert.equal(grid.get(0, 2), 200);
			assert.equal(grid.get(1, 2), 201);
		});
		it("Should throw error when width or height is less than 1", () => {
			assert.throws(() => new Grid2D(0, 5, () => undefined));
			assert.throws(() => new Grid2D(4, 0, () => undefined));
		});
		it("Should throw error when width or height is not an integer", () => {
			assert.throws(() => new Grid2D(3.3, 5, () => undefined));
			assert.throws(() => new Grid2D(4, 4.4, () => undefined));
		});
	});

	describe("get UNSAFE_internalArray", () => {
		it("Should return the actual internal array", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);
			const gridArray = grid.UNSAFE_internalArray;

			assert.deepEqual(gridArray, [
				[0, 100, 200],
				[1, 101, 201],
			]);

			grid.set(0, 0, 99);
			assert.equal(gridArray[0][0], 99);
		});
	});

	describe("get", () => {
		it("Should throw error when position outside bounds", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.throws(() => grid.get(-1, 1));
			assert.throws(() => grid.get(2, 1));
			assert.throws(() => grid.get(1, -1));
			assert.throws(() => grid.get(1, 3));
		});
	});

	describe("set", () => {
		it("Should throw error when position outside bounds", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.throws(() => grid.set(-1, 1, 1));
			assert.throws(() => grid.set(2, 1, 1));
			assert.throws(() => grid.set(1, -1, 1));
			assert.throws(() => grid.set(1, 3, 1));
		});
		it("Should set value at specified position", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			grid.set(1, 2, 999);
			assert.equal(grid.get(1, 2), 999);
		});
	});

	describe("isValidPosition", () => {
		it("Should return false when outside bounds", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.equal(grid.isValidPosition(-1, 1), false);
			assert.equal(grid.isValidPosition(2, 1), false);
			assert.equal(grid.isValidPosition(1, -1), false);
			assert.equal(grid.isValidPosition(1, 3), false);
		});

		it("Should return true when a position is inside the grid", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.equal(grid.isValidPosition(1, 1), true);
		});
	});

	describe("resize", () => {
		it("Should throw error when specified dimensions are invalid", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			assert.throw(() => grid.resize(0, 1));
			assert.throw(() => grid.resize(1, 0));
			assert.throw(() => grid.resize(1.5, 1));
			assert.throw(() => grid.resize(1, 1.5));
		});

		it("Should change the dimensions of the grid", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			grid.resize(5, 7);
			assert.equal(grid.width, 5);
			assert.equal(grid.height, 7);
		});
		it("Should call the provider on every new empty square", () => {
			const created: any[] = [];
			const grid = new Grid2D(2, 3, (x, y) => {
				created.push([x, y]);
				return x + y * 100;
			});

			const expected: any[] = [
				[0, 3],
				[1, 3],
				[2, 0],
				[2, 1],
				[2, 2],
				[2, 3],
			];
			created.length = 0;
			grid.resize(3, 4);
			assert.deepEqual(created, expected);
		});

		it("Should call destructor on every removed square", () => {
			const destroyed: any[] = [];
			const grid = new Grid2D(2, 3, {
				defaultValueProvider: (x, y) => x + y * 100,
				destructorCallback: ((element, x, y) => destroyed.push([element, x, y])),
			});

			const expected = [
				[200, 0, 2],
				[1, 1, 0],
				[101, 1, 1],
				[201, 1, 2],
			];
			grid.resize(1, 2);
			assert.deepEqual(destroyed, expected);
		});
		it("Exhaustive test verifying grid was resized up", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			grid.resize(3, 4);
			assert.equal(grid.get(0, 0), 0);
			assert.equal(grid.get(1, 0), 1);
			assert.equal(grid.get(2, 0), 2);
			assert.equal(grid.get(0, 1), 100);
			assert.equal(grid.get(1, 1), 101);
			assert.equal(grid.get(2, 1), 102);
			assert.equal(grid.get(0, 2), 200);
			assert.equal(grid.get(1, 2), 201);
			assert.equal(grid.get(2, 2), 202);
			assert.equal(grid.get(0, 3), 300);
			assert.equal(grid.get(1, 3), 301);
			assert.equal(grid.get(2, 3), 302);
		});
		it("Exhaustive test verifying grid was resized down", () => {
			const grid = new Grid2D(3, 4, (x, y) => x + y * 100);

			grid.resize(2, 3);
			assert.equal(grid.get(0, 0), 0);
			assert.equal(grid.get(1, 0), 1);
			assert.equal(grid.get(0, 1), 100);
			assert.equal(grid.get(1, 1), 101);
			assert.equal(grid.get(0, 2), 200);
			assert.equal(grid.get(1, 2), 201);
		});
	});

	describe("setAll", () => {
		it("Should set all the values", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			grid.setAll(7);
			assert.equal(grid.get(0, 0), 7);
			assert.equal(grid.get(1, 0), 7);
			assert.equal(grid.get(0, 1), 7);
			assert.equal(grid.get(1, 1), 7);
			assert.equal(grid.get(0, 2), 7);
			assert.equal(grid.get(1, 2), 7);
		});
	});

	describe("setAllCallback", () => {
		it("Should set all the values via callback", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			grid.setAllCallback((x, y) => 1 + x + y * 10);
			assert.equal(grid.get(0, 0), 1);
			assert.equal(grid.get(1, 0), 2);
			assert.equal(grid.get(0, 1), 11);
			assert.equal(grid.get(1, 1), 12);
			assert.equal(grid.get(0, 2), 21);
			assert.equal(grid.get(1, 2), 22);
		});
	});

	describe("forEach", () => {
		it("Should call the callback for each position in the grid", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			const expected = [
				[0, 0, 0],
				[100, 0, 1],
				[200, 0, 2],
				[1, 1, 0],
				[101, 1, 1],
				[201, 1, 2],
			];
			const iterated: any[] = [];
			grid.forEach((item, x, y) => iterated.push([item, x, y]));
			assert.deepEqual(iterated, expected);
		});
	});

	describe("toArray", () => {
		it("Should create a copy of the array", () => {
			const grid = new Grid2D(2, 3, (x, y) => x + y * 100);

			const array = grid.toArray();
			grid.set(0, 0, 17);

			const expected = [
				[0, 100, 200],
				[1, 101, 201]
			];
			assert.deepEqual(array, expected);
		});
	});
});