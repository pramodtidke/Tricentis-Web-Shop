const Order = require("./Order");
const OrderItem = require("./OrderItem");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

module.exports = { Order, OrderItem };