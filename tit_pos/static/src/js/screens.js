odoo.define('tit_pos.screens', function(require) {
    'use strict';

    const ClientDetailsEdit = require('point_of_sale.ClientDetailsEdit');
    const Registries = require('point_of_sale.Registries');
    var { Gui } = require('point_of_sale.Gui');
    var models = require('point_of_sale.models');
    const { useState } = owl.hooks;
    var rpc = require('web.rpc');
    
    models.load_fields('res.partner',[ 'customer_rank', 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']);
    var _super_pos_model = models.PosModel.prototype;
    var _models = models.PosModel.prototype.models;

    for (var i=0; i<_models.length;i++) {
        if(_models[i]['model'] == 'res.partner')
        {
            _models[i]['domain']  = function(self){ return [['customer_rank', '!=', 0]]};
        }
    }

    models.PosModel = models.PosModel.extend({
        /* reload the list of partner, returns as a promise that resolves if there were
         updated partners, and fails if not*/
        load_new_partners: function(){
            /* overriding the existing function to associate it into the new unction
            wich return the the domaine existing in native function with the name 
            'prepare_new_partners_domain'
            */
            var self = this;
            return new Promise(function (resolve, reject) {
                var fields = _.find(self.models, function(model){ return model.label === 'load_partners'; }).fields;
                var domain = self.prepare_new_partners_domain_all_contact();
                self.rpc({
                    model: 'res.partner',
                    method: 'search_read',
                    args: [domain, fields],
                }, {
                    timeout: 3000,
                    shadow: true,
                })
                .then(function (partners) {
                    if (self.db.add_partners(partners)) {   // check if the partners we got were real updates
                        resolve();
                    } else {        
                        reject('Failed in updating partners.');
                    }
                }, function (type, err) { reject(); });
            });
        },

        prepare_new_partners_domain: function(){
            // overriding the existing function to change the domain of contact displaied
            var domain = _super_pos_model.prepare_new_partners_domain.apply(this, arguments);
            domain.push(['customer_rank', '!=', 0]);
            return domain;
        },
        prepare_new_partners_domain_all_contact: function(){
            /*this function return the domain to be used in chargement of custumer after 
            edditing once or creation a new one*/
            return [['write_date','>', this.db.get_partner_write_date()]];
        },
    });

const POSSaveClientOverride = ClientDetailsEdit =>
        class extends ClientDetailsEdit {
            constructor() {
            super(...arguments);
            this.intFields = [ 'country_id', 'state_id', 'property_product_pricelist'];
            this.changes = {};
            var child = false;
            var child_id;
            
            }

            /**
             * Save to field `changes` all input changes from the form fields.
             */
            captureChange(event) {
                this.changes[event.target.name] = event.target.value;
                var contents = $('.client-details-contents');
                var val = $('input[name=company_type]:checked').val();
                if (val === 'person') {
                    contents.find(".client-details-box-contact-left").addClass('oe_hidden');
                    contents.find(".client-details-box-contact-right").addClass('oe_hidden');
                    contents.find(".client-detail-siren").addClass('oe_hidden');
                    contents.find(".client-detail-nic").addClass('oe_hidden');

                } else if (val === 'company') {
                    contents.find(".client-details-box-contact-left").removeClass('oe_hidden');
                    contents.find(".client-details-box-contact-right").removeClass('oe_hidden');
                    contents.find(".client-detail-siren").removeClass('oe_hidden');
                    contents.find(".client-detail-nic").removeClass('oe_hidden');
                }
            }
            /**
            * @override
            */
            async saveChanges(event) {
            try {
                let processedChanges = {};
                if (this.contact_associe){    
                    processedChanges['contact_id'] = this.contact_associe.id
                }
                else{
                    processedChanges['contact_id'] = 0
                }

                for (let [key, value] of Object.entries(this.changes)) {
                    if (this.intFields.includes(key)) {
                        if((key == 'contact_name') || (key == 'contact_phone') || (key == 'contact_email')){
                            processedChanges[key] = parseInt(value) || false;
                        }
                        else{
                            processedChanges[key] = parseInt(value) || false;
                        }
                    } else {
                        if((key == 'contact_name') || (key == 'contact_phone') || (key == 'contact_email')){
                            processedChanges[key] = value;
                        }
                        else{
                            processedChanges[key] = value;
                        }
                    }
                }
                var company_type_checked = $('input[name="company_type"]');
                var company_type_checked_value = company_type_checked.filter(':checked').val();
                if(!company_type_checked_value){
                    return this.showPopup('ErrorPopup', {
                      title:('Le type d\'un client est requis'),
                    });
                }
                else {

                if ((!this.props.partner.name && !processedChanges.name) ||
                    processedChanges.name === '' ){
                    return this.showPopup('ErrorPopup', {
                      title: ('Le nom et prénom du client est requis'),
                    });
                }

                if (processedChanges.property_account_position_id > 0){
                    processedChanges['property_account_position_id'] = parseInt(processedChanges.property_account_position_id) || 0
                }

                processedChanges['company_type'] = company_type_checked_value
                if (company_type_checked_value === 'company') {
                    //Le cas d'une société

                    if ((!this.props.partner.phone && !processedChanges.phone) ||
                        processedChanges.phone === '' ){
                        return this.showPopup('ErrorPopup', {
                          title:('Le numéro de téléphone du client est requis'),
                        });
                    }
                    if ((!this.props.partner.country_id && !processedChanges.country_id) ||
                        (processedChanges.country_id == 0)){
                        return this.showPopup('ErrorPopup', {
                          title:('Le pays est requis'),
                        });
                    }
                    if ((!this.props.partner.siren_company && !processedChanges.siren_company) ||
                    processedChanges.siren_company === '' ){
                    return this.showPopup('ErrorPopup', {
                      title: ('SIREN est requis'),
                        });
                    }
                    }
                  if(!processedChanges.hasOwnProperty('contact_name')){
                     processedChanges['contact_name']='';
                 }
                processedChanges.id = this.props.partner.id || false;
                processedChanges['customer_rank'] = 1
                
                this.trigger('save-changes', { processedChanges });
                
            }
            } catch (error) {
                throw error;
            }
            }               
        };
    Registries.Component.extend(ClientDetailsEdit, POSSaveClientOverride);
    return ClientDetailsEdit;
});
