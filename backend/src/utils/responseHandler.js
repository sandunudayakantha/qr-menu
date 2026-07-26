/**
 * Standardized Success Response Structure
 */
const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  const responsePayload = {
    success: true,
    message
  };

  if (data !== null) {
    responsePayload.data = data;
  }

  if (meta !== null) {
    responsePayload.meta = meta;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = sendResponse;
