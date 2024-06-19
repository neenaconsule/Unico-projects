/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/runtime', 'N/search'],

    function(record, runtime, search) {

            function getInputData() {
                    try{

                            log.debug('***Inside getInputData***');
                            var scriptParam = runtime.getCurrentScript();
                            var items_unbuild = scriptParam.getParameter('custscript_items_unbuild');
                            log.debug('items_unbuild',items_unbuild);

                            return JSON.parse(items_unbuild);

                    }catch(error){
                            let errorMessage ='';
                            if (error.getDetails !== undefined){
                                    errorMessage = error.getDetails();
                                    log.error('Process Error ',error.getCode() + ':' + error.getDetails());
                            }
                            else{
                                    errorMessage = error.toString();
                                    log.error('Error in Script Parameters ',error.toString());
                            }
                    }
            }

            function map(context) {

                    //log.debug('***Inside map***');

                    log.debug('context',context);

                    context.write({
                            key: context.key,
                            value: context.value
                    });
            }

            function reduce(context) {

                try{
                    log.debug('***Inside reduce***');

                    log.debug('context',JSON.stringify(context));

                    log.debug('context key',context.key);
                    log.debug('context value',context.values[0]);

                    let item_unbuild_id = context.key;
                    let item_unbuild_data = JSON.parse(context.values[0]);

                    log.debug('item_unbuild_id',item_unbuild_id);
                    log.debug('item_unbuild_data',item_unbuild_data);

                    let location = item_unbuild_data['location'];
                    let unbuild_qty = item_unbuild_data['qty'];
                    let wo_id = item_unbuild_data['wo_id'];

                    log.debug('location',location);
                    log.debug('unbuild_qty',unbuild_qty);
                    log.debug('wo_id',wo_id);

                    let unbuildAssemblyRecObj = record.create({
                        type: record.Type.ASSEMBLY_UNBUILD,
                        isDynamic: true
                    });

                    unbuildAssemblyRecObj.setValue({fieldId: 'item', value: item_unbuild_id });
                    unbuildAssemblyRecObj.setValue({fieldId: 'location', value: location });
                    unbuildAssemblyRecObj.setValue({fieldId: 'quantity', value: unbuild_qty });
                    unbuildAssemblyRecObj.setValue({fieldId: 'custbody_cos_assemblyunbuild', value: wo_id})
                    let unbuildAssemblyRecId = unbuildAssemblyRecObj.save();
                    log.debug('unbuildAssemblyRecId',unbuildAssemblyRecId);


if(wo_id){
// Set the assembly unbuild record ID directly in the work order record
let woRec = record.load({
        type: record.Type.WORK_ORDER,
        id: wo_id,
        isDynamic: true
    });

    let existingAssemblyUnbuildIds = woRec.getValue({ fieldId: 'custbody_multiselect_field' }) || [];
    existingAssemblyUnbuildIds.push(unbuildAssemblyRecId);

    woRec.setValue({
        fieldId: 'custbody_multiselect_field', // Change to your multiselect field ID
        value: existingAssemblyUnbuildIds
    });

    woRec.save();
}


                    context.write({
                        key: wo_id,
                        value: wo_id
                    })

                }catch(e){
                    log.debug('Error in Reduce:',e.message);
                }

            }

            function summarize(context) {
                    try{
                            log.debug('***Inside Summarize***');

                            let wo_id;
                            context.output.iterator().each(function(key, value) {
                                log.debug('key', key);
                                wo_id = key;
                                return true;
                            });
                            log.debug('wo_id', wo_id);

                            let wo_id_save = record.submitFields({
                                type: record.Type.WORK_ORDER,
                                id: wo_id,
                                values: {
                                    'orderstatus' : 'B'
                                }
                            });
                            log.debug('wo_id_save', wo_id_save);

                            let assemblyBuildRec = record.transform({
                                fromType: record.Type.WORK_ORDER,
                                toType: record.Type.ASSEMBLY_BUILD,
                                fromId: wo_id_save,
                                isDynamic : true
                            })

                            let assemblyBuildRecId = assemblyBuildRec.save();
                            log.debug('assemblyBuildRecId', assemblyBuildRecId);

                    }catch(e){
                            log.debug('Error in Summarize:',e.message);
                    }
            }

            function isEmpty(string)
            {
                    return string === '' || string == null;

            }

            return {
                    getInputData: getInputData,
                    map: map,
                    reduce: reduce,
                    summarize: summarize
            };

    });