/**
 * Utility functions for filtering and initializing worker selection.
 */

/**
 * Filters the list of all available workers to exclude those already selected.
 * @param {Array<Object>} allWorkers - Full list of workers from the database.
 * @param {Array<Object>} selectedWorkers - List of workers currently selected for the task (must contain _id).
 * @returns {Array<Object>} List of workers that are available to be added.
 */
export const filterAvailableWorkers = (allWorkers, selectedWorkers) => {
  const selectedIds = new Set(selectedWorkers.map(w => w._id));
  return allWorkers.filter(worker => !selectedIds.has(worker._id));
};

/**
 * Initializes the list of selected workers based on workers previously assigned to an order.
 * Sets the 'present' flag to true for initial state.
 * @param {Array<Object>} allWorkers - Full list of workers from the database.
 * @param {Array<Object>} assignedWorkers - Workers previously linked to the order (must contain _id).
 * @returns {Array<Object>} Initial list of selected workers with the 'present' flag.
 */
export const initializeSelectedWorkers = (allWorkers, assignedWorkers = []) => {
  const assignedIds = new Set(assignedWorkers.map(w => w._id));
  return allWorkers
    .filter(worker => assignedIds.has(worker._id))
    .map(worker => ({ ...worker, present: true }));
};
