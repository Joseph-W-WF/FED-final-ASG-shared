// JS/db-compat.js
import * as FS from "./firestore-service.js";

// Create/ensure global DB object
window.DB = window.DB || {};

// --------------------
// Core / Stalls
// --------------------
window.DB.getStalls = FS.getStalls;
window.DB.getStallById = FS.getStallById;

// --------------------
// NEA - Violation Catalog
// --------------------
window.DB.getViolationCatalog = FS.getViolationCatalog;
window.DB.addViolationCatalogItem = FS.addViolationCatalogItem;

// --------------------
// NEA - Inspections
// --------------------
window.DB.addInspection = FS.addInspection;
window.DB.getInspectionsByStall = FS.getInspectionsByStall;

window.DB.addInspectionViolations = FS.addInspectionViolations;
window.DB.getInspectionViolations = FS.getInspectionViolations;

// --------------------
// NEA - Penalties
// --------------------
window.DB.addPenalty = FS.addPenalty;
window.DB.getPenaltiesByStall = FS.getPenaltiesByStall;

// --------------------
// NEA - Scheduled Inspections (NEW)
// --------------------
window.DB.addScheduledInspection = FS.addScheduledInspection;
window.DB.getScheduledInspections = FS.getScheduledInspections;
window.DB.markScheduledCompleted = FS.markScheduledCompleted;

