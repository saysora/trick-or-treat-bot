import moment = require('moment');

export const isBeforeDate = (date: Date) => {
  return moment().isBefore(moment(date, 'YYYY-MM-DD'));
};

export const isAfterDate = (date: Date) => {
  return moment().isAfter(moment(date, 'YYYY-MM-DD'));
};

export const calcToMs = (value: number, unitOfTime: 's' | 'm') => {
  switch (unitOfTime) {
    case 's':
      return value * 60; // seconds
    case 'm':
      return value * 60_000; // minutes
    default:
      return null;
  }
};
