frappe.ui.form.on('Sales Order Cancelled Item', {
    remarks: function (frm, cdt, cdn) {
        frappe.call({
            method: "farmex_crm_sales.py.sales_order.send_notification",
            args: { doc: frm.doc.name }
        });
    }
});

let uom_lists = {}; // Store UOMs for each item row

frappe.ui.form.on('Sales Order', {
    onload: function (frm) {
        if (frm.is_new()) {
            frm.set_value('delivery_date', get_next_business_day(2));
        }



        fetch_user_role(frm, (role) => {
            if (role === "Pre Sales") {
                fetch_available_stock_items(frm, true);
            }
        });
    },

    customer: function (frm) {
        get_outstanding_amount(frm);
        fetch_available_stock_items(frm, true);
    },

    refresh: function (frm) {
        apply_item_filters(frm);
        add_custom_buttons(frm);
        frm.set_df_property('custom_sales_person', 'reqd', !frm.is_new());

        if (frm.doc.docstatus === 1 && flt(frm.doc.per_delivered) < 100) {
            add_delivery_note_button(frm);
        }

        if (frm.doc.docstatus === 0) {
            let promises = frm.doc.items.map(row => row.item_code ? fetch_uom_list(frm, row) : Promise.resolve());
            Promise.all(promises).then(() => set_uom_filter(frm));
        }

        fetch_user_role(frm, (role) => {
            if (role === "Pre Sales") {
                fetch_available_stock_items(frm, true);
            }
        });
    },

    make_delivery_note: function (frm) {
        frappe.model.open_mapped_doc({
            method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
            frm: frm
        });
    },
    
    custom_cost_center_for_items: function (frm) {
        const custom_cost_center_for_items = frm.doc.custom_cost_center_for_items;
        frm.doc.items.map((item, index) => {
            frappe.model.set_value(item.doctype, item.name, "cost_center", custom_cost_center_for_items);
            frm.refresh_field("items");
        })
    }
});

function get_next_business_day(daysToAdd) {
    let date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

function fetch_available_stock_items(frm, refresh = false) {
    frappe.call({
        method: "farmex_crm_sales.py.item.get_available_stock_items",
        args: { user: frappe.session.user },
        callback: function (response) {
            if (response.message) {
                frm.fields_dict.items.grid.get_field('item_code').get_query = () => ({
                    filters: {
                        'name': ['in', response.message],
                        'is_sales_item': 1,
                        'has_variants': 0
                    }
                });

                if (refresh) {
                    frm.refresh_field('items');
                }
            }
        }
    });
}

function get_outstanding_amount(frm) {
    frappe.call({
        method: "farmex_crm_sales.py.party.new_get_dashboard_info",
        args: { party: frm.doc.customer, party_type: "Customer" },
        callback: function (response) {
            if (response.message && response.message[0]) {
                frm.set_value('custom_total_unpaid_amount', response.message[0].total_unpaid);
            }
        }
    });

    frappe.db.get_doc('Customer', frm.doc.customer).then(doc => {
        let credit_limit = doc.credit_limits.find(row => row.company === frm.doc.company)?.credit_limit || 0;
        frm.set_value('custom_total_credit_limit', credit_limit);
    });
}

function apply_item_filters(frm) {
    frm.fields_dict['items'].grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
        let row = locals[cdt][cdn];
        return row?.item_group ? { filters: { item_group: row.item_group } } : {};
    };
}

function add_custom_buttons(frm) {
    if (frm.doc.docstatus < 1) {
        frm.add_custom_button(__('Add Items'), () => show_grouped_item_dialog(frm));
    }
    frm.add_custom_button(__('View Account Receivable'), function () {
        window.open(`/app/query-report/Account%20Receivable%20Report?company=${frm.doc.company}&customer=${frm.doc.customer}`, "_blank");
    });
}

function add_delivery_note_button(frm) {
    frm.add_custom_button(__("Delivery Note"), function () {
        frappe.call({
            method: "frappe.desk.form.linked_with.get",
            args: { doctype: "Sales Order", docname: frm.doc.name },
            callback: function (response) {
                let delivery_notes = response.message?.["Delivery Note"]?.map(dn => dn.name).join(", ");
                if (delivery_notes) {
                    frappe.confirm(`The following Delivery Notes are linked: <b>${delivery_notes}</b><br>Proceed?`, () => frm.events.make_delivery_note(frm));
                } else {
                    frm.events.make_delivery_note(frm);
                }
            }
        });
    }, __("Create"));
}

function fetch_user_role(frm, callback) {
    frappe.call({
        method: "farmex_crm_sales.py.sales_order.get_value",
        args: {
            doctype: "User",
            filters: frappe.session.user,
            fieldname: "role_profile_name",
        },
        callback: function (r) {
            if (r.message) callback(r.message);
        }
    });
}

/** ✅ Fix: UOM Filter per Item Code */
function set_uom_filter(frm) {
    frm.fields_dict.items.grid.get_field('uom').get_query = function (doc, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row || !row.name) return {};

        return {
            filters: {
                'name': ['in', uom_lists[row.name] || []]
            }
        };
    };
    frm.refresh_field('items');
}

/** ✅ Fix: Fetch UOM List for Each Item */
function fetch_uom_list(frm, row) {
    if (!row.item_code) return Promise.resolve();

    return frappe.db.get_doc('Item', row.item_code).then(doc => {
        if (doc && doc.uoms) {
            uom_lists[row.name] = doc.uoms.map(u => u.uom);
        } else {
            uom_lists[row.name] = [];
        }

        // Apply updated filters after fetching UOMs
        set_uom_filter(frm);
    });
}


frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.item_code) return;

        // Fetch UOM list when a new item is added or changed
        fetch_uom_list(frm, row).then(() => set_uom_filter(frm));
    }
});
