const approvalEmailTemplate = (restaurantName, message = "") => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10b981;">🎉 Restaurant Application Approved!</h2>
    <p>Congratulations! Your restaurant <strong>${restaurantName}</strong> has been approved and is now live on our platform.</p>
    ${message ? `<p><strong>Message from admin:</strong> ${message}</p>` : ""}
    <p>You can now:</p>
    <ul>
      <li>Add and manage your menu items</li>
      <li>Receive and process orders</li>
      <li>Update your restaurant information</li>
      <li>View analytics and reports</li>
    </ul>
    <p>Welcome to our food delivery platform!</p>
    <p>Best regards,<br>Food Delivery Team</p>
  </div>
`

const rejectionEmailTemplate = (restaurantName, reason) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ef4444;">Restaurant Application Status</h2>
    <p>Thank you for your interest in joining our platform. Unfortunately, we cannot approve your restaurant <strong>${restaurantName}</strong> at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>If you believe this is an error or would like to reapply after addressing the concerns, please contact our support team.</p>
    <p>Best regards,<br>Food Delivery Team</p>
  </div>
`

const orderConfirmationTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10b981;">Order Confirmed!</h2>
    <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
    <p><strong>Restaurant:</strong> ${order.restaurant.name}</p>
    <p><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryTime}</p>
    <p><strong>Total:</strong> $${order.pricing.total}</p>
    <p>We'll keep you updated on your order status.</p>
    <p>Thank you for choosing our platform!</p>
  </div>
`

module.exports = {
  approvalEmailTemplate,
  rejectionEmailTemplate,
  orderConfirmationTemplate,
}
