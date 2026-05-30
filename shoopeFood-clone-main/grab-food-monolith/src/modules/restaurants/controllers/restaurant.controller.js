const restaurantService = require('../services/restaurant.service');
const { normalizeRestaurant, normalizeChangeRequest } = require('../mappers/restaurant.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.listRestaurants = asyncHandler(async (req, res) => {
  const items = await restaurantService.listRestaurants(req.query);
  return apiResponse.ok(res, items.map(normalizeRestaurant), 'Restaurants fetched');
});

exports.getRestaurantById = asyncHandler(async (req, res) => {
  const item = await restaurantService.getRestaurantById(Number(req.params.id));
  return apiResponse.ok(res, normalizeRestaurant(item), 'Restaurant fetched');
});

exports.listMyRestaurants = asyncHandler(async (req, res) => {
  const items = await restaurantService.listMyRestaurants(req.user.id);
  return apiResponse.ok(res, items.map(normalizeRestaurant), 'My restaurants fetched');
});

exports.createRestaurant = asyncHandler(async (req, res) => {
  const item = await restaurantService.createRestaurant(req.body);
  return apiResponse.created(res, normalizeRestaurant(item), 'Restaurant created');
});

exports.updateRestaurant = asyncHandler(async (req, res) => {
  const requestedBy = req.user?.id;
  const { restaurant, changeRequest } = await restaurantService.updateRestaurant(
    Number(req.params.id),
    req.body,
    requestedBy
  );
  return apiResponse.ok(
    res,
    {
      restaurant: normalizeRestaurant(restaurant),
      changeRequest: changeRequest ? normalizeChangeRequest(changeRequest) : null,
    },
    'Restaurant updated'
  );
});

exports.deleteRestaurant = asyncHandler(async (req, res) => {
  const item = await restaurantService.deleteRestaurant(Number(req.params.id));
  return apiResponse.ok(res, normalizeRestaurant(item), 'Restaurant deleted');
});

exports.patchRestaurantStatus = asyncHandler(async (req, res) => {
  const item = await restaurantService.patchRestaurantStatus(
    Number(req.params.id),
    req.body.isOpen
  );
  return apiResponse.ok(res, normalizeRestaurant(item), 'Status updated');
});

exports.patchRestaurantTodayStatus = asyncHandler(async (req, res) => {
  const item = await restaurantService.patchRestaurantTodayStatus(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeRestaurant(item), 'Today status updated');
});

exports.patchRestaurantLocation = asyncHandler(async (req, res) => {
  const item = await restaurantService.patchRestaurantLocation(
    Number(req.params.id),
    req.body.latitude,
    req.body.longitude
  );
  return apiResponse.ok(res, normalizeRestaurant(item), 'Location updated');
});

exports.listPendingRestaurants = asyncHandler(async (req, res) => {
  const items = await restaurantService.listPendingRestaurants();
  return apiResponse.ok(res, items.map(normalizeRestaurant), 'Pending restaurants fetched');
});

exports.approveRestaurant = asyncHandler(async (req, res) => {
  const approvedBy = req.body.approvedBy || req.user?.id;
  const item = await restaurantService.approveRestaurant(Number(req.params.id), approvedBy);
  return apiResponse.ok(res, normalizeRestaurant(item), 'Restaurant approved');
});

exports.rejectRestaurant = asyncHandler(async (req, res) => {
  const item = await restaurantService.rejectRestaurant(Number(req.params.id), req.body.reason);
  return apiResponse.ok(res, normalizeRestaurant(item), 'Restaurant rejected');
});

exports.listChangeRequests = asyncHandler(async (req, res) => {
  const items = await restaurantService.listChangeRequests(req.query.status || 'PENDING');
  return apiResponse.ok(res, items.map(normalizeChangeRequest), 'Change requests fetched');
});

exports.approveChangeRequest = asyncHandler(async (req, res) => {
  const reviewedBy = req.body.reviewedBy || req.user?.id;
  const { changeRequest, restaurant } = await restaurantService.approveChangeRequest(
    Number(req.params.id),
    reviewedBy
  );
  return apiResponse.ok(
    res,
    {
      changeRequest: normalizeChangeRequest(changeRequest),
      restaurant: normalizeRestaurant(restaurant),
    },
    'Change request approved'
  );
});

exports.rejectChangeRequest = asyncHandler(async (req, res) => {
  const item = await restaurantService.rejectChangeRequest(Number(req.params.id), req.body.reason);
  return apiResponse.ok(res, normalizeChangeRequest(item), 'Change request rejected');
});
