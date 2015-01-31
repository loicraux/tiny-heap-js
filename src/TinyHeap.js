/* global define, console */
define(function () {
    'use strict';

    // for perf.
    var splice = Array.prototype.splice;

    // Ctor with instance members :
    function TinyHeap(size) {

        // list of free blocks, initialized with a single free block :
        this._freeBlocks = [{
            startAddress: 0,
            size: size
        }];
        // list of allocated blocks :
        this._allocatedBlocks = [];
        // the total size of the heap, in bytes
        this._size = size;
        // maintain the total number of bytes allocated, for stats (peak utilisation)
        this._allocated = 0;
    }

    TinyHeap.prototype = {

        constructor: TinyHeap,

        // free all memory associated with the heap
        deleteTinyHeap: function () {},

        // allocate a given number of bytes on the heap if there is room
        // return the start address of block reserved (aka pointer)
        tinyAlloc: function (nbBytes) {
            var allocatedBlocksChangeStartIdx, blockStartAddress = null;
            allocatedBlocksChangeStartIdx = this._allocatedBlocks.length;
            if (0 <= nbBytes) {
                this._freeBlocks.some(function (freeBlock, fidx) {
                    if (freeBlock.size >= nbBytes) {
                        blockStartAddress = freeBlock.startAddress;
                        freeBlock.startAddress += nbBytes;
                        freeBlock.size -= nbBytes;
                        if (0 === freeBlock.size) {
                            this._freeBlocks.splice(fidx, 1); // remove the free block of size 0
                        }
                        this._allocated += nbBytes;
                        // Look for the appropriate index where to insert a
                        // new allocated block in the sorted array
                        // of allocated blocks :
                        this._allocatedBlocks.some(function (allocatedBlock, idx) {
                            // search the first allocated block which start address
                            // is greater than the newly allocated block's start
                            // address :
                            var found = allocatedBlock.startAddress > blockStartAddress;
                            if (found) {
                                allocatedBlocksChangeStartIdx = idx;
                            }
                            return found;
                        }, this);
                        // make the change (insertion) at the right
                        // position :
                        this._allocatedBlocks.splice(allocatedBlocksChangeStartIdx,
                                                    0, // nothing to remove
                                                    {
                                                        startAddress: blockStartAddress,
                                                        size: nbBytes
                                                    });
                    }
                    return blockStartAddress;
                }, this);
            } else {
                throw new Error('Wrong Amount Of Bytes');
            }
            return blockStartAddress;
        },

        // free a specific location on the heap
        // input: the start address (aka pointer) of the block to free
        // (continous free blocks are merged)
        tinyFree: function (blockStartAddress) {
            var freedBlock, lowerAdjacentFreeBlock, spliceArgs,
                freedBlockToBeAdded, adjacentToLower, freeBlocksChangeStartIdx = -1;

            freedBlockToBeAdded = true;

            if (0 <= blockStartAddress && blockStartAddress <= this._size) {
                // Search the allocated block in the array of allocated blocks :
                this._allocatedBlocks.some(function (allocatedBlock, idx) {
                    if (allocatedBlock.startAddress === blockStartAddress) {
                        // remove the found allocated block from the array of
                        // allocated blocks :
                        freedBlock = this._allocatedBlocks.splice(idx, 1)[0];
                        this._allocated -= allocatedBlock.size;
                    }
                    return freedBlock;
                }, this);
            }

            if (freedBlock) {
                // search for the block which start address is greater than the
                // start address of the block to free :
                if (false === this._freeBlocks.some(function (nextFreeBlock, idx) {
                    var found = nextFreeBlock.startAddress > blockStartAddress;
                    if (found) {
                        // If the block to be freed is adjacent to the next free
                        // block, merge them:
                        if (blockStartAddress + freedBlock.size === nextFreeBlock.startAddress) {
                            nextFreeBlock.startAddress = freedBlock.startAddress;
                            nextFreeBlock.size += freedBlock.size;
                            freedBlock = nextFreeBlock;
                            freeBlocksChangeStartIdx = idx;
                            // no need to add the freed & merged block to the array,
                            // it is already in the array :
                            freedBlockToBeAdded = false;
                        } else {
                            // Not adjacent to next free block, the newly freed
                            // block will be inserted before :
                            freeBlocksChangeStartIdx = idx - 1;
                        }
                    }
                    return found;
                }, this)) {
                    // if not found, we will have to insert at the end :
                    freeBlocksChangeStartIdx = this._freeBlocks.length;
                }
                // Now the freedBlock can be adjacent to another free block starting at
                // a lower address, let's check that...
                if (0 < freeBlocksChangeStartIdx) {
                    lowerAdjacentFreeBlock = this._freeBlocks[freeBlocksChangeStartIdx - 1];
                    adjacentToLower = lowerAdjacentFreeBlock.startAddress + lowerAdjacentFreeBlock.size === freedBlock.startAddress;
                    if (adjacentToLower) {
                        lowerAdjacentFreeBlock.size += freedBlock.size;
                    }
                }
                // Eventually make the changes to the this._freeBlocks array using splice :
                // (In some cases, this can have no effect)
                spliceArgs = [freeBlocksChangeStartIdx, true === adjacentToLower && true !== freedBlockToBeAdded ? 1 : 0];
                if (true !== adjacentToLower && true === freedBlockToBeAdded) {
                    spliceArgs.push(freedBlock);
                }
                splice.apply(this._freeBlocks, spliceArgs);

            } else {
                throw new Error('Block to free not found!');
            }
        },

        dump: function () {
            var allocatedBlockIdx, freeBlockIdx,
                nbAllocatedBlocks, nbFreeBlocks,
                someAllocatedBlocksLeft, someFreeBlocksLeft,
                allocatedBlockStart, freeBlockStart;

            nbAllocatedBlocks = this._allocatedBlocks.length;
            nbFreeBlocks = this._freeBlocks.length;
            allocatedBlockIdx = freeBlockIdx = 0;

            console.log('Heap size is %d bytes', this._size);

            someAllocatedBlocksLeft = allocatedBlockIdx < nbAllocatedBlocks;
            someFreeBlocksLeft = freeBlockIdx < nbFreeBlocks;

            while (someAllocatedBlocksLeft && someFreeBlocksLeft) {
                allocatedBlockStart = this._allocatedBlocks[allocatedBlockIdx].startAddress;
                freeBlockStart = this._freeBlocks[freeBlockIdx].startAddress;

                if (allocatedBlockStart < freeBlockStart) {
                    console.log('Block @%d is allocated (%d bytes)',
                        allocatedBlockStart,
                        this._allocatedBlocks[allocatedBlockIdx++].size);
                } else if (freeBlockStart < allocatedBlockStart) {
                    console.log('Block @%d is free (%d bytes)',
                        freeBlockStart,
                        this._freeBlocks[freeBlockIdx++].size);

                } else {
                    throw new Error('Unexpected overlapping free and allocated blocks');
                }

                someAllocatedBlocksLeft = allocatedBlockIdx < nbAllocatedBlocks;
                someFreeBlocksLeft = freeBlockIdx < nbFreeBlocks;
            }

            if (someAllocatedBlocksLeft) {
                this._allocatedBlocks.slice(allocatedBlockIdx, nbAllocatedBlocks).forEach(function (allocatedBlock) {
                    console.log('Block @%d is allocated (%d bytes)',
                        allocatedBlock.startAddress,
                        allocatedBlock.size);
                });
            }

            if (someFreeBlocksLeft) {
                this._freeBlocks.slice(freeBlockIdx, nbFreeBlocks).forEach(function (freeBlock) {
                    console.log('Block @%d is free (%d bytes)',
                        freeBlock.startAddress,
                        freeBlock.size);
                });
            }

            console.log('%d bytes allocated', this._allocated);
            console.log('Peak utilization: %f%', this._allocated / this._size * 100);

        }
    };

    return TinyHeap;
});
