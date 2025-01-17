// frappe.listview_settings['Sales Order'] = {
//     onload: function(listview) {
//         // Fetch the filters from the Python method
//         frappe.call({
//             method: "farmex_crm_sales.py.sales_order_list.get_sales_order_list_filters",
//             callback: function(response) {
//                 const filters = response.message || [];

//                 // Apply the filters dynamically
//                 if (filters.length > 0) {
//                     filters.forEach(filter => {
//                         const existingFilters = listview.filter_area.get();
//                         const isFilterAlreadySet = existingFilters.some(existingFilter =>
//                             existingFilter[0] === filter[0] &&
//                             existingFilter[1] === filter[1] &&
//                             existingFilter[2] === filter[2] &&
//                             existingFilter[3] === filter[3]
//                         );

//                         // Add filter only if it doesn't already exist
//                         if (!isFilterAlreadySet) {
//                             listview.filter_area.add([filter]);
//                         }
//                     });

//                     // Prevent the user from removing the filter
//                     const original_remove_filters = listview.filter_area.remove_filters;
//                     listview.filter_area.remove_filters = function() {
//                         frappe.msgprint(__('You are not allowed to remove this filter.'));
//                     };
//                 }
//             }
//         });
//     }
// };


// frappe.listview_settings['Sales Order'] = {
//     onload: function(listview) {
//         // Fetch the filters from the Python method
//         frappe.call({
//             method: "farmex_crm_sales.py.sales_order_list.get_sales_order_list_filters",
//             callback: function(response) {
//                 const filters = response.message || [];

//                 // Ensure the default filter to be reapplied
//                 const defaultFilter = ["Sales Order", "docstatus", "=", 1];

//                 // Add the default filter when the page loads
//                 const existingFilters = listview.filter_area.get();
//                 const isFilterAlreadySet = existingFilters.some(existingFilter =>
//                     JSON.stringify(existingFilter) === JSON.stringify(defaultFilter)
//                 );

//                 if (!isFilterAlreadySet) {
//                     listview.filter_area.add([defaultFilter]);

//                     // Disable the clear (remove) icon for the specific filter
//                     setTimeout(() => {
//                         const filterElement = listview.$page
//                             .find(`.filter-pill:contains(${defaultFilter[2]})`); // Assuming filter[2] is the value

//                         // Remove the clear icon (X)
//                         filterElement.find('.filter-remove').remove();
//                     }, 500);

//                     console.log(`Filter ${JSON.stringify(defaultFilter)} added successfully.`);
//                 }

//                 // Prevent users from removing the unique filter
//                 const original_remove_filters = listview.filter_area.remove_filters;
//                 listview.filter_area.remove_filters = function() {
//                     frappe.msgprint(__('You are not allowed to remove this filter.'));
//                 };

//                 // Reapply the default filter when clearing the filter area
//                 const original_clear_filters = listview.filter_area.clear_filters;
//                 listview.filter_area.clear_filters = function() {
//                     // Clear the filters as usual
//                     original_clear_filters.apply(this);

//                     // Reapply the default filter after clearing
//                     setTimeout(() => {
//                         const existingFiltersAfterClear = listview.filter_area.get();
//                         const isFilterAlreadySetAfterClear = existingFiltersAfterClear.some(existingFilter =>
//                             JSON.stringify(existingFilter) === JSON.stringify(defaultFilter)
//                         );

//                         if (!isFilterAlreadySetAfterClear) {
//                             listview.filter_area.add([defaultFilter]);

//                             // Disable the clear (remove) icon for the specific filter
//                             setTimeout(() => {
//                                 const filterElement = listview.$page
//                                     .find(`.filter-pill:contains(${defaultFilter[2]})`);

//                                 // Remove the clear icon (X)
//                                 filterElement.find('.filter-remove').remove();
//                             }, 500);

//                             console.log(`Filter ${JSON.stringify(defaultFilter)} re-applied after clearing.`);
//                         }
//                     }, 500); // Delay to ensure the filter area is cleared before reapplying the filter
//                 };
//             }
//         });
//     }
// };

