frappe.ui.form.on('Sales Invoice', {
    refresh: function (frm) {
        frm.add_custom_button(__('View Account Receivable'), function () {

            const company = frm.doc.company;
            const customer = frm.doc.customer;

            const url = `/app/query-report/Account%20Receivable%20Report?company=${company}&customer=${customer}`;
            window.open(url, "_blank");
        });
    }
});