/* global define, describe, beforeEach, expect, it */
define([
    // all specs should require the SpecHelper
    // with jasmine setup and plugins
    'spec/SpecHelper',

    // spec dependencies
    'TinyHeap'
], function (jasmine, TinyHeap) {
    'use strict';

    return describe('TinyHeap test suite', function () {

        var heap, ptrs;

        beforeEach(function () {
            heap = new TinyHeap(1024);
            ptrs = [];
        });

        describe('basic tests', function () {

            it('must be correctly initialized', function () {
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(0);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 1024);
                expect(heap).toHaveAllocatedBlocksLength(0);
            });

            it('must be correctly released/deleted', function () {
                heap.deleteTinyHeap();
                expect(heap).toBeOfSize(0);
                expect(heap._allocated).toBe(0);
                expect(heap).toHaveFreeBlocksLength(0);
                expect(heap).toHaveAllocatedBlocksLength(0);
            });

            it('allocated correctly blocks of mem', function () {
                var expectedNbAllocatedBytes, expectedNbOfAllocatedBlocks;
                expectedNbAllocatedBytes = 0;
                expectedNbOfAllocatedBlocks = 0;
                [2, 128, 256, 7].forEach(function (sizeToAlloc) {
                    expectedNbAllocatedBytes += sizeToAlloc;
                    expectedNbOfAllocatedBlocks++;
                    ptrs.push(heap.tinyAlloc(sizeToAlloc));
                });
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(expectedNbAllocatedBytes);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap).toHaveAllocatedBlocksLength(expectedNbOfAllocatedBlocks);
                expect(ptrs).toEqual([0, 2, 130, 386]);
                expect(heap._allocatedBlocks[0]).toBeBlock(0, 2);
                expect(heap._allocatedBlocks[1]).toBeBlock(2, 128);
                expect(heap._allocatedBlocks[2]).toBeBlock(130, 256);
                expect(heap._allocatedBlocks[3]).toBeBlock(386, 7);
                expect(heap._freeBlocks[0]).toBeBlock(393, 631);
            });

            it('returns a null ptr if mem to alloc is > heap\'s size', function () {
                var ptr = heap.tinyAlloc(1025);
                expect(ptr).toBe(null);
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(0);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 1024);
                expect(heap).toHaveAllocatedBlocksLength(0);
            });
        });

        describe('merges correctly free blocks when adjacents', function () {

            function blockNo(idx) {
                return (idx - 1) * 256;
            }

            beforeEach(function () {
                var currAllocatedSize = 0;
                // allocated 4 blocks of same size :
                do {
                    expect(heap.tinyAlloc(256)).toBe(currAllocatedSize);
                    currAllocatedSize = heap._allocated;
                } while (1024 > currAllocatedSize);

                expect(heap).toHaveFreeBlocksLength(0);
                expect(heap).toHaveAllocatedBlocksLength(4);
            });

            it('merges correctly uc 1', function () {
                heap.tinyFree(blockNo(4));
                heap.tinyFree(blockNo(3));
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(512);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(512, 512);
                expect(heap).toHaveAllocatedBlocksLength(2);
            });

            it('merges correctly uc 2', function () {
                heap.tinyFree(blockNo(4));
                heap.tinyFree(blockNo(3));
                heap.tinyFree(blockNo(1));
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(256);
                expect(heap).toHaveFreeBlocksLength(2);
                expect(heap._freeBlocks[0]).toBeBlock(0, 256);
                expect(heap._freeBlocks[1]).toBeBlock(512, 512);
                expect(heap).toHaveAllocatedBlocksLength(1);
            });

            it('merges correctly uc 3', function () {
                heap.tinyFree(blockNo(4));
                heap.tinyFree(blockNo(3));
                heap.tinyFree(blockNo(1));
                heap.tinyFree(blockNo(2));
                expect(heap).toBeOfSize(1024);
                expect(heap._allocated).toBe(0);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 1024);
                expect(heap).toHaveAllocatedBlocksLength(0);
            });

            it('merges correctly uc 4', function () {
                heap.tinyFree(blockNo(1));
                expect(heap._allocated).toBe(768);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 256);
                expect(heap).toHaveAllocatedBlocksLength(3);
                heap.tinyFree(blockNo(2));
                expect(heap._allocated).toBe(512);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 512);
                expect(heap).toHaveAllocatedBlocksLength(2);
                heap.tinyFree(blockNo(4));
                expect(heap._allocated).toBe(256);
                expect(heap).toHaveFreeBlocksLength(2);
                expect(heap._freeBlocks[0]).toBeBlock(0, 512);
                expect(heap._freeBlocks[1]).toBeBlock(768, 256);
                expect(heap).toHaveAllocatedBlocksLength(1);
                heap.tinyFree(blockNo(3));
                expect(heap._allocated).toBe(0);
                expect(heap).toHaveFreeBlocksLength(1);
                expect(heap._freeBlocks[0]).toBeBlock(0, 1024);
                expect(heap).toHaveAllocatedBlocksLength(0);
            });
        });
    });
});
