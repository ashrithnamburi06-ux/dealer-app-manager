export const checkDueReminders = (retailers, loads) => {
  const today = new Date();
  let alerts = [];

  retailers.forEach((retailer) => {
    if (retailer.pendingAmount <= 0) return;

    const myLoads = loads.filter(
      (l) => l.retailerId === retailer.id
    );

    if (myLoads.length === 0) return;

    const latestLoad = myLoads.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];

    const loadDate = new Date(latestLoad.date);

    const diffDays = Math.floor(
      (today - loadDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays >= 30) {
      alerts.push(`🚨 ${retailer.shopName} - ₹${retailer.pendingAmount}`);
    } else if (diffDays >= 14) {
      alerts.push(`🔴 ${retailer.shopName} - ₹${retailer.pendingAmount}`);
    } else if (diffDays >= 7) {
      alerts.push(`⚠️ ${retailer.shopName} - ₹${retailer.pendingAmount}`);
    }
  });

  if (alerts.length > 0) {
    alert("Due Reminders:\n\n" + alerts.join("\n"));
  }
};