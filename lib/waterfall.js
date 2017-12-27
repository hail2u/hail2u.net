const chainTask = async (previous, current) => current(await previous);

module.exports = (tasks, initialValue) => {
  if (!initialValue) {
    initialValue = null;
  }

  return tasks.reduce(chainTask, Promise.resolve(initialValue));
};
