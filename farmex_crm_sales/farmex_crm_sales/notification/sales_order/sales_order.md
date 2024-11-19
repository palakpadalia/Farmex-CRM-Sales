A new Sales Order has been created! 🎉  
- **Customer**: {{ doc.customer }}  
- **Salesperson**: {{ doc.sales_team[0].sales_person if doc.sales_team else "Not Assigned" }}  
- **Order Date**: {{ frappe.utils.formatdate(doc.transaction_date) }}  
- **Total Amount**: {{ frappe.utils.fmt_money(doc.grand_total, currency=doc.currency) }}  
🚀 Please review the order and take the necessary action.