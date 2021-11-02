odoo.define('tit_pos_paiement.PaymentScreenPaymentLines', function (require) {
    'use strict';

    const PaymentScreenPaymentLines = require('point_of_sale.PaymentScreenPaymentLines');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { Gui } = require('point_of_sale.Gui');
   const PosComponent  = require('point_of_sale.PosComponent');
   const AbstractAwaitablePopup =    require('point_of_sale.AbstractAwaitablePopup');

  const Pos_P_PaymentLines = (PaymentScreenPaymentLines) =>
        class extends PaymentScreenPaymentLines {
            constructor() {
            super(...arguments);
            useListener('edit-cheque', this.click_edit_cheque_paymentline); 
            useListener('edit-cheque_normal', this.click_edit_cheque_paymentline_normal); 
            useListener('edit-cheque_kdo', this.click_edit_cheque_paymentline_kdo); 
            }

            async click_edit_cheque_paymentline(cid) {
                //Afficher le pop up du chèque différé
                var self = this;
                var lines = this.env.pos.get_order().get_paymentlines();
                var check_number = false;
                var check_date = false;
                var deffered_check = false;
                var valid_check=false;
                const { confirmed, payload } = await this.showPopup('ChequeDifPopup', {
                       title: this.env._t('Chéque différé'),
                       body: this.env._t('This click is successfully done.'),
                   });
                   if (confirmed) 
                   {
                    check_number  = payload[0];
                    check_date = payload[1];
                     if (check_number &&  check_date)
                    {
                        valid_check = true;
                    }

                    if (valid_check == false )
                      {
                          this.showPopup('ErrorPopup', {
                              title: this.env._t('Numéro de chéque / Date'),
                              body: this.env._t('Numéro de chéque / date est obligatoire.'),
                          });
                      }
                      this.env.pos.get_order().selected_paymentline.check_number = check_number;
                      this.env.pos.get_order().selected_paymentline.check_date = check_date;
                   }
               
                this.render();
            }
             async click_edit_cheque_paymentline_normal(cid) {
                //Afficher le pop up du chèque
                var self = this;
                var valid_check=false;
                var check_number = false;
                var deffered_check = false;
                var lines = this.env.pos.get_order().get_paymentlines();
                const { confirmed, payload } = await this.showPopup('ChequeNormPopup', {
                       title: this.env._t('Chéque'),
                       body: this.env._t('This click is successfully done.'),
                   });
                   if (confirmed) {

                    check_number=payload;
                    if (check_number != 0)
                    {
                        valid_check = true;
                    }
                    if (valid_check == false )
                      {
                          this.showPopup('ErrorPopup', {
                              title: this.env._t('Numéro de chéque'),
                              body: this.env._t('Numéro de chéque est obligatoire.'),
                          });
                      }
                    this.env.pos.get_order().selected_paymentline.check_number = check_number;
                   }
                    
                this.render();
            }
             async click_edit_cheque_paymentline_kdo(cid) {
                //Afficher le pop up du chèque KDO
                var self = this;
                var valid_check=false;
                var lines = this.env.pos.get_order().get_paymentlines();
                var deffered_check = false;
                const { confirmed, payload } = await this.showPopup('ChequeKdoPopup', {
                       title: this.env._t('Chéque KDO'),
                       body: this.env._t('This click is successfully done.'),
                   });
                   if (confirmed) {
                       var check_date=payload;

                    if (check_date != 0)
                    {
                        valid_check = true;
                    }

                    if (valid_check == false )
                      {
                          this.showPopup('ErrorPopup', {
                              title: this.env._t('Date du chéque'),
                              body: this.env._t('La date du chéque est obligatoire.'),
                          });
                      }
                      this.env.pos.get_order().selected_paymentline.check_date = check_date;
                   }
                this.render();
            }
        };

    Registries.Component.extend(PaymentScreenPaymentLines, Pos_P_PaymentLines);
    return PaymentScreenPaymentLines;
});
