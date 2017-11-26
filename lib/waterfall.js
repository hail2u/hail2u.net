"use strict";

module.exports = (tasks, initialValue) => {
  if (!initialValue) {
    initialValue = null;
  }

  return tasks.reduce((p, c) => {
    return p.then(c);
  }, Promise.resolve(initialValue));
};
