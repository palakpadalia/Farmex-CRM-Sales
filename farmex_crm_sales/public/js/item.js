frappe.ui.form.on("UOM Conversion Detail", {
    uom: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.uom) {
            frappe.call({
                method: "erpnext.stock.doctype.item.item.get_uom_conv_factor",
                args: {
                    uom: row.uom,
                    stock_uom: frm.doc.stock_uom,
                    item_code: frm.doc.item_code,
                },
                callback: function (r) {
                    if (!r.exc && r.message) {
                        frappe.model.set_value(cdt, cdn, "conversion_factor", r.message);
                    }
                },
            });
        }
    },
});