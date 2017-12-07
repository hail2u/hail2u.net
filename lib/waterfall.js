const chainTask = (previous, current) => previous.then(current);

module.exports = (tasks, initialValue) => {
  if (!initialValue) {
    initialValue = null;
  }

  return tasks.reduce(chainTask, Promise.resolve(initialValue));
};
