// Nodemailer removed as per user request

export const sendEmail = async (to, subject, html) => {
  console.log(`Mock Email sent to ${to}. Subject: ${subject}`);
};

export const sendOrderConfirmation = async (userEmail, order) => {
  console.log(`Mock Order Confirmation sent to ${userEmail} for Order #${order.id}`);
};

export const sendShippingUpdate = async (userEmail, order) => {
  console.log(`Mock Shipping Update sent to ${userEmail} for Order #${order.id}`);
};
