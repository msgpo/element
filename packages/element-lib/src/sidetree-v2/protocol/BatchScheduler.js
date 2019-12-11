const { batchingIntervalInSeconds } = require('./protocol-parameters');
const { getDidUniqueSuffix } = require('../func');

class BatchScheduler {
  constructor(sidetree) {
    /**
     * Denotes if the periodic batch writing should continue to occur.
     */
    this.continuePeriodicBatchWriting = false;
    this.sidetree = sidetree;
  }

  /**
   * The function that starts periodically anchoring operation batches to blockchain.
   */
  startPeriodicBatchWriting() {
    this.continuePeriodicBatchWriting = true;
    setImmediate(async () => this.writeOperationBatch());
  }

  /**
   * Stops periodic batch writing.
   * Mainly used for test purposes.
   */
  stopPeriodicBatchWriting() {
    console.info('Stopped periodic batch writing.');
    this.continuePeriodicBatchWriting = false;
  }

  /**
   * Processes the operations in the queue.
   */
  async writeOperationBatch() {
    const start = Date.now(); // For calculating time taken to write operations.

    try {
      console.info('Start operation batch writing...');
      await this.sidetree.batchWrite.write();
    } catch (error) {
      console.error('Unexpected and unhandled error during batch writing, investigate and fix:');
      console.error(error);
    } finally {
      const end = Date.now();
      console.info(`End operation batch writing. Duration: ${(end - start) / 1000} ms.`);

      if (this.continuePeriodicBatchWriting) {
        console.info(`Waiting for ${batchingIntervalInSeconds} seconds before writing another batch.`);
        setTimeout(async () => this.writeOperationBatch(), batchingIntervalInSeconds * 1000);
      }
    }
  }

  /**
   * Processes a batch of operations now
   */
  async writeNow(payload) {
    const didUniqueSuffix = getDidUniqueSuffix(payload);
    await this.sidetree.operationQueue.enqueue(didUniqueSuffix, payload);
    return this.sidetree.batchWrite();
  }
}

module.exports = BatchScheduler;
