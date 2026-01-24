
export const getChangedValues = (allValues, initialValues) => {
  if (allValues === initialValues) return undefined;

  if (allValues === undefined || allValues === null || initialValues === undefined || initialValues === null) {
      return allValues !== initialValues ? allValues : undefined;
  }

  if (Array.isArray(allValues) && Array.isArray(initialValues)) {
      return JSON.stringify(allValues) === JSON.stringify(initialValues) 
          ? undefined 
          : allValues;
  }

  if (typeof allValues === 'object' && typeof initialValues === 'object') {
      const diff = {};
      let hasChanges = false;

      for (const key in allValues) {
          const change = getChangedValues(allValues[key], initialValues[key]);
          if (change !== undefined) {
              diff[key] = change;
              hasChanges = true;
          }
      }
      return hasChanges ? diff : undefined;
  }

  return allValues;
};