const mongoose = require("mongoose");

/**
 * MongoDB Transaction Manager
 * Handles distributed transactions for multi-document operations
 * Ensures ACID properties (Atomicity, Consistency, Isolation, Durability)
 */

/**
 * Execute a transaction with automatic session management
 * @param {Function} transactionCallback - Async function that performs operations within transaction
 * @returns {Promise} - Result of the transaction
 */
exports.executeTransaction = async (transactionCallback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await transactionCallback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

/**
 * Execute multiple operations within a single transaction
 * Useful for complex multi-document updates
 * @param {Array} operations - Array of {model, operation, args}
 * @returns {Promise} - Results of all operations
 */
exports.executeBulkTransaction = async (operations) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const results = [];

        for (const op of operations) {
            const { model, operation, args } = op;

            if (!model || !operation) {
                throw new Error("Each operation must have 'model' and 'operation' properties");
            }

            // Add session to args
            const argsWithSession = Array.isArray(args) ? [...args] : [args];
            const lastArg = argsWithSession[argsWithSession.length - 1];

            if (typeof lastArg === "object" && lastArg !== null) {
                lastArg.session = session;
            } else {
                argsWithSession.push({ session });
            }

            // Execute the operation
            const result = await model[operation](...argsWithSession);
            results.push(result);
        }

        await session.commitTransaction();
        return results;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

/**
 * Transaction for order creation with inventory deduction
 * Ensures order and inventory updates happen atomically
 * @param {Function} callback - Function that creates order and updates inventory
 * @returns {Promise} - Order data
 */
exports.executeOrderTransaction = async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw new Error(`Order transaction failed: ${error.message}`);
    } finally {
        await session.endSession();
    }
};

/**
 * Transaction for inventory updates
 * Handles stock additions and deductions atomically
 * @param {Function} callback - Function that performs inventory operations
 * @returns {Promise} - Updated inventory data
 */
exports.executeInventoryTransaction = async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw new Error(`Inventory transaction failed: ${error.message}`);
    } finally {
        await session.endSession();
    }
};

/**
 * Check if transaction is active
 * @param {Session} session - Mongoose session
 * @returns {Boolean}
 */
exports.isTransactionActive = (session) => {
    return session && session.inTransaction();
};

/**
 * Get session options for write operations
 * Pass these when performing operations within a transaction
 * @param {Session} session - Mongoose session
 * @returns {Object} - Options object with session
 */
exports.getSessionOptions = (session) => {
    return { session };
};

/**
 * Retry transaction on failure
 * Useful for handling temporary failures
 * @param {Function} transactionCallback - The transaction function
 * @param {Number} maxRetries - Maximum retry attempts (default: 3)
 * @param {Number} delayMs - Delay between retries in milliseconds (default: 100)
 * @returns {Promise} - Result of the transaction
 */
exports.executeWithRetry = async (transactionCallback, maxRetries = 3, delayMs = 100) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const result = await transactionCallback(session);
                await session.commitTransaction();
                return result;
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                await session.endSession();
            }
        } catch (error) {
            lastError = error;

            // Don't retry on validation errors or auth errors
            if (error.message.includes("validation") || error.message.includes("unauthorized")) {
                throw error;
            }

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }
    }

    throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError.message}`);
};
