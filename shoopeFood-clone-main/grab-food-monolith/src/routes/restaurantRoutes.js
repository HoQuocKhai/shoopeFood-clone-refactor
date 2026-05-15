const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

// ==== PUBLIC ROUTES ====
router.get("/", restaurantController.listRestaurants);

// ==== AUTHENTICATED ROUTES ====
router.get("/mine", auth, restaurantController.listMyRestaurants);
router.post("/", auth, restaurantController.createRestaurant);

// ==== STATUS ROUTES ====
router.patch("/:id/status", auth, restaurantController.patchRestaurantStatus);
router.patch("/:id/today-status", auth, restaurantController.patchRestaurantTodayStatus);
router.patch("/:id/location", auth, restaurantController.patchRestaurantLocation);

// ==== ADMIN ROUTES ====
router.get("/admin/pending", auth, requireRole(["ADMIN"]), restaurantController.listPendingRestaurants);
router.patch("/admin/:id/approve", auth, requireRole(["ADMIN"]), restaurantController.approveRestaurant);
router.patch("/admin/:id/reject", auth, requireRole(["ADMIN"]), restaurantController.rejectRestaurant);

// ==== CHANGE REQUEST ROUTES ====
router.get("/admin/change-requests", auth, requireRole(["ADMIN"]), restaurantController.listChangeRequests);
router.patch("/admin/change-requests/:id/approve", auth, requireRole(["ADMIN"]), restaurantController.approveChangeRequest);
router.patch("/admin/change-requests/:id/reject", auth, requireRole(["ADMIN"]), restaurantController.rejectChangeRequest);

// ==== ID-BASED ROUTES (KEEP LAST) ====
router.get("/:id", restaurantController.getRestaurantById);
router.put("/:id", auth, restaurantController.updateRestaurant);
router.delete("/:id", auth, restaurantController.deleteRestaurant);

module.exports = router;
