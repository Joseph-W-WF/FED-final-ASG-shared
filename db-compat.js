// JS/db-compat.js
import * as FS from "./firestore-service.js";

// Expose ONLY what your project expects.
// Add more mappings as needed.
window.DB = window.DB || {};

window.DB.getStalls = FS.getStalls;
window.DB.getStallById = FS.getStallById;

// NEA
window.DB.getViolationCatalog = FS.getViolationCatalog;
window.DB.addViolationCatalogItem = FS.addViolationCatalogItem;

window.DB.addInspection = FS.addInspection;
window.DB.getInspectionsByStall = FS.getInspectionsByStall;

window.DB.addInspectionViolations = FS.addInspectionViolations;
window.DB.getInspectionViolations = FS.getInspectionViolations;

window.DB.addPenalty = FS.addPenalty;
window.DB.getPenaltiesByStall = FS.getPenaltiesByStall;
