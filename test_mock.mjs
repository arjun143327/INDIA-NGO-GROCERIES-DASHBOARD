import fs from 'fs';

// Mock localStorage
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, val) { this.data[key] = String(val); }
};
global.window = {
  dispatchEvent() {}
};
global.crypto = {
  randomUUID() { return "uuid"; }
};

import('./src/utils/mockDb.js').then(({ mockDb }) => {
  console.log("Initial stock cost:", mockDb.getCurrentStock()[0].estimated_cost);
  const itemId = mockDb.getCurrentStock()[0].item_id;
  console.log("Updating item ID:", itemId);
  mockDb.updateItem(itemId, { estimated_cost: 40 });
  console.log("Updated stock cost:", mockDb.getCurrentStock()[0].estimated_cost);
}).catch(console.error);
