function getReminderDays(qty) {
  if (qty <= 10) return 7;
  if (qty <= 20) return 12;
  if (qty <= 50) return 15;
  return 20;
}

export const checkStockReminders = (loads, retailers) => {
  const today = new Date();
  let alerts = [];

  loads.forEach((load) => {
    const retailer = retailers.find(r => r.id === load.retailerId);
    if (!retailer) return;

    const loadDate = new Date(load.date);

    // 👉 total quantity (sum of items)
    const totalQty = load.items.reduce((sum, item) => sum + item.qty, 0);

    const reminderDays = getReminderDays(totalQty);

    const reminderDate = new Date(loadDate);
    reminderDate.setDate(reminderDate.getDate() + reminderDays);

    if (today >= reminderDate) {
      alerts.push(`📦 ${retailer.shopName} may need restock`);
    }
  });

  if (alerts.length > 0 && Notification.permission === "granted") {
    new Notification("Stock Reminder 📦", {
      body: alerts.join("\n"),
    });
  }
};