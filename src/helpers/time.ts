import moment = require('moment');

export const isBeforeDate = (date: Date) => {
  return moment().isBefore(moment(date, 'YYYY-MM-DD'));
};

export const isAfterDate = (date: Date) => {
  return moment().isAfter(moment(date, 'YYYY-MM-DD'));
};
