/* global define, beforeEach */
define(['jasmine'], function (jasmine) {
    'use strict';
    beforeEach(function () {
        this.addMatchers({
            toBeBlock: function (expectedStartAddress, expectedSize) {
                var block = this.actual;
                return block.startAddress === expectedStartAddress &&
                    block.size === expectedSize;
            },
            toHaveFreeBlocksLength: function (expectedNbFreeBlocks) {
                var heap = this.actual;
                return heap._freeBlocks.length === expectedNbFreeBlocks;
            },
            toHaveAllocatedBlocksLength: function (expectedNbAllocatedBlocks) {
                var heap = this.actual;
                return heap._allocatedBlocks.length === expectedNbAllocatedBlocks;
            },
            toBeOfSize: function (expectedHeapSize) {
                var heap = this.actual;
                return heap._size === expectedHeapSize;
            }
        });
    });

    return jasmine;
});
