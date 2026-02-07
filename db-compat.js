// JS/db-compat.js
import * as FS from "./firestore-service.js";

window.DB = window.DB || {};

// Regulatory Compliance (existing)
window.DB.getStalls = FS.getStalls;
window.DB.getStallById = FS.getStallById;

window.DB.getViolationCatalog = FS.getViolationCatalog;
window.DB.addViolationCatalogItem = FS.addViolationCatalogItem;
window.DB.updateViolationCatalogItem = FS.updateViolationCatalogItem;
window.DB.deleteViolationCatalogItem = FS.deleteViolationCatalogItem;

window.DB.getInspectionsByStallId = FS.getInspectionsByStallId;

window.DB.getInspectionsByStall = FS.getInspectionsByStallId;
window.DB.getPenaltiesByStall = FS.getPenaltiesByStallId;
window.DB.getInspectionViolations = FS.getInspectionViolations;
window.DB.addInspection = FS.addInspection;
window.DB.updateInspection = FS.updateInspection;
window.DB.deleteInspection = FS.deleteInspection;
window.DB.getInspectionById = FS.getInspectionById;

window.DB.addInspectionViolations = FS.addInspectionViolations;

window.DB.getPenaltiesByStallId = FS.getPenaltiesByStallId;
window.DB.addPenalty = FS.addPenalty;

window.DB.getScheduledInspectionsByStallId = FS.getScheduledInspectionsByStallId;
window.DB.addScheduledInspection = FS.addScheduledInspection;
window.DB.getScheduledInspections = FS.getScheduledInspections;
window.DB.markScheduledCompleted = FS.markScheduledCompleted;

// --------------------
// Vendor - Menu Items
// --------------------
window.DB.getMenuItems = FS.getMenuItems;
window.DB.getMenuItemById = FS.getMenuItemById;
window.DB.addMenuItem = FS.addMenuItem;
window.DB.updateMenuItem = FS.updateMenuItem;
window.DB.deleteMenuItem = FS.deleteMenuItem;

// --------------------
// Vendor - Rental Agreements
// --------------------
window.DB.getRentalAgreements = FS.getRentalAgreements;
window.DB.getRentalByAgreementId = FS.getRentalByAgreementId;
window.DB.addRentalAgreement = FS.addRentalAgreement;
window.DB.updateRentalAgreementByDocId = FS.updateRentalAgreementByDocId;
window.DB.deleteRentalAgreementByDocId = FS.deleteRentalAgreementByDocId;

window.DB.getMenuItemsByStallId = FS.getMenuItemsByStallId;

// --------------------
// Vendor - Order History (Firestore)
// --------------------
window.DB.getVendorOrdersByStallId = FS.getVendorOrdersByStallId;

window.DB.getUserById = FS.getUserById;
window.DB.updateScheduledInspection = FS.updateScheduledInspection;
window.DB.deleteScheduledInspection = FS.deleteScheduledInspection;

// NEW: Vendor Mgmt (menu + rentals)
window.DB.menu = {
  listByStall: FS.getMenuItemsByStallId,
  add: FS.addMenuItem,
  update: FS.updateMenuItem,
  remove: FS.deleteMenuItem,
};

window.DB.rentals = {
  listByStall: FS.getRentalAgreementsByStallId,
  add: FS.addRentalAgreement,
  update: FS.updateRentalAgreement,
  remove: FS.deleteRentalAgreement,
};

// NEW: Orders (customer + vendor)
window.DB.orders = {
  upsert: FS.upsertOrder,
  updateStatus: FS.updateOrderStatus,
  getByCustomerKey: FS.getOrdersByCustomerKey,
  listenByCustomer: FS.listenOrdersByCustomerKey,
  getByStallId: FS.getOrdersByStallId,
  listenByStall: FS.listenOrdersByStallId,
};

// NEW: Users (account.js)
window.DB.users = {
  getById: FS.getUserById,
  getByCredential: FS.getUserByCredential,
  getByUsernameLower: FS.getUserByUsernameLower,
  getNeaUser: FS.getNeaUser,
  create: FS.createUser,
  updatePassword: FS.updateUserPassword,
};

// NEW: OTP reset
window.DB.passwordResets = {
  create: FS.createPasswordReset,
  getById: FS.getPasswordResetById,
  markUsed: FS.markPasswordResetUsed,
};

// (optional debug)
window.DB._fs = FS;
