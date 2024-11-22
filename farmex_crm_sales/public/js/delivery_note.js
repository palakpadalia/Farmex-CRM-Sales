frappe.ui.form.on('Delivery Note', {
    refresh: function (frm) {
        if (!frm.is_new()) {
            frm.set_df_property('custom_sales_person', 'reqd', 1);
        } else {
            frm.set_df_property('custom_sales_person', 'reqd', 0);
        }
    },

});