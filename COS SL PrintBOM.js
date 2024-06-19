/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'], function (record, search, serverWidget) {

    function onRequest(context) {
        if (context.request.method === 'GET') {

            // Get Work Order ID from URL parameters
            var woId = context.request.parameters['recordid'];

            if (woId) {

                // Search for Assembly Unbuild records related to the Work Order
                var assemblyUnbuildSearch = search.create({
                    type: 'assemblyunbuild',
                    filters: [
                        ['custbody_cos_assemblyunbuild', 'anyof', woId],
                        'AND',
                        ['mainline', 'is', 'T']
                    ],
                    columns: [
                        'tranid',
                        'item',
                        'quantity'
                    ]
                });

                // Search for Item Fulfillment records related to the Work Order
                var itemSearch = search.create({
                    type: 'workorder',
                    filters: [

                        ['internalid', 'is', woId],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['cogs', 'is', 'F'],
                        'AND',
                        ['shipping', 'is', 'F'],
                        'AND',
                        ['mainline', 'is', 'F'],

                    ],
                    columns: [
                        search.createColumn({ name: 'quantity' }),
                        search.createColumn({ name: 'item' }),
                        search.createColumn({ name: 'itemid', join: 'item' }),
                        search.createColumn({ name: 'salesdescription', join: 'item' })
                    ]
                });

                var html = '';

                // Add the new table for Item Description and Quantity
                html += '<table style="width: 100%;"><tr><th colspan="4">Item</th><th colspan="2">Qty. Required </th><th colspan="2"></th><th colspan="2"></th></tr>';

                // Populate the table with item details from Item Fulfillment records
                itemSearch.run().each(function (result) {
                    var item = result.getValue({ name: 'itemid', join: 'item' });
                    var description = result.getValue({ name: 'salesdescription', join: 'item' })
                    var quantity = result.getValue({ name: 'quantity' });

                    html += '<tr>';
                    html += '<td colspan="4"><b>'+ item + '</b><br/>'+description+'</td>';
                    html += '<td colspan="2">' + quantity + '</td>';
                    html += '<td colspan="2"></td><td colspan="2"></td></tr>';

                    return true;
                });

                html += '</table>';
                var searchResultCount=assemblyUnbuildSearch.runPaged().count;
if(searchResultCount>0){
                // Add the existing table for Assembly Unbuild records
                html += '<table style="width: 100%;"><tr><th  colspan="3">Assembly Unbuild</th><th  colspan="8">Item</th><th colspan="3">Quantity</th></tr>';

                // Loop through search results and populate the HTML table
                assemblyUnbuildSearch.run().each(function (result) {
                    var assemblyItem = result.getValue('tranid');
                    var item = result.getText('item');
                    var quantity = -1 * (result.getValue('quantity'));

                    html += '<tr>';
                    html += '<td  colspan="3">' + assemblyItem + '</td>';
                    html += '<td  colspan="8">' + item + '</td>';
                    html += '<td  colspan="3">' + quantity + '</td>';
                    html += '</tr>';

                    return true;
                });

                html += '</table>';
            }
                html = html.replace(/&/g, "&amp;")

            }
            log.debug("HTML")

            context.response.write(html);
        }
    }

    return {
        onRequest: onRequest
    };
});
