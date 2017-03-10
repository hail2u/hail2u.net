"use strict";

module.exports = (tasks, initialValue) => {
  if (!initialValue) {
    initialValue = null;
  }

  return tasks.reduce((p, t) => {
    return p.then(t);
  }, Promise.resolve(initialValue));
};
